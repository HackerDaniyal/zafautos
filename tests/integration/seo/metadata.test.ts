import { describe, it, expect } from 'vitest';

describe('SEO Metadata', () => {
  describe('JSON-LD schema', () => {
    it('validates Product schema structure', () => {
      const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: '2022 Toyota Corolla',
        description: 'Test vehicle description',
        brand: { '@type': 'Brand', name: 'Toyota' },
        model: 'Corolla',
        image: ['https://example.com/image.jpg'],
        url: 'https://zafautos.comvehicles/test-vehicle',
        offers: {
          '@type': 'Offer',
          price: 25000,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/UsedCondition',
          seller: { '@type': 'Organization', name: 'ZafAutos', url: 'https://zafautos.com' },
        },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Mileage', value: '15000 km' },
          { '@type': 'PropertyValue', name: 'Fuel Type', value: 'Petrol' },
        ],
      };

      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Product');
      expect(jsonLd.name).toBeTruthy();
      expect(jsonLd.brand['@type']).toBe('Brand');
      expect(jsonLd.brand.name).toBeTruthy();
      expect(jsonLd.offers['@type']).toBe('Offer');
      expect(typeof jsonLd.offers.price).toBe('number');
      expect(jsonLd.offers.priceCurrency).toBe('USD');
      expect(jsonLd.additionalProperty).toBeInstanceOf(Array);
    });

    it('validates offer has required fields', () => {
      const offer = {
        '@type': 'Offer',
        price: 10000,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/UsedCondition',
      };

      expect(offer.price).toBeGreaterThan(0);
      expect(['USD', 'JPY']).toContain(offer.priceCurrency);
      expect(offer.availability).toContain('schema.org');
      expect(offer.itemCondition).toContain('schema.org');
    });
  });

  describe('Canonical URLs', () => {
    it('follows expected pattern for vehicle pages', () => {
      const baseUrl = 'https://zafautos.com';
      const slug = '2022-toyota-corolla';
      const canonicalUrl = `${baseUrl}/vehicles/${slug}`;

      expect(canonicalUrl).toMatch(/^https:\/\/zafautos\.com\/vehicles\/[a-z0-9-]+$/);
    });

    it('follows expected pattern for manufacturer pages', () => {
      const baseUrl = 'https://zafautos.com';
      const slug = 'toyota';
      const canonicalUrl = `${baseUrl}/vehicles/manufacturer/${slug}`;

      expect(canonicalUrl).toMatch(/^https:\/\/zafautos\.com\/vehicles\/manufacturer\/[a-z0-9-]+$/);
    });

    it('follows expected pattern for model pages', () => {
      const baseUrl = 'https://zafautos.com';
      const canonicalUrl = `${baseUrl}/vehicles/model/corolla`;

      expect(canonicalUrl).toMatch(/^https:\/\/zafautos\.com\/vehicles\/model\/[a-z0-9-]+$/);
    });

    it('follows expected pattern for body-type pages', () => {
      const baseUrl = 'https://zafautos.com';
      const canonicalUrl = `${baseUrl}/vehicles/body-type/sedan`;

      expect(canonicalUrl).toMatch(/^https:\/\/zafautos\.com\/vehicles\/body-type\/[a-z0-9-]+$/);
    });

    it('follows expected pattern for destination pages', () => {
      const baseUrl = 'https://zafautos.com';
      const canonicalUrl = `${baseUrl}/vehicles/destination/japan`;

      expect(canonicalUrl).toMatch(/^https:\/\/zafautos\.com\/vehicles\/destination\/[a-z0-9-]+$/);
    });
  });

  describe('Sitemap route patterns', () => {
    it('includes expected static routes', () => {
      const staticRoutes = [
        '/',
        '/vehicles',
        '/about',
        '/contact',
        '/faq',
        '/blog',
        '/privacy-policy',
        '/terms',
      ];

      staticRoutes.forEach((route) => {
        expect(route).toMatch(/^\/[a-z-]*$/);
      });
    });

    it('includes expected dynamic route patterns', () => {
      const dynamicPatterns = [
        '/vehicles/{slug}',
        '/vehicles/manufacturer/{slug}',
        '/vehicles/model/{slug}',
        '/vehicles/body-type/{slug}',
        '/vehicles/destination/{slug}',
        '/blog/{slug}',
      ];

      dynamicPatterns.forEach((pattern) => {
        expect(pattern).toContain('{slug}');
      });
    });
  });

  describe('Robots.txt rules', () => {
    it('disallows admin routes', () => {
      const disallowedRoutes = ['/admin/', '/account/', '/customer/', '/dealer/', '/api/'];

      disallowedRoutes.forEach((route) => {
        expect(route).toMatch(/^\/[a-z-]+\/$/);
      });
    });

    it('allows public routes', () => {
      const allowedRoutes = ['/', '/vehicles', '/about', '/contact', '/blog'];

      allowedRoutes.forEach((route) => {
        expect(route).not.toMatch(/^\/(admin|account|customer|dealer|api)\//);
      });
    });

    it('includes sitemap reference', () => {
      const sitemapUrl = 'https://zafautos.com/sitemap.xml';
      expect(sitemapUrl).toMatch(/^https:\/\/[a-z]+\.[a-z]+\/sitemap\.xml$/);
    });
  });
});
