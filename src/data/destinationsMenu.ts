/**
 * Shared types for the "Destinations" mega-menu in the navbar.
 * The menu is always populated from GET /api/destinations/menu — see
 * DestinationsMegaMenu.tsx. There is no static/fallback data here on
 * purpose: the menu must only ever show what the database returns.
 */

export interface DestinationMenuItem {
  name: string;
  tagline: string;
  href: string;
  image: string;
}

export interface DestinationMenuColumn {
  title: string;
  subtitle: string;
  items: DestinationMenuItem[];
}
