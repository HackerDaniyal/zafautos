import { describe, it, expect } from 'vitest';
import { sanitizeCmsHtml } from '@/lib/utils/htmlSanitize';
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '../../../src');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(SRC, relPath), 'utf-8');
}

describe('XSS — sanitizeCmsHtml()', () => {
  describe('Script injection', () => {
    it('removes <script> tags', () => {
      expect(sanitizeCmsHtml('<script>alert("xss")</script>')).toBe('');
    });

    it('removes <script> with src attribute', () => {
      expect(sanitizeCmsHtml('<script src="https://evil.com/steal.js"></script>')).toBe('');
    });

    it('removes nested script tags', () => {
      expect(sanitizeCmsHtml('<div><script>alert(1)</script></div>')).toBe('<div></div>');
    });

    it('removes script with whitespace variations', () => {
      expect(sanitizeCmsHtml('<script\t>alert(1)</script\t>')).toBe('');
    });
  });

  describe('Event handler attributes', () => {
    it('removes onclick from links', () => {
      expect(sanitizeCmsHtml('<a href="#" onclick="alert(1)">click</a>')).toBe('<a href="#">click</a>');
    });

    it('removes onerror from images', () => {
      const result = sanitizeCmsHtml('<img src=x onerror="alert(1)">');
      expect(result).not.toContain('onerror');
      expect(result).toContain('src="x"');
    });

    it('removes onload from body', () => {
      expect(sanitizeCmsHtml('<body onload="alert(1)">')).toBe('');
    });

    it('removes onmouseover', () => {
      expect(sanitizeCmsHtml('<div onmouseover="alert(1)">hover</div>')).toBe('<div>hover</div>');
    });

    it('removes onfocus', () => {
      expect(sanitizeCmsHtml('<input onfocus="alert(1)">')).toBe('');
    });

    it('removes oninput', () => {
      expect(sanitizeCmsHtml('<input oninput="alert(1)">')).toBe('');
    });
  });

  describe('Dangerous URLs', () => {
    it('removes javascript: URLs from links', () => {
      const result = sanitizeCmsHtml('<a href="javascript:alert(1)">click</a>');
      expect(result).not.toContain('javascript:');
      expect(result).toContain('click');
    });

    it('removes data: URLs from links', () => {
      const result = sanitizeCmsHtml('<a href="data:text/html,<script>alert(1)</script>">click</a>');
      expect(result).not.toContain('data:');
    });

    it('removes data: URLs from img src', () => {
      const result = sanitizeCmsHtml('<img src="data:image/png;base64,abc123" alt="pic">');
      expect(result).not.toContain('data:');
      expect(result).toContain('alt="pic"');
    });

    it('removes data:svg XSS from img src', () => {
      const result = sanitizeCmsHtml('<img src="data:image/svg+xml,<svg onload=alert(1)>">');
      expect(result).not.toContain('data:');
      expect(result).not.toContain('onload');
    });

    it('allows http and https URLs', () => {
      expect(sanitizeCmsHtml('<a href="https://example.com">link</a>')).toContain('https://example.com');
      expect(sanitizeCmsHtml('<a href="http://example.com">link</a>')).toContain('http://example.com');
    });

    it('allows mailto URLs', () => {
      expect(sanitizeCmsHtml('<a href="mailto:test@example.com">email</a>')).toContain('mailto:test@example.com');
    });

    it('removes vbscript: URLs', () => {
      const result = sanitizeCmsHtml('<a href="vbscript:MsgBox(1)">click</a>');
      expect(result).not.toContain('vbscript:');
    });
  });

  describe('HTML injection with allowed tags', () => {
    it('preserves headings', () => {
      expect(sanitizeCmsHtml('<h1>Title</h1>')).toBe('<h1>Title</h1>');
      expect(sanitizeCmsHtml('<h2>Subtitle</h2>')).toBe('<h2>Subtitle</h2>');
      expect(sanitizeCmsHtml('<h3>Section</h3>')).toBe('<h3>Section</h3>');
    });

    it('preserves paragraphs', () => {
      expect(sanitizeCmsHtml('<p>Hello world</p>')).toBe('<p>Hello world</p>');
    });

    it('preserves emphasis', () => {
      expect(sanitizeCmsHtml('<strong>bold</strong>')).toBe('<strong>bold</strong>');
      expect(sanitizeCmsHtml('<em>italic</em>')).toBe('<em>italic</em>');
    });

    it('preserves links with safe URLs', () => {
      expect(sanitizeCmsHtml('<a href="https://example.com" title="Link">text</a>'))
        .toContain('href="https://example.com"');
    });

    it('preserves lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizeCmsHtml(html)).toBe(html);
    });

    it('preserves ordered lists', () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      expect(sanitizeCmsHtml(html)).toBe(html);
    });

    it('preserves blockquotes', () => {
      expect(sanitizeCmsHtml('<blockquote>Quote</blockquote>')).toContain('blockquote');
    });

    it('preserves code blocks', () => {
      expect(sanitizeCmsHtml('<pre><code>const x = 1;</code></pre>')).toContain('pre');
      expect(sanitizeCmsHtml('<pre><code>const x = 1;</code></pre>')).toContain('code');
    });

    it('preserves inline code', () => {
      expect(sanitizeCmsHtml('<code>x = 1</code>')).toBe('<code>x = 1</code>');
    });

    it('preserves tables', () => {
      const html = '<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Value</td></tr></tbody></table>';
      expect(sanitizeCmsHtml(html)).toContain('table');
      expect(sanitizeCmsHtml(html)).toContain('thead');
      expect(sanitizeCmsHtml(html)).toContain('tbody');
    });

    it('preserves images with safe URLs', () => {
      expect(sanitizeCmsHtml('<img src="https://example.com/img.jpg" alt="photo" />'))
        .toContain('src="https://example.com/img.jpg"');
    });

    it('preserves div and span', () => {
      expect(sanitizeCmsHtml('<div class="custom"><span>text</span></div>')).toContain('div');
      expect(sanitizeCmsHtml('<div class="custom"><span>text</span></div>')).toContain('span');
    });

    it('preserves horizontal rules', () => {
      expect(sanitizeCmsHtml('<hr />')).toBe('<hr />');
    });

    it('preserves line breaks', () => {
      expect(sanitizeCmsHtml('line 1<br />line 2')).toContain('br');
    });
  });

  describe('Attribute injection', () => {
    it('removes class attribute (not in allowlist)', () => {
      const result = sanitizeCmsHtml('<p class="malicious">text</p>');
      expect(result).not.toContain('class');
      expect(result).toContain('text');
    });

    it('removes style attribute', () => {
      const result = sanitizeCmsHtml('<p style="background:url(javascript:alert(1))">text</p>');
      expect(result).not.toContain('style');
    });

    it('removes id attribute', () => {
      const result = sanitizeCmsHtml('<div id="evil">text</div>');
      expect(result).not.toContain('id');
    });

    it('removes data-* attributes', () => {
      const result = sanitizeCmsHtml('<div data-reactid="123">text</div>');
      expect(result).not.toContain('data-reactid');
    });

    it('preserves allowed img attributes', () => {
      const result = sanitizeCmsHtml('<img src="https://example.com/img.jpg" alt="photo" width="100" height="200" />');
      expect(result).toContain('src=');
      expect(result).toContain('alt=');
      expect(result).toContain('width=');
      expect(result).toContain('height=');
    });

    it('preserves allowed a attributes', () => {
      const result = sanitizeCmsHtml('<a href="https://example.com" title="Link">text</a>');
      expect(result).toContain('href=');
      expect(result).toContain('title=');
    });

    it('auto-adds rel=noopener noreferrer to target=_blank links', () => {
      const result = sanitizeCmsHtml('<a href="https://evil.com" target="_blank">click</a>');
      expect(result).toContain('target="_blank"');
      expect(result).toContain('rel="noopener noreferrer"');
    });

    it('does not add rel to links without target=_blank', () => {
      const result = sanitizeCmsHtml('<a href="https://example.com">link</a>');
      expect(result).not.toContain('rel=');
    });
  });

  describe('Polyglot and advanced payloads', () => {
    it('removes SVG-based XSS', () => {
      const result = sanitizeCmsHtml('<svg onload="alert(1)">');
      expect(result).not.toContain('svg');
      expect(result).not.toContain('onload');
    });

    it('removes iframe injection', () => {
      expect(sanitizeCmsHtml('<iframe src="https://evil.com"></iframe>')).not.toContain('iframe');
    });

    it('removes object injection', () => {
      expect(sanitizeCmsHtml('<object data="evil.swf"></object>')).not.toContain('object');
    });

    it('removes embed injection', () => {
      expect(sanitizeCmsHtml('<embed src="evil.swf">')).not.toContain('embed');
    });

    it('removes form injection', () => {
      expect(sanitizeCmsHtml('<form action="https://evil.com"><input></form>')).not.toContain('form');
    });

    it('removes base tag injection', () => {
      expect(sanitizeCmsHtml('<base href="https://evil.com/">')).not.toContain('base');
    });

    it('removes meta refresh redirect', () => {
      expect(sanitizeCmsHtml('<meta http-equiv="refresh" content="0;url=https://evil.com">')).not.toContain('meta');
    });

    it('handles HTML comments with embedded scripts', () => {
      const result = sanitizeCmsHtml('<!-- <script>alert(1)</script> -->');
      expect(result).not.toContain('script');
    });

    it('removes <details> with ontoggle', () => {
      const result = sanitizeCmsHtml('<details ontoggle="alert(1)"><summary>Click</summary></details>');
      expect(result).not.toContain('ontoggle');
    });

    it('removes math-based XSS', () => {
      const result = sanitizeCmsHtml('<math><mtext><table><mglyph><svg><mtext><textarea><path id="</textarea><img onerror=alert(1) src=1>">');
      expect(result).not.toContain('onerror');
    });
  });

  describe('Empty and edge cases', () => {
    it('handles empty string', () => {
      expect(sanitizeCmsHtml('')).toBe('');
    });

    it('handles null-like input', () => {
      expect(sanitizeCmsHtml('')).toBe('');
    });

    it('handles plain text without HTML', () => {
      expect(sanitizeCmsHtml('Hello world, no HTML here')).toBe('Hello world, no HTML here');
    });

    it('handles deeply nested tags', () => {
      const deep = '<div><p><strong><em><a href="https://example.com">deep text</a></em></strong></p></div>';
      const result = sanitizeCmsHtml(deep);
      expect(result).toContain('deep text');
      expect(result).toContain('a');
    });
  });
});

