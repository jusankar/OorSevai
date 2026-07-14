// Shared Geolocation database and distance engine for OorSevai App

export const LOCAL_COORDINATES: Record<string, { lat: number; lon: number }> = {
  // Thirumanancheri Temple and surroundings
  "thirumanancheri": { lat: 11.1444, lon: 79.5744 },
  "thirumanancheri temple": { lat: 11.1444, lon: 79.5744 },
  "tiruvelvikudi": { lat: 11.1350, lon: 79.5630 },
  "komal": { lat: 11.1118, lon: 79.5445 },
  "kanjanur": { lat: 11.0664, lon: 79.4936 },
  "kathiramangalam": { lat: 11.1075, lon: 79.5167 },
  "elanthoppu": { lat: 11.1215, lon: 79.6120 },
  "malliyam": { lat: 11.1010, lon: 79.6015 },
  "therizhandur": { lat: 11.0561, lon: 79.5815 },
  "kozhiyur": { lat: 11.1550, lon: 79.5450 },
  "karuppur": { lat: 11.1590, lon: 79.5250 },
  "palaiyur": { lat: 11.1320, lon: 79.6310 },
  "kodangudi": { lat: 11.1280, lon: 79.4980 },
  "thirukodikaval": { lat: 11.0864, lon: 79.4925 },
  "suryanar koil": { lat: 11.0289, lon: 79.4856 },
  "tiruppanandal": { lat: 11.1128, lon: 79.4533 },
  "senganur": { lat: 11.1333, lon: 79.4450 },
  "mayiladuthurai": { lat: 11.1018, lon: 79.6522 },
  "kuthalam": { lat: 11.0744, lon: 79.5544 },
  "kurumanakudi": { lat: 11.1661, lon: 79.5936 },
  "pandanallur": { lat: 11.1928, lon: 79.4891 },
  "aduthurai": { lat: 10.9997, lon: 79.4819 },
  "thiruvidaimarudur": { lat: 10.9984, lon: 79.4678 },
  "sembanarkoil": { lat: 11.0853, lon: 79.7431 },
  "vaitheeswaran koil": { lat: 11.2023, lon: 79.7214 },
  "sirkazhi": { lat: 11.2386, lon: 79.7347 },
  "thirukadaiyur": { lat: 11.0771, lon: 79.8078 },
  "kumbakonam": { lat: 10.9602, lon: 79.3844 },

  // Chennai and suburbs
  "chennai": { lat: 13.0827, lon: 80.2707 },
  "adyar": { lat: 13.0063, lon: 80.2574 },
  "velachery": { lat: 12.9796, lon: 80.2201 },
  "t nagar": { lat: 13.0405, lon: 80.2337 },
  "guindy": { lat: 13.0067, lon: 80.2206 },
  "tambaram": { lat: 12.9249, lon: 80.1247 },
  "ambattur": { lat: 13.1143, lon: 80.1548 },
  "mylapore": { lat: 13.0330, lon: 80.2690 },
  "nungambakkam": { lat: 13.0569, lon: 80.2425 },
  "chromepet": { lat: 12.9516, lon: 80.1401 },
  "porur": { lat: 13.0382, lon: 80.1565 },
  "anna nagar": { lat: 13.0850, lon: 80.2101 },

  // Madurai and suburbs
  "madurai": { lat: 9.9252, lon: 78.1198 },
  "mattuthavani": { lat: 9.9392, lon: 78.1517 },
  "goripalayam": { lat: 9.9322, lon: 78.1311 },
  "thirunagar": { lat: 9.8794, lon: 78.0708 },
  "sellur": { lat: 9.9458, lon: 78.1258 },
  "simmakkal": { lat: 9.9245, lon: 78.1292 },
  "kudur": { lat: 9.9200, lon: 78.1500 },
  "arapalayam": { lat: 9.9333, lon: 78.1064 },
  "k pudur": { lat: 9.9442, lon: 78.1481 },

  // Salem and suburbs
  "salem": { lat: 11.6643, lon: 78.1460 },
  "suramangalam": { lat: 11.6853, lon: 78.1136 },
  "hasthampatti": { lat: 11.6800, lon: 78.1583 },
  "ammapet": { lat: 11.6567, lon: 78.1883 },
  "dadagapatti": { lat: 11.6322, lon: 78.1458 },
  "steel plant": { lat: 11.6522, lon: 78.0500 },
  "shevapet": { lat: 11.6528, lon: 78.1378 },
  "fairlands": { lat: 11.6750, lon: 78.1400 },
  "kondalampatti": { lat: 11.6217, lon: 78.1333 },

  // Trichy and suburbs
  "trichy": { lat: 10.7905, lon: 78.7047 },
  "tiruchirappalli": { lat: 10.7905, lon: 78.7047 },
  "srirangam": { lat: 10.8622, lon: 78.6900 },
  "thillai nagar": { lat: 10.8286, lon: 78.6840 },
  "cantonment": { lat: 10.8122, lon: 78.6858 },
  "kk nagar": { lat: 10.7850, lon: 78.6980 },
  "lalgudi": { lat: 10.8689, lon: 78.8286 },
  "thuvakudi": { lat: 10.7583, lon: 78.8083 },
  "woraiur": { lat: 10.8314, lon: 78.6692 },
  "kattur": { lat: 10.7942, lon: 78.7369 },

  // Tiruppur and suburbs
  "tiruppur": { lat: 11.1085, lon: 77.3411 },
  "nallur": { lat: 11.1008, lon: 77.3683 },
  "avinashi": { lat: 11.1931, lon: 77.2681 },
  "palladam": { lat: 10.9886, lon: 77.2764 },
  "15 velampalayam": { lat: 11.1444, lon: 77.3306 },
  "veerapandi": { lat: 11.0772, lon: 77.3389 },
  "uthukuli": { lat: 11.1603, lon: 77.4478 },
  "kangeyam": { lat: 11.0050, lon: 77.5644 },

  // Erode and suburbs
  "erode": { lat: 11.3410, lon: 77.7172 },
  "thindal": { lat: 11.3197, lon: 77.6797 },
  "perundurai": { lat: 11.2742, lon: 77.5858 },
  "pallipalayam": { lat: 11.3533, lon: 77.7289 },
  "bhavani": { lat: 11.4464, lon: 77.6811 },
  "solar": { lat: 11.3094, lon: 77.7472 },
  "kasipalayam": { lat: 11.3283, lon: 77.7244 },

  // Other regional points
  "vellore": { lat: 12.9165, lon: 79.1325 },
  "tirunelveli": { lat: 8.7139, lon: 77.7567 },
  "thanjavur": { lat: 10.7870, lon: 79.1378 },
  "dindigul": { lat: 10.3673, lon: 77.9803 },
  "ooty": { lat: 11.4102, lon: 76.6950 },
  "udhumalpet": { lat: 10.5852, lon: 77.2435 }
};

