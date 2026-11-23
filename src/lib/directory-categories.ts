/**
 * Business directory categories, written the way people search ("plumbers in
 * Billings", "pizza in Austin"). Each maps to the OpenStreetMap tags it is
 * imported from and to the schema.org LocalBusiness type search engines use.
 * Client-safe (no database imports).
 */
export type DirCategory = {
  slug: string;          // URL: /directory/{city}/{slug}
  name: string;          // "Plumbers"
  one: string;           // "plumber" (singular, for copy)
  group: "Food & Drink" | "Home Services" | "Health" | "Auto" | "Beauty & Fitness" | "Professional Services" | "Shopping" | "Travel & Fun" | "Pets";
  schema: string;        // schema.org type
  osm: string[];         // OSM tag filters, key=value
  icon: string;
};

export const DIR_CATEGORIES: DirCategory[] = [
  // Food & Drink
  { slug: "restaurants", name: "Restaurants", one: "restaurant", group: "Food & Drink", schema: "Restaurant", osm: ["amenity=restaurant"], icon: "🍽️" },
  { slug: "pizza", name: "Pizza Places", one: "pizza place", group: "Food & Drink", schema: "Restaurant", osm: ["cuisine=pizza"], icon: "🍕" },
  { slug: "mexican-restaurants", name: "Mexican Restaurants", one: "Mexican restaurant", group: "Food & Drink", schema: "Restaurant", osm: ["cuisine=mexican"], icon: "🌮" },
  { slug: "bbq", name: "BBQ Restaurants", one: "BBQ restaurant", group: "Food & Drink", schema: "Restaurant", osm: ["cuisine=barbecue", "cuisine=bbq"], icon: "🍖" },
  { slug: "coffee-shops", name: "Coffee Shops", one: "coffee shop", group: "Food & Drink", schema: "CafeOrCoffeeShop", osm: ["amenity=cafe"], icon: "☕" },
  { slug: "bakeries", name: "Bakeries", one: "bakery", group: "Food & Drink", schema: "Bakery", osm: ["shop=bakery"], icon: "🥐" },
  { slug: "bars", name: "Bars & Pubs", one: "bar", group: "Food & Drink", schema: "BarOrPub", osm: ["amenity=bar", "amenity=pub"], icon: "🍺" },
  { slug: "breweries", name: "Breweries", one: "brewery", group: "Food & Drink", schema: "Brewery", osm: ["craft=brewery", "microbrewery=yes"], icon: "🍻" },
  { slug: "fast-food", name: "Fast Food", one: "fast food restaurant", group: "Food & Drink", schema: "FastFoodRestaurant", osm: ["amenity=fast_food"], icon: "🍔" },
  { slug: "ice-cream", name: "Ice Cream Shops", one: "ice cream shop", group: "Food & Drink", schema: "IceCreamShop", osm: ["amenity=ice_cream"], icon: "🍦" },
  // Home Services
  { slug: "plumbers", name: "Plumbers", one: "plumber", group: "Home Services", schema: "Plumber", osm: ["craft=plumber"], icon: "🔧" },
  { slug: "electricians", name: "Electricians", one: "electrician", group: "Home Services", schema: "Electrician", osm: ["craft=electrician"], icon: "💡" },
  { slug: "hvac", name: "HVAC & Heating", one: "HVAC company", group: "Home Services", schema: "HVACBusiness", osm: ["craft=hvac", "craft=heating_engineer"], icon: "❄️" },
  { slug: "roofers", name: "Roofers", one: "roofer", group: "Home Services", schema: "RoofingContractor", osm: ["craft=roofer"], icon: "🏠" },
  { slug: "contractors", name: "General Contractors", one: "contractor", group: "Home Services", schema: "GeneralContractor", osm: ["office=construction_company", "craft=builder"], icon: "🏗️" },
  { slug: "landscapers", name: "Landscaping", one: "landscaper", group: "Home Services", schema: "HomeAndConstructionBusiness", osm: ["craft=gardener"], icon: "🌳" },
  { slug: "locksmiths", name: "Locksmiths", one: "locksmith", group: "Home Services", schema: "Locksmith", osm: ["shop=locksmith", "craft=locksmith"], icon: "🔑" },
  { slug: "hardware-stores", name: "Hardware Stores", one: "hardware store", group: "Home Services", schema: "HardwareStore", osm: ["shop=hardware", "shop=doityourself"], icon: "🔨" },
  // Health
  { slug: "dentists", name: "Dentists", one: "dentist", group: "Health", schema: "Dentist", osm: ["amenity=dentist", "healthcare=dentist"], icon: "🦷" },
  { slug: "doctors", name: "Doctors & Clinics", one: "doctor", group: "Health", schema: "MedicalClinic", osm: ["amenity=doctors", "amenity=clinic"], icon: "🩺" },
  { slug: "chiropractors", name: "Chiropractors", one: "chiropractor", group: "Health", schema: "MedicalBusiness", osm: ["healthcare=chiropractor"], icon: "🦴" },
  { slug: "optometrists", name: "Eye Doctors & Optometrists", one: "eye doctor", group: "Health", schema: "Optician", osm: ["shop=optician", "healthcare=optometrist"], icon: "👓" },
  { slug: "physical-therapy", name: "Physical Therapy", one: "physical therapist", group: "Health", schema: "MedicalBusiness", osm: ["healthcare=physiotherapist"], icon: "💪" },
  // Auto
  { slug: "auto-repair", name: "Auto Repair Shops", one: "auto repair shop", group: "Auto", schema: "AutoRepair", osm: ["shop=car_repair"], icon: "🚗" },
  { slug: "car-dealers", name: "Car Dealers", one: "car dealer", group: "Auto", schema: "AutoDealer", osm: ["shop=car"], icon: "🚙" },
  { slug: "tire-shops", name: "Tire Shops", one: "tire shop", group: "Auto", schema: "TireShop", osm: ["shop=tyres"], icon: "🛞" },
  { slug: "car-washes", name: "Car Washes", one: "car wash", group: "Auto", schema: "AutoWash", osm: ["amenity=car_wash"], icon: "🧽" },
  // Beauty & Fitness
  { slug: "hair-salons", name: "Hair Salons", one: "hair salon", group: "Beauty & Fitness", schema: "HairSalon", osm: ["shop=hairdresser"], icon: "💇" },
  { slug: "barbers", name: "Barbershops", one: "barbershop", group: "Beauty & Fitness", schema: "HairSalon", osm: ["hairdresser=barber", "shop=barber"], icon: "💈" },
  { slug: "nail-salons", name: "Nail Salons", one: "nail salon", group: "Beauty & Fitness", schema: "NailSalon", osm: ["beauty=nails"], icon: "💅" },
  { slug: "beauty-spas", name: "Beauty & Day Spas", one: "spa", group: "Beauty & Fitness", schema: "DaySpa", osm: ["shop=beauty", "leisure=spa"], icon: "🧖" },
  { slug: "gyms", name: "Gyms & Fitness Centers", one: "gym", group: "Beauty & Fitness", schema: "ExerciseGym", osm: ["leisure=fitness_centre"], icon: "🏋️" },
  // Professional Services
  { slug: "lawyers", name: "Lawyers & Attorneys", one: "lawyer", group: "Professional Services", schema: "LegalService", osm: ["office=lawyer"], icon: "⚖️" },
  { slug: "accountants", name: "Accountants & Tax Preparers", one: "accountant", group: "Professional Services", schema: "AccountingService", osm: ["office=accountant", "office=tax_advisor"], icon: "🧾" },
  { slug: "real-estate-agents", name: "Real Estate Agents", one: "real estate agent", group: "Professional Services", schema: "RealEstateAgent", osm: ["office=estate_agent"], icon: "🏡" },
  { slug: "insurance-agents", name: "Insurance Agents", one: "insurance agent", group: "Professional Services", schema: "InsuranceAgency", osm: ["office=insurance"], icon: "🛡️" },
  { slug: "banks", name: "Banks & Credit Unions", one: "bank", group: "Professional Services", schema: "BankOrCreditUnion", osm: ["amenity=bank"], icon: "🏦" },
  // Shopping
  { slug: "florists", name: "Florists", one: "florist", group: "Shopping", schema: "Florist", osm: ["shop=florist"], icon: "💐" },
  { slug: "furniture-stores", name: "Furniture Stores", one: "furniture store", group: "Shopping", schema: "FurnitureStore", osm: ["shop=furniture"], icon: "🛋️" },
  { slug: "clothing-stores", name: "Clothing Stores", one: "clothing store", group: "Shopping", schema: "ClothingStore", osm: ["shop=clothes"], icon: "👗" },
  { slug: "jewelers", name: "Jewelers", one: "jeweler", group: "Shopping", schema: "JewelryStore", osm: ["shop=jewelry"], icon: "💍" },
  { slug: "bookstores", name: "Bookstores", one: "bookstore", group: "Shopping", schema: "BookStore", osm: ["shop=books"], icon: "📚" },
  { slug: "grocery-stores", name: "Grocery Stores", one: "grocery store", group: "Shopping", schema: "GroceryStore", osm: ["shop=supermarket", "shop=greengrocer"], icon: "🛒" },
  // Travel & Fun
  { slug: "hotels", name: "Hotels & Motels", one: "hotel", group: "Travel & Fun", schema: "Hotel", osm: ["tourism=hotel", "tourism=motel"], icon: "🏨" },
  { slug: "bed-and-breakfasts", name: "Bed & Breakfasts", one: "B&B", group: "Travel & Fun", schema: "BedAndBreakfast", osm: ["tourism=guest_house"], icon: "🛏️" },
  { slug: "event-venues", name: "Event Venues", one: "event venue", group: "Travel & Fun", schema: "EventVenue", osm: ["amenity=events_venue"], icon: "🎉" },
  // Pets
  { slug: "veterinarians", name: "Veterinarians", one: "veterinarian", group: "Pets", schema: "VeterinaryCare", osm: ["amenity=veterinary"], icon: "🐾" },
  { slug: "pet-stores", name: "Pet Stores & Groomers", one: "pet store", group: "Pets", schema: "PetStore", osm: ["shop=pet", "shop=pet_grooming"], icon: "🐶" },
];

