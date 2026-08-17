import React from 'react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicFooter } from '@/components/layout/PublicFooter';
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

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [headerMenu, footerMenu, companySettings] = await Promise.all([
    getMenus('header'),
    getMenus('footer'),
    getCompanySettings(),
  ]);

  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <PublicNavbar menuItems={headerMenu} />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter menuItems={footerMenu} company={companySettings} />
    </div>
  );
}
