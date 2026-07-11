import { db } from "./index.js";
import { equipment, laborers } from "./schema.js";
import { DEFAULT_EQUIPMENT, DEFAULT_LABORERS } from "../data.js";

export async function autoSeed() {
  try {
    console.log("Checking database seed status...");
    
    // Check and seed equipment
    const existingEquipment = await db.select({ id: equipment.id }).from(equipment);
    const existingEqIds = new Set(existingEquipment.map(e => e.id));
    const missingEq = DEFAULT_EQUIPMENT.filter(item => !existingEqIds.has(item.id));
    
    if (missingEq.length > 0) {
      console.log(`Seeding ${missingEq.length} missing equipment items into database...`);
      const mappedEq = missingEq.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        image: item.image,
        pricePerDay: item.pricePerDay,
        rating: item.rating ?? 4.5,
        reviewsCount: item.reviewsCount ?? 0,
        distance: item.distance ?? 1.0,
        ownerName: item.ownerName,
        ownerId: item.ownerId,
        specs: item.specs ?? {},
        about: item.about,
        location: item.location || "Coimbatore, Tamil Nadu",
        verified: item.verified ?? false,
        status: item.status || "active",
        usageHours: item.usageHours ?? 0,
        lastServiceHours: item.lastServiceHours ?? 0,
        serviceDueIntervalHours: item.serviceDueIntervalHours ?? 50,
        serviceDue: item.serviceDue ?? false,
        deliveryZones: item.deliveryZones ?? []
      }));
      
      await db.insert(equipment).values(mappedEq);
      console.log(`Successfully seeded ${missingEq.length} equipment items!`);
    } else {
      console.log("All default equipment items are already present in the database.");
    }

    // Check and seed laborers
    const existingLaborers = await db.select({ id: laborers.id }).from(laborers);
    const existingLbIds = new Set(existingLaborers.map(l => l.id));
    const missingLb = DEFAULT_LABORERS.filter(item => !existingLbIds.has(item.id));
    
    if (missingLb.length > 0) {
      console.log(`Seeding ${missingLb.length} missing laborers into database...`);
      const mappedLb = missingLb.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        image: item.image,
        pricePerDay: item.pricePerDay,
        rating: item.rating ?? 4.5,
        reviewsCount: item.reviewsCount ?? 0,
        location: item.location || "Coimbatore, Tamil Nadu",
        distance: item.distance ?? 1.0,
        availability: item.availability || "available",
        experience: item.experience,
        verified: item.verified ?? false,
        gender: item.gender || "Male",
        kycDocName: item.kycDocName || "Aadhaar Card",
        kycStatus: item.kycStatus || "pending"
      }));

      await db.insert(laborers).values(mappedLb);
      console.log(`Successfully seeded ${missingLb.length} laborers!`);
    } else {
      console.log("All default laborers are already present in the database.");
    }
  } catch (err) {
    console.error("Failed to auto-seed database:", err);
  }
}
