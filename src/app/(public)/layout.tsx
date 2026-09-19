import React from 'react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
import { PublicCurrencyLayout } from '@/components/layout/PublicCurrencyLayout';
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
    const { currencies: currenciesTable } = await import('@/server/db/schema');
    const { db } = await import('@/server/db/client');
    const { eq } = await import('drizzle-orm');
    const rows = await db.select().from(currenciesTable).where(eq(currenciesTable.isActive, true));
    const exchangeRates: Record<string, number> = { USD: 1 };
    const list = rows.map((r) => {
      exchangeRates[r.code] = Number(r.exchangeRate) || 1;
      return { code: r.code, symbol: r.symbol ?? r.code, name: r.name };
    });
    return { currencies: list, exchangeRates };
  } catch {
    return { currencies: [], exchangeRates: { USD: 1 } };
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
    >
      <div className="relative flex min-h-screen flex-col bg-background">
        <PublicNavbar menuItems={headerMenu} />
        <main className="flex-1">
          {children}
        </main>
        <PublicFooter menuItems={footerMenu} company={companySettings} />
      </div>
    </PublicCurrencyLayout>
  );
}
