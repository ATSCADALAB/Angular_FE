import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Home',
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    route: '/dashboard',
  },
  {
    navCap: 'Administration',
  },
  {
    displayName: 'Orders',
    iconName: 'truck-delivery',
    route: '/ui-components/orders',
  },
  {
    displayName: 'Reports',
    iconName: 'database-export',
    route: '/ui-components/reports',
  },
  {
    displayName: 'Inbound',
    iconName: 'transfer-out',
    route: '/ui-components/inbound',
  },
  {
    displayName: 'Outbound',
    iconName: 'transfer-in',
    route: '/ui-components/outbound',
  },
  {
    displayName: 'Stock',
    iconName: 'home',
    route: '/ui-components/stock-report',
  },
  {
    displayName: 'Lines',
    iconName: 'line',
    route: '/ui-components/lines',
  },
  {
    displayName: 'ConfigureSensor',
    iconName: 'line',
    route: '/ui-components/bagweight',
  },
  {
    displayName: 'Areas',
    iconName: 'chart-area',
    route: '/ui-components/areas',
  },
  {
    displayName: 'Distributors',
    iconName: 'emergency-bed',
    route: '/ui-components/distributors',
  },
  {
    displayName: 'RFID',
    iconName: 'tags',
    route: '/ui-components/products',
  },
  {
    displayName: 'ProductInformations',
    iconName: 'paper-bag',
    route: '/ui-components/product-informations',
  },
  {
    displayName: 'Roles',
    iconName: 'user-plus',
    route: '/ui-components/roles',
  },
  {
    displayName: 'Users',
    iconName: 'user-circle',
    route: '/ui-components/users',
  },
  {
    displayName: 'Categories',
    iconName: 'category',
    route: '/ui-components/categories',
  },
  
  {
    displayName: 'Permissions',
    iconName: 'settings-pause',
    route: '/ui-components/permissions',
  },
  {
    displayName: 'Audit logs',
    iconName: 'layout-navbar-expand',
    route: '/ui-components/audits',
  },
  // {
  //   displayName: 'About',
  //   iconName: 'tooltip',
  //   route: '/ui-components/about',
  // },

];