export const REGIONAL_SUBURBS: Record<string, string[]> = {
  "thirumanancheri": [
    "Mayiladuthurai", "Kuthalam", "Kurumanakudi", "Pandanallur", "Aduthurai", 
    "Thiruvidaimarudur", "Sembanarkoil", "Vaitheeswaran Koil", "Sirkazhi", "Kumbakonam"
  ],
  "thirumanancheri temple": [
    "Mayiladuthurai", "Kuthalam", "Kurumanakudi", "Pandanallur", "Aduthurai", 
    "Thiruvidaimarudur", "Sembanarkoil", "Vaitheeswaran Koil", "Sirkazhi", "Kumbakonam"
  ],
  "chennai": [
    "Adyar", "Velachery", "T Nagar", "Guindy", "Tambaram", "Ambattur", 
    "Mylapore", "Nungambakkam", "Chromepet", "Porur", "Anna Nagar"
  ],
  "madurai": [
    "Mattuthavani", "Goripalayam", "Anna Nagar", "Thirunagar", "Sellur", 
    "Simmakkal", "Kudur", "Arapalayam", "K Pudur"
  ],
  "salem": [
    "Suramangalam", "Hasthampatti", "Ammapet", "Dadagapatti", "Steel Plant",
    "Shevapet", "Fairlands", "Kondalampatti"
  ],
  "trichy": [
    "Srirangam", "Thillai Nagar", "Cantonment", "KK Nagar", "Lalgudi",
    "Thuvakudi", "Woraiur", "Kattur"
  ],
  "tiruppur": [
    "Nallur", "Avinashi", "Palladam", "15 Velampalayam", "Veerapandi",
    "Uthukuli", "Kangeyam"
  ],
  "erode": [
    "Thindal", "Perundurai", "Pallipalayam", "Bhavani", "Solar",
    "Sathy Road", "Kasipalayam"
  ]
};

/**
 * Returns exact or deterministic lat/lon coordinate set for any location string
 */
