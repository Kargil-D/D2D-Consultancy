export interface Review {
  id: string;
  name: string;
  location: string;
  trip: string;
  rating: number;
  comment: string;
  avatar: string;
}

export const REVIEWS: Review[] = [
  {
    id: "r1",
    name: "Aarav Sharma",
    location: "Mumbai, India",
    trip: "Bali Honeymoon Escape",
    rating: 5,
    comment:
      "Absolutely magical experience! Every detail was thoughtfully planned - from private villas to candle-lit dinners. Truly unforgettable.",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "r2",
    name: "Priya Verma",
    location: "Bengaluru, India",
    trip: "Kashmir Family Tour",
    rating: 5,
    comment:
      "The houseboats, the shikara rides, the snow... our kids still talk about it! Smooth booking, friendly guides, and zero hassle.",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "r3",
    name: "Rohan Mehta",
    location: "Delhi, India",
    trip: "Dubai Luxury Weekend",
    rating: 4,
    comment:
      "Fast-paced, glamorous, and perfectly organized. Loved the desert safari and Burj Khalifa fast-pass. Great value for money.",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "r4",
    name: "Neha Iyer",
    location: "Chennai, India",
    trip: "Maldives Overwater Retreat",
    rating: 5,
    comment:
      "Pure paradise. The overwater villa, the snorkeling, the sunsets - everything exceeded our expectations. Highly recommended!",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "r5",
    name: "Arjun Kapoor",
    location: "Pune, India",
    trip: "Bali Adventure Package",
    rating: 5,
    comment:
      "From volcano hikes to surfing lessons, the trip was packed yet relaxing. Our consultant nailed every preference.",
    avatar:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200&h=200&fit=crop&crop=faces",
  },
  {
    id: "r6",
    name: "Sneha Reddy",
    location: "Hyderabad, India",
    trip: "Kashmir Winter Special",
    rating: 5,
    comment:
      "Snowfall in Gulmarg felt like a dream. Warm hospitality, cozy stays, and breathtaking views all the way through.",
    avatar:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces",
  },
];
