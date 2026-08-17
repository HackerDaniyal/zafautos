export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const adminNavigation: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Vehicles', href: '/admin/vehicles', icon: 'Car' },
      { label: 'Makes', href: '/admin/vehicles/makes', icon: 'Tag' },
      { label: 'Models', href: '/admin/vehicles/models', icon: 'Layers' },
      { label: 'Body Types', href: '/admin/vehicles/body-types', icon: 'Box' },
      { label: 'Fuel Types', href: '/admin/vehicles/fuel-types', icon: 'Fuel' },
      { label: 'Transmissions', href: '/admin/vehicles/transmissions', icon: 'Settings' },
      { label: 'Colors', href: '/admin/vehicles/colors', icon: 'Palette' },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: 'Users' },
      { label: 'Dealers', href: '/admin/dealers', icon: 'Shield' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: 'ShoppingBag' },
      { label: 'Payments', href: '/admin/payments', icon: 'CreditCard' },
      { label: 'Shipping', href: '/admin/shipping', icon: 'Truck' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Pages', href: '/admin/pages', icon: 'File' },
      { label: 'Homepage', href: '/admin/homepage', icon: 'LayoutDashboard' },
      { label: 'Menus', href: '/admin/menus', icon: 'Menu' },
      { label: 'Documents', href: '/admin/documents', icon: 'FileText' },
      { label: 'Blog', href: '/admin/blog', icon: 'PenTool' },
      { label: 'Media Library', href: '/admin/media', icon: 'Image' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Users', href: '/admin/users', icon: 'UsersRound' },
      { label: 'Roles', href: '/admin/roles', icon: 'KeyRound' },
      { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
      { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' },
      { label: 'Logs', href: '/admin/logs', icon: 'ScrollText' },
    ],
  },
];