export const getCoordsForPlace = (placeName: string, relativeTo?: { lat: number; lon: number }): { lat: number; lon: number } => {
  const clean = placeName.toLowerCase().trim();
  
  // Try exact lookup from database
  for (const [key, coords] of Object.entries(LOCAL_COORDINATES)) {
    if (clean === key || clean.startsWith(key + ",") || clean.includes(" " + key)) {
      return coords;
    }
  }

  // Broad search if previous failed
  for (const [key, coords] of Object.entries(LOCAL_COORDINATES)) {
    if (clean.includes(key)) {
      return coords;
    }
  }
  
  // Parse out coordinates if formatted as "Near XX.XX, YY.YY"
  const regex = /Near\s+([0-9.-]+)\s*°?N?,\s*([0-9.-]+)\s*°?E?/i;
  const match = placeName.match(regex);
  if (match) {
    return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) };
  }

  // Parse out coordinates if formatted as "XX.XX, YY.YY" directly
  const simpleRegex = /^([0-9.-]+)\s*,\s*([0-9.-]+)$/;
  const simpleMatch = placeName.match(simpleRegex);
  if (simpleMatch) {
    return { lat: parseFloat(simpleMatch[1]), lon: parseFloat(simpleMatch[2]) };
  }

  // Stable deterministic generator mapping based on custom/unregistered string hash
  let hash = 0;
  for (let i = 0; i < placeName.length; i++) {
    hash = (hash << 5) - hash + placeName.charCodeAt(i);
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radiusDegrees = 0.03 + (Math.abs(hash % 60) / 1000); // Dynamic localized offset (approx 3 to 9 km)
  
  const baseLat = relativeTo ? relativeTo.lat : 11.1444; // default to Thirumanancheri Temple
  const baseLon = relativeTo ? relativeTo.lon : 79.5744;

  return {
    lat: baseLat + Math.sin(angle) * radiusDegrees,
    lon: baseLon + Math.cos(angle) * radiusDegrees
  };
};

/**
 * Calculates physical Haversine distance in KM between any two locations
 */
export const getDistanceBetween = (locA: string, locB: string): number => {
  const cleanStr = (s: string) => s.toLowerCase().replace(/,?\s*tamil\s*nadu/gi, "").trim();
  const a = cleanStr(locA);
  const b = cleanStr(locB);
  
  if (a === b || a.includes(b) || b.includes(a)) {
    return 1.5; // very close proximity
  }

  const coordsA = getCoordsForPlace(locA);
  // Generate coordsB relative to coordsA so unrecognized places cluster realistically
  const coordsB = getCoordsForPlace(locB, coordsA);

  const R = 6371; // Earth Radius in KM
  const dLat = ((coordsB.lat - coordsA.lat) * Math.PI) / 180;
  const dLon = ((coordsB.lon - coordsA.lon) * Math.PI) / 180;
  const lat1 = (coordsA.lat * Math.PI) / 180;
  const lat2 = (coordsB.lat * Math.PI) / 180;

  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  const d = R * c;

  return Number(Math.max(0.5, d).toFixed(1));
};

/**
 * Selects or generates rich surrounding suburbs dynamically around any center location
 */
export const getSuburbsForCenter = (centerName: string): string[] => {
  const clean = centerName.toLowerCase().trim();
  const centerCoords = getCoordsForPlace(centerName);

  const list: { name: string; distance: number }[] = [];

  // 1. Calculate physical Haversine distance to all pre-registered coordinates in the app
  for (const [key, coords] of Object.entries(LOCAL_COORDINATES)) {
    // Skip the central place itself (exact match or partial match) to avoid listing center in the suburbs
    if (clean === key || clean.startsWith(key + ",") || key.startsWith(clean) || key === "thirumanancheri temple" && clean === "thirumanancheri") {
      continue;
    }

    const R = 6371; // Earth Radius in KM
    const dLat = ((coords.lat - centerCoords.lat) * Math.PI) / 180;
    const dLon = ((coords.lon - centerCoords.lon) * Math.PI) / 180;
    const lat1 = (centerCoords.lat * Math.PI) / 180;
    const lat2 = (coords.lat * Math.PI) / 180;

    const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    const distance = R * c;

    list.push({ name: key, distance });
  }

  // Sort by physical proximity (closest first)
  list.sort((a, b) => a.distance - b.distance);

  // Helper to format names beautifully (capitalize each word)
  const formatName = (str: string) => {
    return str
      .split(" ")
      .map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  };

  // Keep places that are within 35 km (covers local taluk and adjacent major centers)
  const nearby = list.filter(item => item.distance <= 35);

  if (nearby.length >= 4) {
    // Return up to 15 nearby places
    return nearby.slice(0, 15).map(item => formatName(item.name));
  }

  // Fallback: If less than 4 places found within 35 km, return the top 12 closest overall
  if (list.length > 0) {
    return list.slice(0, 12).map(item => formatName(item.name));
  }

  // Ultimate fallback
  return [
    "North Hub", "East Sector", "West Sector", "South Hub", 
    "Central Zone", "Avenue Block", "Highroad Junction", "Industrial Ring"
  ];
};
