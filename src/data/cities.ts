export interface City {
  name: string;
  state: string;
  popular?: boolean;
}

/**
 * Indian departure cities. Popular metros and tier-1 hubs are flagged
 * so they appear at the top of the dropdown.
 */
export const INDIAN_CITIES: City[] = [
  { name: "Chennai", state: "Tamil Nadu", popular: true },
  { name: "Bangalore", state: "Karnataka", popular: true },
  { name: "Hyderabad", state: "Telangana", popular: true },
  { name: "Mumbai", state: "Maharashtra", popular: true },
  { name: "Delhi", state: "Delhi", popular: true },
  { name: "Kochi", state: "Kerala", popular: true },
  { name: "Madurai", state: "Tamil Nadu", popular: true },
  { name: "Coimbatore", state: "Tamil Nadu", popular: true },
  { name: "Kolkata", state: "West Bengal" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Lucknow", state: "Uttar Pradesh" },
  { name: "Trivandrum", state: "Kerala" },
  { name: "Goa", state: "Goa" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Bhubaneswar", state: "Odisha" },
  { name: "Chandigarh", state: "Chandigarh" },
  { name: "Nagpur", state: "Maharashtra" },
  { name: "Surat", state: "Gujarat" },
  { name: "Visakhapatnam", state: "Andhra Pradesh" },
  { name: "Vijayawada", state: "Andhra Pradesh" },
  { name: "Tiruchirappalli", state: "Tamil Nadu" },
  { name: "Mangalore", state: "Karnataka" },
  { name: "Mysore", state: "Karnataka" },
  { name: "Patna", state: "Bihar" },
  { name: "Guwahati", state: "Assam" },
  { name: "Amritsar", state: "Punjab" },
  { name: "Varanasi", state: "Uttar Pradesh" },
  { name: "Dehradun", state: "Uttarakhand" },
  { name: "Srinagar", state: "Jammu & Kashmir" },
  { name: "Vadodara", state: "Gujarat" },
];
