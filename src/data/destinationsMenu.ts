/**
 * Data for the "Destinations" mega-menu in the navbar.
 * Two columns: International + Domestic.
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

export const DESTINATIONS_MENU: DestinationMenuColumn[] = [
  {
    title: "International",
    subtitle: "Explore the world",
    items: [
      {
        name: "Bali",
        tagline: "Island of Paradise",
        href: "/plan-trip?destination=Bali",
        image:
          "https://images.pexels.com/photos/1822458/pexels-photo-1822458.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Thailand",
        tagline: "Beaches & Nightlife",
        href: "/plan-trip?destination=Thailand",
        image:
          "https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Maldives",
        tagline: "Luxury Water Villas",
        href: "/plan-trip?destination=Maldives",
        image:
          "https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Switzerland",
        tagline: "Snow & Scenic Alps",
        href: "/plan-trip?destination=Switzerland",
        image:
          "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Vietnam",
        tagline: "Culture & Adventure",
        href: "/plan-trip?destination=Vietnam",
        image:
          "https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
  {
    title: "Domestic",
    subtitle: "Discover incredible India",
    items: [
      {
        name: "Kodaikanal",
        tagline: "Princess of Hill Stations",
        href: "/plan-trip?destination=Kodaikanal",
        image:
          "https://images.pexels.com/photos/15286/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Munnar",
        tagline: "Tea Garden Escape",
        href: "/plan-trip?destination=Munnar",
        image:
          "https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Coorg",
        tagline: "Scotland of India",
        href: "/plan-trip?destination=Coorg",
        image:
          "https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Manali",
        tagline: "Mountain Adventure",
        href: "/plan-trip?destination=Manali",
        image:
          "https://images.pexels.com/photos/2987081/pexels-photo-2987081.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
      {
        name: "Delhi",
        tagline: "Historic Capital City",
        href: "/plan-trip?destination=Delhi",
        image:
          "https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg?auto=compress&cs=tinysrgb&w=600",
      },
    ],
  },
];