export const DIR_GROUPS = Array.from(new Set(DIR_CATEGORIES.map((c) => c.group)));
export const catBySlug = (s: string) => DIR_CATEGORIES.find((c) => c.slug === s) || null;

/** Never imported or listed: adult, cannabis, vape, weapons, gambling (the paper's ad rules). */
export const DIR_EXCLUDE = ["shop=erotic", "shop=cannabis", "shop=e-cigarette", "shop=tobacco", "shop=weapons", "amenity=casino", "amenity=gambling", "shop=adult", "amenity=stripclub", "amenity=brothel"];

/** Pick the most specific category for an OSM element's tags (cuisine and barber beat the generic ones). */
export function categorize(tags: Record<string, string>): DirCategory | null {
  for (const x of DIR_EXCLUDE) { const [k, v] = x.split("="); if (tags[k] === v) return null; }
  const cuisines = (tags.cuisine || "").split(";").map((s) => s.trim());
  const hit = (f: string) => { const [k, v] = f.split("="); return k === "cuisine" ? cuisines.includes(v) : tags[k] === v; };
  const specificFirst = [...DIR_CATEGORIES].sort((a, b) => Number(b.osm.some((o) => o.startsWith("cuisine=") || o.startsWith("hairdresser=") || o.startsWith("beauty=") || o.startsWith("microbrewery="))) - Number(a.osm.some((o) => o.startsWith("cuisine=") || o.startsWith("hairdresser=") || o.startsWith("beauty=") || o.startsWith("microbrewery="))));
  for (const c of specificFirst) if (c.osm.some(hit)) {
    // a pizza/mexican/bbq cuisine tag only counts on a food place
    if (c.osm.every((o) => o.startsWith("cuisine=")) && !/restaurant|fast_food|cafe/.test(tags.amenity || "")) continue;
    return c;
  }
  return null;
}
