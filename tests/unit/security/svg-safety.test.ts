import { describe, it, expect, vi } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// ---------------------------------------------------------------------------
// Mocks — service-role client for uploadFile() bucket-guard tests
// ---------------------------------------------------------------------------

const { uploadMock } = vi.hoisted(() => ({
  uploadMock: vi
    .fn()
    .mockResolvedValue({ data: { path: 'test/path', id: 'test-id' }, error: null }),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: uploadMock,
        remove: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.test' } }),
        createSignedUrls: vi.fn().mockResolvedValue({ data: [{ signedUrl: 'https://signed.test' }] }),
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
        move: vi.fn().mockResolvedValue({ data: null, error: null }),
        copy: vi.fn().mockResolvedValue({ data: { path: 'test/path' } }),
      })),
    },
  })),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

const { inspectSvgSafety, validateUploadFile } = await import(
  '@/lib/supabase/upload-validation'
);
const { uploadFile } = await import('@/lib/supabase/storage');

function svgBytes(content: string): Buffer {
  return Buffer.from(content, 'utf-8');
}

function svgFile(content: string, name = 'asset.svg'): File {
  return new File([svgBytes(content) as unknown as BlobPart], name, { type: 'image/svg+xml' });
}

const MINIMAL_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#f00"/></svg>';

// ---------------------------------------------------------------------------
// Malicious SVG payloads — must all be rejected
// ---------------------------------------------------------------------------

describe('inspectSvgSafety() — malicious SVG payloads', () => {
  it('rejects a script element', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/script/i);
  });

  it('rejects an uppercase SCRIPT element', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><SCRIPT>alert(1)</SCRIPT></svg>'),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects an onload event handler on the root element', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/event handler/i);
  });

  it('rejects an onclick event handler on a child element', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><circle onclick="alert(1)" r="1"/></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/event handler/i);
  });

  it('rejects entity-obfuscated event handler attributes (fail-closed)', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg" &#111;nload="alert(1)"></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/event handler/i);
  });

  it('rejects javascript: href URLs', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)">x</a></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/javascript/i);
  });

  it('rejects numeric-entity-obfuscated javascript: URLs', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><a href="&#106;avascript:alert(1)">x</a></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/javascript/i);
  });

  it('rejects case-variant JaVaScRiPt: URLs', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><a href="JaVaScRiPt:alert(1)">x</a></svg>'),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects foreignObject (HTML embedding)', () => {
    const result = inspectSvgSafety(
      svgBytes(
        '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><img src="x"/></body></foreignObject></svg>',
      ),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/foreignObject|embedded HTML/i);
  });

  it('rejects iframe / embed / object elements', () => {
    for (const el of ['iframe', 'embed', 'object']) {
      const result = inspectSvgSafety(
        svgBytes(`<svg xmlns="http://www.w3.org/2000/svg"><${el}></${el}></svg>`),
      );
      expect(result.safe, `expected ${el} to be rejected`).toBe(false);
    }
  });

  it('rejects DOCTYPE / ENTITY declarations (XXE, billion laughs)', () => {
    const result = inspectSvgSafety(
      svgBytes(
        '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY lol "lol">]><svg xmlns="http://www.w3.org/2000/svg">&lol;</svg>',
      ),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/DOCTYPE|ENTITY/i);
  });

  it('rejects SMIL animate elements used to rewrite href to javascript:', () => {
    const result = inspectSvgSafety(
      svgBytes(
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="#"><text>x</text><animate attributeName="href" values="javascript:alert(1)" begin="0s"/></a></svg>',
      ),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects SMIL set elements targeting event handler attributes', () => {
    const result = inspectSvgSafety(
      svgBytes(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect><set attributeName="onclick" to="alert(1)" begin="0s"/></rect></svg>',
      ),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects data:text/html URLs', () => {
    const result = inspectSvgSafety(
      svgBytes(
        '<svg xmlns="http://www.w3.org/2000/svg"><a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a></svg>',
      ),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/data:|script/i);
  });

  it('rejects data:image/svg+xml URLs (nested SVG payload)', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="/></svg>'),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects external https: references in href', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><a href="https://evil.example/payload.svg#x">x</a></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/URL references/i);
  });

  it('rejects protocol-relative // references in xlink:href', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><use xlink:href="//evil.example/x.svg#a"/></svg>'),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects external http: images (tracking exfiltration)', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><image href="http://evil.example/pixel.png"/></svg>'),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects relative-path URL references', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><image href="../secrets.png"/></svg>'),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects @import rules', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><style>@import url("https://evil.example/x.css");</style></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/@import/i);
  });

  it('rejects external url() references in paint servers', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://evil.example/paint)"/></svg>'),
    );
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/url\(\)/i);
  });

  it('rejects javascript: url() references', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(javascript:alert(1))"/></svg>'),
    );
    expect(result.safe).toBe(false);
  });

  it('rejects NUL bytes anywhere in the buffer', () => {
    const withNul = Buffer.concat([svgBytes('<svg xmlns="http://www.w3.org/2000/svg"/>'), Buffer.from([0x00])]);
    const result = inspectSvgSafety(withNul);
    expect(result.safe).toBe(false);
    if (!result.safe) expect(result.reason).toMatch(/NUL/i);
  });

  it('keeps double-encoded markup inert after a single decode pass (XML semantics)', () => {
    // Real XML decodes &amp;lt; once to the inert text "&lt;script&gt;", which
    // never becomes markup. The inspector mirrors that single pass.
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg">&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;</svg>'),
    );
    expect(result.safe).toBe(true);
  });

  it('rejects single-encoded markup that decodes to a script tag (fail-closed)', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg">&lt;script&gt;alert(1)&lt;/script&gt;</svg>'),
    );
    expect(result.safe).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Legitimate SVG behaviour — must be accepted
