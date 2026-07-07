export interface DeliveryZone {
  id: string;
  name: string;
  radiusKm: number; // radius in km from equipment location
  deliveryFee: number; // custom delivery fee in ₹
  color: string; // Tailwind bg- color or border- color for visual mapping
}

export interface Equipment {
  id: string;
  name: string;
  category: "agriculture" | "construction" | "tools" | "function";
  subCategory: string; // Tractor, Harvester, Generator, etc.
  image: string;
  pricePerDay: number;
  rating: number;
  reviewsCount: number;
  distance: number; // in km
  ownerName: string;
  ownerId: string;
  specs: {
    power?: string; // e.g. "50 HP"
    fuel?: string; // e.g. "Diesel"
    drive?: string; // e.g. "4 WD"
    year?: string; // e.g. "2019"
    operatorIncluded?: boolean;
    [key: string]: any;
  };
  about: string;
  location: string;
  verified: boolean;
  status: "active" | "inactive";
  deliveryZones?: DeliveryZone[]; // Owner customized delivery geofence rings
  usageHours?: number;
  lastServiceHours?: number;
  serviceDueIntervalHours?: number;
  serviceDue?: boolean;
}

export interface Laborer {
  id: string;
  name: string;
  category: string; // Farm labor, Mason, Carpenter, Electrician, Plumber, etc.
  image: string;
  pricePerDay: number;
  rating: number;
  reviewsCount: number;
  location: string;
  distance: number;
  availability: "available" | "unavailable";
  experience: string; // e.g. "5 Years"
  verified: boolean;
  gender?: "Male" | "Female" | "Other";
  kycDocName?: string;
  kycStatus?: "pending" | "verified" | "rejected" | "none";
}

export interface Booking {
  id: string;
  type: "equipment" | "labor";
  itemId: string;
  itemName: string;
  itemImage: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalAmount: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  customerName: string;
  customerId?: string; // registered user's mobile number
  location: string;
  deliveryMethod?: "delivery" | "pickup";
  operatorOption?: boolean;
  paymentStatus: "paid" | "refunded" | "pending";
  dateBooked: string;
  loggedHours?: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "owner";
  text: string;
  timestamp: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  itemName: string;
  complainant: string;
  reason: string;
  status: "open" | "resolved";
  date: string;
}

export interface AppNotification {
  id: string;
  bookingId: string;
  title: string;
  message: string;
  type: "equipment_on_the_way" | "labor_shift_start" | "general";
  isRead: boolean;
  timestamp: string;
}
