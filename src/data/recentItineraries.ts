/**
 * Data for the "Recently Booked Itineraries" section on the landing page.
 * Each entry represents a recent trip booked through the site.
 */

export type ItineraryAudience = "FAMILY" | "COUPLE" | "FRIENDS" | "SOLO";

export type PriceBucket = "Under 50K" | "50K to 1.5L" | "1.5L to 2.5L" | "Luxury";

export interface RecentItinerary {
  id: string;
  /** Headline shown on the card (e.g. "Family Escape: 6 Nights In Krabi And Phuket"). */
  title: string;
  /** Primary location and nights (e.g. "Krabi (3N)"). */
  primaryLocation: string;
  /** Number of additional stops (e.g. 1 ? "+1 more"). 0 hides the suffix. */
  extraStops: number;
  audience: ItineraryAudience;
  /** Total price in INR. */
  price: number;
  nights: number;
  image: string;
  /** Booker meta shown in the dark header strip. */
  bookedBy: {
    name: string;
    city: string;
    ago: string;
  };
  /** Used by the price filter pills. */
  bucket: PriceBucket;
}

export const RECENT_ITINERARIES: RecentItinerary[] = [
  {
    id: "krabi-phuket",
    title: "Family Escape: 6 Nights In Krabi And Phuket",
    primaryLocation: "Krabi (3N)",
    extraStops: 1,
    audience: "FAMILY",
    price: 37733,
    nights: 6,
    image:
      "https://images.pexels.com/photos/1007657/pexels-photo-1007657.jpeg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Ankit", city: "Varanasi", ago: "19m ago" },
    bucket: "Under 50K",
  },
  {
    id: "vietnam-trio",
    title: "Family Escape: 8 Nights In Da Nang, Ho Chi Minh And Hanoi",
    primaryLocation: "Hanoi (3N)",
    extraStops: 2,
    audience: "FAMILY",
    price: 77139,
    nights: 8,
    image:
      "https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Mitu", city: "New Delhi", ago: "28m ago" },
    bucket: "50K to 1.5L",
  },
  {
    id: "italy-rome",
    title: "Couple Getaway: 10 Nights In Rome, Florence, Milan",
    primaryLocation: "Lucerne (3N)",
    extraStops: 4,
    audience: "COUPLE",
    price: 189999,
    nights: 10,
    image:
      "https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Teja", city: "Hyderabad", ago: "1hr ago" },
    bucket: "1.5L to 2.5L",
  },
  {
    id: "maldives-luxury",
    title: "Couple Escape: 5 Nights In Maldives",
    primaryLocation: "Mauritius (5N)",
    extraStops: 0,
    audience: "COUPLE",
    price: 289329,
    nights: 5,
    image:
      "https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Vasudev", city: "Goa", ago: "20hr ago" },
    bucket: "Luxury",
  },
  {
    id: "switzerland-trio",
    title: "Family Escape: 6 Nights In Zurich, Interlaken And Milan",
    primaryLocation: "Zurich (1N)",
    extraStops: 3,
    audience: "FAMILY",
    price: 163556,
    nights: 6,
    image:
      "https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Sandeep", city: "New Delhi", ago: "20hr ago" },
    bucket: "1.5L to 2.5L",
  },
  {
    id: "bali-couple",
    title: "Couple Escape: 5 Nights In Bali",
    primaryLocation: "Ubud (2N)",
    extraStops: 1,
    audience: "COUPLE",
    price: 62499,
    nights: 5,
    image:
      "https://images.pexels.com/photos/1822458/pexels-photo-1822458.jpeg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Preethi", city: "Chennai", ago: "3hr ago" },
    bucket: "50K to 1.5L",
  },
  {
    id: "singapore-family",
    title: "Family Escape: 4 Nights In Singapore",
    primaryLocation: "Singapore (4N)",
    extraStops: 0,
    audience: "FAMILY",
    price: 88450,
    nights: 4,
    image:
      "https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Sumit", city: "Mumbai", ago: "5hr ago" },
    bucket: "50K to 1.5L",
  },
  {
    id: "kerala-budget",
    title: "Friends Trip: 4 Nights In Munnar And Alleppey",
    primaryLocation: "Munnar (2N)",
    extraStops: 1,
    audience: "FRIENDS",
    price: 28999,
    nights: 4,
    image:
      "https://images.pexels.com/photos/7919/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=900",
    bookedBy: { name: "Rohan", city: "Bengaluru", ago: "9hr ago" },
    bucket: "Under 50K",
  },
];
