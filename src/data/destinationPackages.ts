export interface DestinationPackage {
  id: string;
  title: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  highlights: string[];
  image: string;
  tag?: string;
  /**
   * When set, the "Explore" CTA navigates to `/itinerary/{itineraryId}`
   * instead of the plan-trip enquiry form. The id must match the
   * frontmatter `id` of a markdown file in `content/itineraries/`.
   */
  itineraryId?: string;
}

export interface DestinationInfo {
  slug: string;
  name: string;
  country: string;
  tagline: string;
  description: string;
  heroImage: string;
  packages: DestinationPackage[];
}

const N = " Nights";
const D = " Days, ";

const dur = (days: number, nights: number) => `${days}${D}${nights}${N}`;

/**
 * Curated destinations with their campaigns/packages.
 * Keys are URL slugs (see utils/slug.ts). Each destination ships with 4-5
 * packages so the destination landing page always feels populated.
 */
export const DESTINATIONS: Record<string, DestinationInfo> = {
  "sri-lanka": {
    slug: "sri-lanka",
    name: "Sri Lanka",
    country: "South Asia",
    tagline: "The pearl of the Indian Ocean",
    description:
      "Beaches, ancient temples, tea plantations and warm hospitality, all just a short flight away.",
    heroImage:
      "https://images.unsplash.com/photo-1546708973-b3a1f01da3ec?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "lk-1",
        title: "Colombo City Escape",
        duration: dur(3, 2),
        price: 18999,
        rating: 4.5,
        reviews: 320,
        highlights: ["City tour", "Galle Face beach", "Shopping arcade"],
        image:
          "https://images.unsplash.com/photo-1567361808960-dec9cb578182?auto=format&fit=crop&w=1200&q=80",
        tag: "Quick Trip",
      },
      {
        id: "lk-2",
        title: "Kandy Heritage Tour",
        duration: dur(5, 4),
        price: 32499,
        rating: 4.7,
        reviews: 540,
        highlights: ["Temple of the Tooth", "Tea plantations", "Cultural show"],
        image:
          "https://images.unsplash.com/photo-1586957037294-9f5ad5cb3a05?auto=format&fit=crop&w=1200&q=80",
        tag: "Heritage",
      },
      {
        id: "lk-3",
        title: "Bentota Beach Holiday",
        duration: dur(4, 3),
        price: 27999,
        rating: 4.6,
        reviews: 420,
        highlights: ["Beach resort", "Water sports", "River safari"],
        image:
          "https://images.unsplash.com/photo-1583225154497-0acef34e9eb8?auto=format&fit=crop&w=1200&q=80",
        tag: "Beach",
      },
      {
        id: "lk-4",
        title: "Sri Lanka Honeymoon Escape",
        duration: dur(7, 6),
        price: 64999,
        rating: 4.9,
        reviews: 780,
        highlights: ["Couple villa", "Candlelight dinner", "Spa session"],
        image:
          "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
      {
        id: "lk-5",
        title: "Ramayana Spiritual Tour",
        duration: dur(8, 7),
        price: 49999,
        rating: 4.7,
        reviews: 290,
        highlights: ["Sita Eliya", "Munneswaram temple", "Ashok Vatika"],
        image:
          "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80",
        tag: "Spiritual",
      },
    ],
  },

  maldives: {
    slug: "maldives",
    name: "Maldives",
    country: "Indian Ocean",
    tagline: "Where the ocean meets paradise",
    description:
      "Crystal-clear lagoons, luxurious overwater villas and unforgettable sunsets.",
    heroImage:
      "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "mv-1",
        itineraryId: "mv-1",
        title: "Water Villa Luxury Stay",
        duration: dur(5, 4),
        price: 119999,
        rating: 4.9,
        reviews: 920,
        highlights: ["Overwater villa", "Snorkeling", "All-inclusive"],
        image:
          "https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=1200&q=80",
        tag: "Luxury",
      },
      {
        id: "mv-2",
        itineraryId: "mv-2",
        title: "Couple Honeymoon Escape",
        duration: dur(6, 5),
        price: 99999,
        rating: 4.9,
        reviews: 1240,
        highlights: ["Private dinner", "Sunset cruise", "Spa for two"],
        image:
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
      {
        id: "mv-3",
        itineraryId: "mv-3",
        title: "Scuba Diving Adventure",
        duration: dur(5, 4),
        price: 84999,
        rating: 4.7,
        reviews: 380,
        highlights: ["PADI dives", "Reef tours", "Underwater photos"],
        image:
          "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1200&q=80",
        tag: "Adventure",
      },
      {
        id: "mv-4",
        itineraryId: "mv-4",
        title: "Premium Island Resort",
        duration: dur(4, 3),
        price: 74999,
        rating: 4.8,
        reviews: 610,
        highlights: ["Private beach", "Gourmet meals", "Yoga at dawn"],
        image:
          "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80",
        tag: "Premium",
      },
      {
        id: "mv-5",
        itineraryId: "mv-5",
        title: "Maldives Family Fun",
        duration: dur(6, 5),
        price: 109999,
        rating: 4.8,
        reviews: 530,
        highlights: ["Kids club", "Dolphin cruise", "Beach bungalow"],
        image:
          "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1200&q=80",
        tag: "Family",
      },
    ],
  },

  thailand: {
    slug: "thailand",
    name: "Thailand",
    country: "Southeast Asia",
    tagline: "Beaches, temples and unforgettable nights",
    description:
      "From the buzzing streets of Bangkok to the turquoise waters of Phuket, Thailand has it all.",
    heroImage:
      "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "th-1",
        itineraryId: "th-1",
        title: "Bangkok and Pattaya Combo",
        duration: dur(5, 4),
        price: 32999,
        rating: 4.6,
        reviews: 1480,
        highlights: ["City tour", "Coral island", "Alcazar show"],
        image:
          "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80",
        tag: "Best Seller",
      },
      {
        id: "th-2",
        itineraryId: "th-2",
        title: "Phuket Island Hopper",
        duration: dur(6, 5),
        price: 41999,
        rating: 4.7,
        reviews: 980,
        highlights: ["Phi Phi Islands", "James Bond Island", "Beach resort"],
        image:
          "https://images.unsplash.com/photo-1537956965359-7573183d1f57?auto=format&fit=crop&w=1200&q=80",
        tag: "Beach",
      },
      {
        id: "th-3",
        itineraryId: "th-3",
        title: "Krabi Honeymoon",
        duration: dur(5, 4),
        price: 47999,
        rating: 4.8,
        reviews: 720,
        highlights: ["Private pool villa", "Couples spa", "Romantic dinner"],
        image:
          "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
      {
        id: "th-4",
        itineraryId: "th-4",
        title: "Group Friends Special",
        duration: dur(7, 6),
        price: 38999,
        rating: 4.6,
        reviews: 1320,
        highlights: ["Nightlife", "Adventure sports", "Group activities"],
        image:
          "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=1200&q=80",
        tag: "Group",
      },
      {
        id: "th-5",
        itineraryId: "th-5",
        title: "Northern Thailand Explorer",
        duration: dur(6, 5),
        price: 44999,
        rating: 4.7,
        reviews: 410,
        highlights: ["Chiang Mai", "Elephant sanctuary", "Night markets"],
        image:
          "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80",
        tag: "Cultural",
      },
    ],
  },

  bali: {
    slug: "bali",
    name: "Bali",
    country: "Indonesia",
    tagline: "Island of the gods",
    description:
      "Lush rice terraces, sacred temples and beach clubs that never sleep.",
    heroImage:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "bl-1",
        title: "Bali Honeymoon Special",
        duration: dur(6, 5),
        price: 54999,
        rating: 4.9,
        reviews: 1280,
        highlights: ["Private villa", "Floating breakfast", "Couples spa"],
        image:
          "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
      {
        id: "bl-2",
        title: "Ubud Cultural Retreat",
        duration: dur(5, 4),
        price: 39999,
        rating: 4.7,
        reviews: 540,
        highlights: ["Rice terraces", "Yoga retreat", "Temple visits"],
        image:
          "https://images.unsplash.com/photo-1573790387438-4da905039392?auto=format&fit=crop&w=1200&q=80",
        tag: "Wellness",
      },
      {
        id: "bl-3",
        title: "Bali Beach Adventure",
        duration: dur(7, 6),
        price: 47999,
        rating: 4.6,
        reviews: 870,
        highlights: ["Surfing", "Snorkeling", "Beach clubs"],
        image:
          "https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?auto=format&fit=crop&w=1200&q=80",
        tag: "Adventure",
      },
      {
        id: "bl-4",
        title: "Nusa Islands Hopper",
        duration: dur(4, 3),
        price: 33999,
        rating: 4.7,
        reviews: 410,
        highlights: ["Kelingking beach", "Manta point dive", "Cliff villas"],
        image:
          "https://images.unsplash.com/photo-1504457047772-27faf1c00561?auto=format&fit=crop&w=1200&q=80",
        tag: "Island",
      },
      {
        id: "bl-5",
        title: "Bali Family Fun",
        duration: dur(6, 5),
        price: 52999,
        rating: 4.7,
        reviews: 690,
        highlights: ["Waterbom park", "Elephant safari", "Family villa"],
        image:
          "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?auto=format&fit=crop&w=1200&q=80",
        tag: "Family",
      },
    ],
  },

  dubai: {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    tagline: "Where luxury meets adventure",
    description:
      "Sky-piercing towers, golden deserts and shopping like nowhere else.",
    heroImage:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "dxb-1",
        title: "Dubai City Highlights",
        duration: dur(4, 3),
        price: 42999,
        rating: 4.7,
        reviews: 1540,
        highlights: ["Burj Khalifa", "Dubai Mall", "Marina cruise"],
        image:
          "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80",
        tag: "City",
      },
      {
        id: "dxb-2",
        title: "Desert Safari Experience",
        duration: dur(5, 4),
        price: 51999,
        rating: 4.8,
        reviews: 920,
        highlights: ["Dune bashing", "Belly dance", "BBQ dinner"],
        image:
          "https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?auto=format&fit=crop&w=1200&q=80",
        tag: "Adventure",
      },
      {
        id: "dxb-3",
        title: "Luxury Dubai Honeymoon",
        duration: dur(6, 5),
        price: 89999,
        rating: 4.9,
        reviews: 480,
        highlights: ["5-star stay", "Helicopter tour", "Private yacht"],
        image:
          "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1200&q=80",
        tag: "Luxury",
      },
      {
        id: "dxb-4",
        title: "Dubai with Abu Dhabi",
        duration: dur(6, 5),
        price: 56999,
        rating: 4.7,
        reviews: 720,
        highlights: ["Sheikh Zayed Mosque", "Ferrari World", "Desert safari"],
        image:
          "https://images.unsplash.com/photo-1535320485706-44d43b919500?auto=format&fit=crop&w=1200&q=80",
        tag: "Combo",
      },
      {
        id: "dxb-5",
        title: "Dubai Family Special",
        duration: dur(5, 4),
        price: 47999,
        rating: 4.6,
        reviews: 1080,
        highlights: ["IMG Worlds", "Aquaventure", "Global Village"],
        image:
          "https://images.unsplash.com/photo-1582672060674-bc2bd808a8f5?auto=format&fit=crop&w=1200&q=80",
        tag: "Family",
      },
    ],
  },

  vietnam: {
    slug: "vietnam",
    name: "Vietnam",
    country: "Southeast Asia",
    tagline: "Timeless charm and emerald waters",
    description:
      "From the mystical Halong Bay to bustling Ho Chi Minh City, adventure awaits.",
    heroImage:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "vn-1",
        title: "Hanoi and Halong Bay Cruise",
        duration: dur(5, 4),
        price: 36999,
        rating: 4.8,
        reviews: 640,
        highlights: ["Overnight cruise", "Old quarter", "Cave tours"],
        image:
          "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        tag: "Best Seller",
      },
      {
        id: "vn-2",
        title: "South Vietnam Explorer",
        duration: dur(6, 5),
        price: 41999,
        rating: 4.6,
        reviews: 380,
        highlights: ["Mekong delta", "Cu Chi tunnels", "City tour"],
        image:
          "https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=1200&q=80",
        tag: "Cultural",
      },
      {
        id: "vn-3",
        title: "Da Nang Beach Holiday",
        duration: dur(5, 4),
        price: 34999,
        rating: 4.7,
        reviews: 510,
        highlights: ["Golden Bridge", "Beach resort", "Hoi An lanterns"],
        image:
          "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
        tag: "Beach",
      },
      {
        id: "vn-4",
        title: "Sapa Mountain Trek",
        duration: dur(6, 5),
        price: 39999,
        rating: 4.8,
        reviews: 290,
        highlights: ["Rice terraces", "Local homestay", "Mt. Fansipan"],
        image:
          "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
        tag: "Adventure",
      },
      {
        id: "vn-5",
        title: "Vietnam Honeymoon Special",
        duration: dur(7, 6),
        price: 54999,
        rating: 4.9,
        reviews: 360,
        highlights: ["Halong cruise", "Spa for two", "Boutique stay"],
        image:
          "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
    ],
  },

  singapore: {
    slug: "singapore",
    name: "Singapore",
    country: "Southeast Asia",
    tagline: "The lion city",
    description:
      "Futuristic gardens, hawker food and family-friendly fun in one compact island.",
    heroImage:
      "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "sg-1",
        title: "Singapore Family Fun",
        duration: dur(5, 4),
        price: 58999,
        rating: 4.8,
        reviews: 1120,
        highlights: ["Universal Studios", "S.E.A. Aquarium", "Sentosa"],
        image:
          "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80",
        tag: "Family",
      },
      {
        id: "sg-2",
        title: "Singapore City Highlights",
        duration: dur(4, 3),
        price: 44999,
        rating: 4.7,
        reviews: 890,
        highlights: ["Marina Bay", "Gardens by the Bay", "Night safari"],
        image:
          "https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=80",
        tag: "Quick Trip",
      },
      {
        id: "sg-3",
        title: "Singapore + Malaysia Combo",
        duration: dur(7, 6),
        price: 72999,
        rating: 4.8,
        reviews: 540,
        highlights: ["Kuala Lumpur", "Genting Highlands", "Sentosa"],
        image:
          "https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=1200&q=80",
        tag: "Combo",
      },
      {
        id: "sg-4",
        title: "Singapore Honeymoon",
        duration: dur(5, 4),
        price: 64999,
        rating: 4.8,
        reviews: 410,
        highlights: ["Couples spa", "Skyline dinner", "Cable car ride"],
        image:
          "https://images.unsplash.com/photo-1496939376851-89342e90adcd?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
    ],
  },

  switzerland: {
    slug: "switzerland",
    name: "Switzerland",
    country: "Europe",
    tagline: "Snowy peaks, scenic rails",
    description:
      "Alpine villages, glacier express journeys and chocolate-perfect views.",
    heroImage:
      "https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "ch-1",
        title: "Swiss Alps Discovery",
        duration: dur(7, 6),
        price: 169999,
        rating: 4.9,
        reviews: 740,
        highlights: ["Jungfraujoch", "Glacier Express", "Lake Lucerne"],
        image:
          "https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?auto=format&fit=crop&w=1200&q=80",
        tag: "Scenic",
      },
      {
        id: "ch-2",
        title: "Romantic Switzerland",
        duration: dur(8, 7),
        price: 184999,
        rating: 4.9,
        reviews: 520,
        highlights: ["Couples cabin", "Mt. Titlis", "Rhine Falls"],
        image:
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
      {
        id: "ch-3",
        title: "Switzerland Family Special",
        duration: dur(7, 6),
        price: 154999,
        rating: 4.7,
        reviews: 380,
        highlights: ["Interlaken", "Mt. Pilatus", "Chocolate factory"],
        image:
          "https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=1200&q=80",
        tag: "Family",
      },
      {
        id: "ch-4",
        title: "Swiss Winter Wonderland",
        duration: dur(6, 5),
        price: 142999,
        rating: 4.8,
        reviews: 290,
        highlights: ["Skiing", "Snow safari", "Alpine cabins"],
        image:
          "https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=1200&q=80",
        tag: "Winter",
      },
    ],
  },

  kashmir: {
    slug: "kashmir",
    name: "Kashmir",
    country: "India",
    tagline: "Heaven on earth",
    description:
      "Snow-capped mountains, Dal lake shikaras and Mughal gardens in full bloom.",
    heroImage:
      "https://images.unsplash.com/photo-1566837497312-7be4a47e156c?auto=format&fit=crop&w=2000&q=80",
    packages: [
      {
        id: "ks-1",
        title: "Srinagar and Gulmarg Special",
        duration: dur(5, 4),
        price: 28999,
        rating: 4.7,
        reviews: 1280,
        highlights: ["Houseboat stay", "Gondola ride", "Shikara tour"],
        image:
          "https://images.unsplash.com/photo-1566837497312-7be4a47e156c?auto=format&fit=crop&w=1200&q=80",
        tag: "Best Seller",
      },
      {
        id: "ks-2",
        title: "Pahalgam Adventure",
        duration: dur(6, 5),
        price: 34999,
        rating: 4.6,
        reviews: 540,
        highlights: ["River rafting", "Pony ride", "Aru valley"],
        image:
          "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80",
        tag: "Adventure",
      },
      {
        id: "ks-3",
        title: "Sonmarg Snow Special",
        duration: dur(5, 4),
        price: 29999,
        rating: 4.7,
        reviews: 470,
        highlights: ["Thajiwas glacier", "Snow sports", "Mountain stay"],
        image:
          "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80",
        tag: "Snow",
      },
      {
        id: "ks-4",
        title: "Kashmir Honeymoon",
        duration: dur(7, 6),
        price: 49999,
        rating: 4.9,
        reviews: 320,
        highlights: ["Houseboat", "Mughal gardens", "Candle dinner"],
        image:
          "https://images.unsplash.com/photo-1517300174856-c95dbcce334b?auto=format&fit=crop&w=1200&q=80",
        tag: "Honeymoon",
      },
    ],
  },
};

/** Quick lookup by slug; returns undefined when not found. */
export const getDestinationBySlug = (
  slug: string,
): DestinationInfo | undefined => DESTINATIONS[slug];

/** All slugs (used by generateStaticParams). */
export const ALL_DESTINATION_SLUGS = Object.keys(DESTINATIONS);
