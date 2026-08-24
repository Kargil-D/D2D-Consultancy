/**
 * Shared types for the "Campaigns" mega-menu in the navbar.
 * The menu is always populated from GET /api/campaigns/menu — see
 * PackagesMegaMenu.tsx. There is no static/fallback data here on
 * purpose: the menu must only ever show what the database returns.
 */

export interface PackageMenuItem {
  name: string;
  tagline: string;
  href: string;
  image: string;
}

export interface PackageMenuColumn {
  title: string;
  subtitle: string;
  items: PackageMenuItem[];
}
