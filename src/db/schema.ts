import { pgTable, text, integer, boolean, doublePrecision, json, timestamp } from "drizzle-orm/pg-core";

// Users Table
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Using text to match Firebase UID or unique registration string
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  location: text("location"),
  roles: text("roles"), // Comma-separated roles (e.g. "customer,owner,labor,admin")
  currentRole: text("current_role"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment Table
export const equipment = pgTable("equipment", {
  id: text("id").primaryKey(), // text to preserve IDs like "eq-1"
  name: text("name").notNull(),
  category: text("category").notNull(), // "agriculture" | "construction" | "tools" | "function"
  subCategory: text("sub_category").notNull(),
  image: text("image").notNull(),
  pricePerDay: integer("price_per_day").notNull(),
  rating: doublePrecision("rating").default(4.5),
  reviewsCount: integer("reviews_count").default(0),
  distance: doublePrecision("distance").default(1.0),
  ownerName: text("owner_name").notNull(),
  ownerId: text("owner_id").notNull(),
  specs: json("specs").notNull(), // specs dictionary
  about: text("about").notNull(),
  location: text("location").notNull(),
  verified: boolean("verified").default(false),
  status: text("status").default("active"), // "active" | "inactive"
  usageHours: integer("usage_hours").default(0),
  lastServiceHours: integer("last_service_hours").default(0),
  serviceDueIntervalHours: integer("service_due_interval_hours").default(50),
  serviceDue: boolean("service_due").default(false),
  deliveryZones: json("delivery_zones"), // owner customized zones list
  createdAt: timestamp("created_at").defaultNow(),
});

// Laborers Table
export const laborers = pgTable("laborers", {
  id: text("id").primaryKey(), // text to preserve "lb-1"
  name: text("name").notNull(),
  category: text("category").notNull(),
  image: text("image").notNull(),
  pricePerDay: integer("price_per_day").notNull(),
  rating: doublePrecision("rating").default(4.5),
  reviewsCount: integer("reviews_count").default(0),
  location: text("location").notNull(),
  distance: doublePrecision("distance").default(1.0),
  availability: text("availability").default("available"), // "available" | "unavailable"
  experience: text("experience").notNull(),
  verified: boolean("verified").default(false),
  gender: text("gender"),
  kycDocName: text("kyc_doc_name"),
  kycStatus: text("kyc_status").default("none"), // "none" | "pending" | "verified" | "rejected"
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings Table
export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // "equipment" | "labor"
  itemId: text("item_id").notNull(),
  itemName: text("item_name").notNull(),
  itemImage: text("item_image").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  durationDays: integer("duration_days").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull(), // "upcoming" | "ongoing" | "completed" | "cancelled"
  customerName: text("customer_name").notNull(),
  customerId: text("customer_id"), // linked to user's registered mobile number/phone
  location: text("location").notNull(),
  deliveryMethod: text("delivery_method"), // "delivery" | "pickup"
  operatorOption: boolean("operator_option"),
  paymentStatus: text("payment_status").notNull(), // "paid" | "refunded" | "pending"
  dateBooked: text("date_booked").notNull(),
  loggedHours: integer("logged_hours").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Disputes Table
export const disputes = pgTable("disputes", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  itemName: text("item_name").notNull(),
  complainant: text("complainant").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull(), // "open" | "resolved"
  date: text("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// App Notifications Table
export const appNotifications = pgTable("app_notifications", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "equipment_on_the_way" | "labor_shift_start" | "general"
  isRead: boolean("is_read").default(false),
  timestamp: text("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
