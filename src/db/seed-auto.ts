import { db } from "./index.ts";
import { equipment, laborers, bookings, disputes, appNotifications } from "./schema.ts";
import { DEFAULT_EQUIPMENT, DEFAULT_LABORERS } from "../data.ts";

export async function autoSeed() {
  try {
    // 1. Seed equipment
    const existingEquip = await db.select({ id: equipment.id }).from(equipment).limit(1);
    if (existingEquip.length === 0) {
      console.log("Seeding equipment table...");
      for (const eq of DEFAULT_EQUIPMENT) {
        await db.insert(equipment).values({
          id: eq.id,
          name: eq.name,
          category: eq.category,
          subCategory: eq.subCategory,
          image: eq.image,
          pricePerDay: eq.pricePerDay,
          rating: eq.rating || 4.5,
          reviewsCount: eq.reviewsCount || 0,
          distance: eq.distance || 1.0,
          ownerName: eq.ownerName,
          ownerId: eq.ownerId,
          specs: eq.specs,
          about: eq.about,
          location: eq.location,
          verified: eq.verified || false,
          status: eq.status || "active",
          usageHours: eq.usageHours || 0,
          lastServiceHours: eq.lastServiceHours || 0,
          serviceDueIntervalHours: eq.serviceDueIntervalHours || 50,
          serviceDue: eq.serviceDue || false,
          deliveryZones: eq.deliveryZones || [],
        });
      }
      console.log("Equipment seeded successfully.");
    }

    // 2. Seed laborers
    const existingLabor = await db.select({ id: laborers.id }).from(laborers).limit(1);
    if (existingLabor.length === 0) {
      console.log("Seeding laborers table...");
      for (const lb of DEFAULT_LABORERS) {
        await db.insert(laborers).values({
          id: lb.id,
          name: lb.name,
          category: lb.category,
          image: lb.image,
          pricePerDay: lb.pricePerDay,
          rating: lb.rating || 4.5,
          reviewsCount: lb.reviewsCount || 0,
          location: lb.location,
          distance: lb.distance || 1.0,
          availability: lb.availability || "available",
          experience: lb.experience,
          verified: lb.verified || false,
          gender: lb.gender || "Male",
          kycDocName: lb.kycDocName || "",
          kycStatus: lb.kycStatus || "none",
        });
      }
      console.log("Laborers seeded successfully.");
    }

    // 3. Seed bookings
    const existingBookings = await db.select({ id: bookings.id }).from(bookings).limit(1);
    if (existingBookings.length === 0) {
      console.log("Seeding bookings table...");
      const defaultBookings = [
        {
          id: "BK-12345",
          type: "equipment",
          itemId: "eq-1",
          itemName: "John Deere 5050 D Tractor",
          itemImage: "https://images.unsplash.com/photo-1594142404563-64ccc954aa79?auto=format&fit=crop&w=600&q=80",
          startDate: "2026-07-10",
          endDate: "2026-07-11",
          durationDays: 1,
          totalAmount: 3410,
          status: "upcoming",
          customerName: "Udaya Kumar",
          location: "Coimbatore, Tamil Nadu",
          deliveryMethod: "delivery",
          operatorOption: true,
          paymentStatus: "paid",
          dateBooked: "2026-07-02",
          loggedHours: 0
        },
        {
          id: "BK-12546",
          type: "equipment",
          itemId: "eq-3",
          itemName: "JCB 3DX Backhoe Loader",
          itemImage: "https://images.unsplash.com/photo-1579684389782-64d84b5e901d?auto=format&fit=crop&w=600&q=80",
          startDate: "2026-06-15",
          endDate: "2026-06-16",
          durationDays: 1,
          totalAmount: 9500,
          status: "ongoing",
          customerName: "Udaya Kumar",
          location: "Coimbatore Bypass, Tamil Nadu",
          deliveryMethod: "pickup",
          operatorOption: true,
          paymentStatus: "paid",
          dateBooked: "2026-06-10",
          loggedHours: 0
        },
        {
          id: "BK-12347",
          type: "equipment",
          itemId: "eq-4",
          itemName: "Power Weeder 7.5 HP",
          itemImage: "https://images.unsplash.com/photo-1589923188900-85dae44fc3e3?auto=format&fit=crop&w=600&q=80",
          startDate: "2026-06-18",
          endDate: "2026-06-19",
          durationDays: 1,
          totalAmount: 1200,
          status: "completed",
          customerName: "Udaya Kumar",
          location: "Sulur, Coimbatore",
          deliveryMethod: "pickup",
          operatorOption: false,
          paymentStatus: "paid",
          dateBooked: "2026-06-15",
          loggedHours: 0
        }
      ];

      for (const b of defaultBookings) {
        await db.insert(bookings).values(b);
      }
      console.log("Bookings seeded successfully.");
    }

    // 4. Seed disputes
    const existingDisputes = await db.select({ id: disputes.id }).from(disputes).limit(1);
    if (existingDisputes.length === 0) {
      console.log("Seeding disputes table...");
      const defaultDisputes = [
        {
          id: "DSP-101",
          bookingId: "BK-12347",
          itemName: "Power Weeder 7.5 HP",
          complainant: "Udaya Kumar (Customer)",
          reason: "Machine starter was faulty, spent ₹300 repairing it locally.",
          status: "open",
          date: "2026-06-20"
        }
      ];

      for (const d of defaultDisputes) {
        await db.insert(disputes).values(d);
      }
      console.log("Disputes seeded successfully.");
    }

    // 5. Seed notifications
    const existingNotifs = await db.select({ id: appNotifications.id }).from(appNotifications).limit(1);
    if (existingNotifs.length === 0) {
      console.log("Seeding notifications table...");
      const defaultNotifs = [
        {
          id: "notif-1",
          bookingId: "BK-12345",
          title: "🚚 Equipment On The Way",
          message: "Ravi Kumar's John Deere 5050 D Tractor is on the way to your farm at Coimbatore, Tamil Nadu!",
          type: "equipment_on_the_way",
          isRead: false,
          timestamp: "5 mins ago"
        },
        {
          id: "notif-2",
          bookingId: "BK-12546",
          title: "⏰ Labor Shift Starting",
          message: "Raju Krishnan's mason shift is about to start at Coimbatore Bypass in 30 minutes.",
          type: "labor_shift_start",
          isRead: true,
          timestamp: "1 hour ago"
        }
      ];

      for (const n of defaultNotifs) {
        await db.insert(appNotifications).values(n);
      }
      console.log("Notifications seeded successfully.");
    }
  } catch (err) {
    console.error("Auto seeding failed:", err);
  }
}
