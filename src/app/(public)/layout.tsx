import React from 'react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PublicCurrencyLayout } from '@/components/layout/PublicCurrencyLayout';
import { WishlistCompareProvider } from '@/contexts/WishlistCompareContext';
import { CmsRepository } from '@/server/repositories';
import { SettingsService } from '@/server/services';

const cmsRepo = new CmsRepository();
const settingsService = new SettingsService();

interface MenuItem {
  id: string;
  label: string;
  url: string | null;
  pageSlug: string | null;
  externalUrl: string | null;
  openInNewTab: boolean;
  isEnabled: boolean;
  displayOrder: number;
  parentId: string | null;
}

interface CompanySettings {
  companyName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  description?: string;
  socialLinks?: Record<string, string>;
  footerInfo?: string;
}

async function getMenus(location: string): Promise<MenuItem[]> {
  try {
    const items = await cmsRepo.listMenusByLocation(location);
    return items as MenuItem[];
  } catch {
    return [];
  }
}

async function getCompanySettings(): Promise<CompanySettings | null> {
  try {
    return await settingsService.getCompanySettings();
  } catch {
    return null;
  }
}

async function getCurrencyData() {
  try {
    const { currencies: currenciesTable, homepageSections } = await import('@/server/db/schema');
    const { db } = await import('@/server/db/client');
    const { eq, and, isNull } = await import('drizzle-orm');

    // Read the browse_currency section config (admin-configured enabled currencies)
    const [currencySection] = await db
      .select()
      .from(homepageSections)
      .where(and(
        eq(homepageSections.type, 'browse_currency'),
        isNull(homepageSections.deletedAt),
      ))
      .limit(1);

    const extraData = (currencySection?.extraData ?? {}) as {
      visibleCurrencyIds?: string[];
      defaultCurrencyId?: string;
    };

    // Build base query for active currencies
    const rows = await db.select().from(currenciesTable).where(eq(currenciesTable.isActive, true));

    // If admin has configured visibleCurrencyIds, filter to only those currencies
    let filteredRows = rows;
    if (extraData.visibleCurrencyIds && extraData.visibleCurrencyIds.length > 0) {
      const allowedIds = new Set(extraData.visibleCurrencyIds);
      filteredRows = rows.filter((r) => allowedIds.has(r.id));
    }

    // Resolve the default currency code from the admin-configured defaultCurrencyId
    let defaultCurrencyCode = 'USD';
    if (extraData.defaultCurrencyId) {
      const defaultRow = rows.find((r) => r.id === extraData.defaultCurrencyId);
      if (defaultRow) {
        defaultCurrencyCode = defaultRow.code;
      }
    }

    // Always include the default currency in exchange rates for conversion
    const exchangeRates: Record<string, number> = { USD: 1 };
    for (const r of rows) {
      exchangeRates[r.code] = Number(r.exchangeRate) || 1;
    }

    const list = filteredRows.map((r) => ({
      code: r.code,
      symbol: r.symbol ?? r.code,
      name: r.name,
    }));

    return { currencies: list, exchangeRates, defaultCurrency: defaultCurrencyCode };
  } catch {
    return { currencies: [], exchangeRates: { USD: 1 }, defaultCurrency: 'USD' };
  }
}

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerMenu, footerMenu, companySettings, currencyData] = await Promise.all([
    getMenus('header'),
    getMenus('footer'),
    getCompanySettings(),
    getCurrencyData(),
  ]);

  return (
    <PublicCurrencyLayout
      currencies={currencyData.currencies}
      rates={currencyData.exchangeRates}
      defaultCurrency={currencyData.defaultCurrency}
    >
      <WishlistCompareProvider>
        <div className="relative flex min-h-screen flex-col bg-background">
          <PublicNavbar menuItems={headerMenu} />
          <main className="flex-1">
            {children}
          </main>
          <PublicFooter menuItems={footerMenu} company={companySettings} />
        </div>
      </WishlistCompareProvider>
    </PublicCurrencyLayout>
  );
}