// ---------------------------------------------------------------------------

describe('inspectSvgSafety() — legitimate SVG content', () => {
  it('accepts a minimal shape-only SVG', () => {
    expect(inspectSvgSafety(svgBytes(MINIMAL_SVG)).safe).toBe(true);
  });

  it('accepts an XML-declared SVG with the namespace attribute', () => {
    const result = inspectSvgSafety(
      svgBytes('<?xml version="1.0" encoding="UTF-8"?>' + MINIMAL_SVG),
    );
    expect(result.safe).toBe(true);
  });

  it('accepts local fragment references (sprites, gradients, patterns)', () => {
    const result = inspectSvgSafety(
      svgBytes(
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="g"/></defs><rect fill="url(#g)"/><use xlink:href="#icon"/><a href="#section"><text>x</text></a></svg>',
      ),
    );
    expect(result.safe).toBe(true);
  });

  it('accepts an embedded raster data: image', () => {
    const result = inspectSvgSafety(
      svgBytes(
        '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,iVBORw0KGgo="/></svg>',
      ),
    );
    expect(result.safe).toBe(true);
  });

  it('accepts xmlns namespace declarations that contain http:// URLs', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"/>'),
    );
    expect(result.safe).toBe(true);
  });

  it('accepts presentation attributes and style="" declarations', () => {
    const result = inspectSvgSafety(
      svgBytes('<svg xmlns="http://www.w3.org/2000/svg"><rect style="fill:#fff;stroke:#000" stroke-width="2"/></svg>'),
    );
    expect(result.safe).toBe(true);
  });

  it('accepts every repo-provided country flag SVG (zero false positives)', () => {
    const flagsDir = join(process.cwd(), 'public', 'flags');
    const flags = readdirSync(flagsDir).filter((f) => f.endsWith('.svg'));
    expect(flags.length).toBeGreaterThan(150);
    const rejected: string[] = [];
    for (const flag of flags) {
      const buffer = readFileSync(join(flagsDir, flag));
      const result = inspectSvgSafety(buffer);
      if (!result.safe) rejected.push(`${flag}: ${result.reason}`);
    }
    expect(rejected).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// validateUploadFile() integration — UNSAFE_SVG_CONTENT + svgz removal
// ---------------------------------------------------------------------------

describe('validateUploadFile() — SVG safety (Phase 8)', () => {
  it('accepts a benign SVG for CMS media', async () => {
    const result = await validateUploadFile(svgFile(MINIMAL_SVG, 'logo.svg'), 'cmsMedia');
    expect(result.valid).toBe(true);
  });

  it('rejects a script-carrying SVG with UNSAFE_SVG_CONTENT', async () => {
    const result = await validateUploadFile(
      svgFile('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>', 'logo.svg'),
      'cmsMedia',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('UNSAFE_SVG_CONTENT');
  });

  it('rejects an event-handler SVG with UNSAFE_SVG_CONTENT', async () => {
    const result = await validateUploadFile(
      svgFile('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>', 'logo.svg'),
      'cmsMedia',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('UNSAFE_SVG_CONTENT');
  });

  it('rejects an external-reference SVG with UNSAFE_SVG_CONTENT', async () => {
    const result = await validateUploadFile(
      svgFile('<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>', 'logo.svg'),
      'cmsMedia',
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('UNSAFE_SVG_CONTENT');
  });

  it('rejects a legitimate-looking SVG named .svgz (compressed SVG not permitted)', async () => {
    const result = await validateUploadFile(svgFile(MINIMAL_SVG, 'logo.svgz'), 'cmsMedia');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('EXTENSION_MISMATCH');
  });

  it('still rejects SVG type for categories that never allowed it', async () => {
    const result = await validateUploadFile(svgFile(MINIMAL_SVG, 'car.svg'), 'vehicleImages');
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.code).toBe('INVALID_TYPE');
  });

  it('non-SVG categories are unaffected by the SVG inspector (valid PNG still accepted)', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const result = await validateUploadFile(
      new File([png as unknown as BlobPart], 'car.png', { type: 'image/png' }),
      'vehicleImages',
    );
    expect(result.valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// uploadFile() — private-bucket SVG guard (defence-in-depth)
// ---------------------------------------------------------------------------

describe('uploadFile() — SVG private-bucket guard (Phase 8)', () => {
  it('rejects SVG content for the private documents bucket', async () => {
    await expect(
      uploadFile('documents', 'evil.svg', svgBytes(MINIMAL_SVG), {
        contentType: 'image/svg+xml',
      }),
    ).rejects.toMatchObject({ code: 'SVG_PRIVATE_BUCKET_FORBIDDEN' });
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it('still allows SVG for the public media bucket at the low level', async () => {
    uploadMock.mockClear();
    const result = await uploadFile('media', 'logo.svg', svgBytes(MINIMAL_SVG), {
      contentType: 'image/svg+xml',
    });
    expect(result.path).toBe('test/path');
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });

  it('still allows non-SVG content for the documents bucket (unchanged private handling)', async () => {
    uploadMock.mockClear();
    const result = await uploadFile('documents', 'invoice.pdf', Buffer.from('%PDF-1.4\n'), {
      contentType: 'application/pdf',
    });
    expect(result.path).toBe('test/path');
    expect(uploadMock).toHaveBeenCalledTimes(1);
  });
});
