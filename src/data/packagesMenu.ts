/**
 * Data for the "Packages" mega-menu in the navbar.
 * Two columns: By Theme + By Destination.
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

export const PACKAGES_MENU: PackageMenuColumn[] = [
  {
    title: "By Destination",
    subtitle: "Most loved trips",
    items: [
      {
        name: "Thailand Packages",
        tagline: "Beaches & nightlife",
        href: "/packages/thailand",
        image:
          "https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Vietnam Packages",
        tagline: "Culture & adventure",
        href: "/packages/vietnam",
        image:
          "https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Bali Packages",
        tagline: "Island of paradise",
        href: "/packages/bali",
        image:
          "https://images.pexels.com/photos/1822458/pexels-photo-1822458.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Switzerland Packages",
        tagline: "Snow & scenic alps",
        href: "/packages/switzerland",
        image:
          "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Maldives Packages",
        tagline: "Luxury water villas",
        href: "/packages/maldives",
        image:
          "https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
];