describe('XSS — Source File Analysis', () => {
  describe('dangerouslySetInnerHTML usage', () => {
    it('CMS page uses sanitizeCmsHtml', () => {
      const source = readFile('app/(public)/[slug]/page.tsx');
      expect(source).toContain("dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(page.content) }}");
      expect(source).toContain("import { sanitizeCmsHtml } from '@/lib/utils/htmlSanitize'");
    });

    it('Blog post uses sanitizeCmsHtml', () => {
      const source = readFile('app/(public)/blog/[slug]/page.tsx');
      expect(source).toContain("dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(post.content) }}");
      expect(source).toContain("import { sanitizeCmsHtml } from '@/lib/utils/htmlSanitize'");
    });

    it('JSON-LD scripts are server-generated and safe (no user input)', () => {
      const vehicleSource = readFile('app/(public)/vehicles/[slug]/page.tsx');
      expect(vehicleSource).toContain('JSON.stringify(jsonLd)');
      expect(vehicleSource).not.toContain('sanitizeCmsHtml');

      const modelSource = readFile('app/(public)/vehicles/model/[slug]/page.tsx');
      expect(modelSource).toContain('JSON.stringify(jsonLd)');

      const manufacturerSource = readFile('app/(public)/vehicles/manufacturer/[slug]/page.tsx');
      expect(manufacturerSource).toContain('JSON.stringify(jsonLd)');

      const bodyTypeSource = readFile('app/(public)/vehicles/body-type/[slug]/page.tsx');
      expect(bodyTypeSource).toContain('JSON.stringify(jsonLd)');
    });
  });

  describe('No remaining unsanitized dangerouslySetInnerHTML', () => {
    it('all dangerouslySetInnerHTML with user content uses sanitization', () => {
      const filesWithDang = [
        'app/(public)/[slug]/page.tsx',
        'app/(public)/blog/[slug]/page.tsx',
      ];
      for (const file of filesWithDang) {
        const source = readFile(file);
        expect(source).toContain('sanitizeCmsHtml');
      }
    });
  });

  describe('Sanitizer configuration hardening', () => {
    it('data: scheme is NOT in allowedSchemesByTag for img', () => {
      const source = readFile('lib/utils/htmlSanitize.ts');
      expect(source).toContain("img: ['http', 'https']");
      expect(source).not.toContain("img: ['http', 'https', 'data']");
    });

    it('transformTags adds rel=noopener noreferrer for target=_blank', () => {
      const source = readFile('lib/utils/htmlSanitize.ts');
      expect(source).toContain('transformTags');
      expect(source).toContain('noopener noreferrer');
    });

    it('allowedSchemes excludes javascript and data', () => {
      const source = readFile('lib/utils/htmlSanitize.ts');
      expect(source).toContain("allowedSchemes: ['http', 'https', 'mailto']");
      expect(source).not.toContain('javascript');
    });
  });
});
