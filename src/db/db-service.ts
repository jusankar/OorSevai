import { db } from "./index.ts";
import { users, equipment, laborers, bookings, disputes, appNotifications } from "./schema.ts";
import { eq, or, like, isNull } from "drizzle-orm";

// ------------------------------------------
// 1. Users Queries (Query Layer)
// ------------------------------------------

export async function getUser(id: string) {
  try {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  } catch (error) {
    console.error(`Database getUser failed for ${id}:`, error);
    throw new Error("Failed to retrieve user profile.", { cause: error });
  }
}

export async function upsertUser(data: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  roles?: string;
  currentRole?: string;
}) {
  try {
    const result = await db
      .insert(users)
      .values({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        location: data.location || null,
        roles: data.roles || null,
        currentRole: data.currentRole || null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          location: data.location || null,
          roles: data.roles || null,
          currentRole: data.currentRole || null,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database upsertUser failed:", error);
    throw new Error("Failed to save user profile.", { cause: error });
  }
}

// ------------------------------------------
// 2. Equipment Queries (Query Layer)
// ------------------------------------------

export async function getEquipmentList() {
  try {
    return await db.select().from(equipment);
  } catch (error) {
    console.error("Database getEquipmentList failed:", error);
    throw new Error("Failed to retrieve equipment list.", { cause: error });
  }
}

export async function addEquipmentItem(item: any) {
  try {
    const result = await db
      .insert(equipment)
      .values({
        id: item.id,
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        image: item.image,
        pricePerDay: item.pricePerDay,
        rating: item.rating ? parseFloat(item.rating.toString()) : 4.5,
        reviewsCount: item.reviewsCount ? parseInt(item.reviewsCount.toString()) : 0,
        distance: item.distance ? parseFloat(item.distance.toString()) : 1.0,
        ownerName: item.ownerName,
        ownerId: item.ownerId,
        specs: item.specs || {},
        about: item.about,
        location: item.location,
        verified: !!item.verified,
        status: item.status || "active",
        usageHours: item.usageHours ? parseInt(item.usageHours.toString()) : 0,
        lastServiceHours: item.lastServiceHours ? parseInt(item.lastServiceHours.toString()) : 0,
        serviceDueIntervalHours: item.serviceDueIntervalHours ? parseInt(item.serviceDueIntervalHours.toString()) : 50,
        serviceDue: !!item.serviceDue,
        deliveryZones: item.deliveryZones || [],
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database addEquipmentItem failed:", error);
    throw new Error("Failed to add equipment item.", { cause: error });
  }
}

export async function updateEquipmentItem(id: string, item: any) {
  try {
    const result = await db
      .update(equipment)
      .set({
        name: item.name,
        category: item.category,
        subCategory: item.subCategory,
        image: item.image,
        pricePerDay: item.pricePerDay,
        rating: item.rating ? parseFloat(item.rating.toString()) : undefined,
        reviewsCount: item.reviewsCount ? parseInt(item.reviewsCount.toString()) : undefined,
        distance: item.distance ? parseFloat(item.distance.toString()) : undefined,
        specs: item.specs,
        about: item.about,
        location: item.location,
        verified: item.verified !== undefined ? !!item.verified : undefined,
        status: item.status,
        usageHours: item.usageHours ? parseInt(item.usageHours.toString()) : undefined,
        lastServiceHours: item.lastServiceHours ? parseInt(item.lastServiceHours.toString()) : undefined,
        serviceDueIntervalHours: item.serviceDueIntervalHours ? parseInt(item.serviceDueIntervalHours.toString()) : undefined,
        serviceDue: item.serviceDue !== undefined ? !!item.serviceDue : undefined,
        deliveryZones: item.deliveryZones,
      })
      .where(eq(equipment.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Database updateEquipmentItem failed for ${id}:`, error);
    throw new Error("Failed to update equipment item.", { cause: error });
  }
}

export async function deleteEquipmentItem(id: string) {
  try {
    const result = await db.delete(equipment).where(eq(equipment.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error(`Database deleteEquipmentItem failed for ${id}:`, error);
    throw new Error("Failed to delete equipment item.", { cause: error });
  }
}

// ------------------------------------------
// 3. Laborers Queries (Query Layer)
// ------------------------------------------

export async function getLaborersList() {
  try {
    return await db.select().from(laborers);
  } catch (error) {
    console.error("Database getLaborersList failed:", error);
    throw new Error("Failed to retrieve laborers list.", { cause: error });
  }
}

export async function addLaborerItem(item: any) {
  try {
    const result = await db
      .insert(laborers)
      .values({
        id: item.id,
        name: item.name,
        category: item.category,
        image: item.image,
        pricePerDay: item.pricePerDay,
        rating: item.rating ? parseFloat(item.rating.toString()) : 4.5,
        reviewsCount: item.reviewsCount ? parseInt(item.reviewsCount.toString()) : 0,
        location: item.location,
        distance: item.distance ? parseFloat(item.distance.toString()) : 1.0,
        availability: item.availability || "available",
        experience: item.experience,
        verified: !!item.verified,
        gender: item.gender,
        kycDocName: item.kycDocName,
        kycStatus: item.kycStatus || "none",
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database addLaborerItem failed:", error);
    throw new Error("Failed to add laborer profile.", { cause: error });
  }
}

export async function updateLaborerItem(id: string, item: any) {
  try {
    const result = await db
      .update(laborers)
      .set({
        name: item.name,
        category: item.category,
        image: item.image,
        pricePerDay: item.pricePerDay,
        rating: item.rating ? parseFloat(item.rating.toString()) : undefined,
        reviewsCount: item.reviewsCount ? parseInt(item.reviewsCount.toString()) : undefined,
        location: item.location,
        distance: item.distance ? parseFloat(item.distance.toString()) : undefined,
        availability: item.availability,
        experience: item.experience,
        verified: item.verified !== undefined ? !!item.verified : undefined,
        gender: item.gender,
        kycDocName: item.kycDocName,
        kycStatus: item.kycStatus,
      })
      .where(eq(laborers.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Database updateLaborerItem failed for ${id}:`, error);
    throw new Error("Failed to update laborer profile.", { cause: error });
  }
}

export async function deleteLaborerItem(id: string) {
  try {
    const result = await db.delete(laborers).where(eq(laborers.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error(`Database deleteLaborerItem failed for ${id}:`, error);
    throw new Error("Failed to delete laborer profile.", { cause: error });
  }
}

// ------------------------------------------
// 4. Bookings Queries (Query Layer)
// ------------------------------------------

export async function getBookingsList(customerId?: string) {
  try {
    if (customerId) {
      const isMockUser = customerId === "9999999999" || customerId === "9876543210" || customerId === "8888888888" || customerId === "999999999";
      if (isMockUser) {
        return await db.select().from(bookings).where(
          or(
            eq(bookings.customerId, customerId),
            eq(bookings.itemId, "lb-4"),
            eq(bookings.itemId, customerId),
            like(bookings.itemId, `lb-${customerId}-%`)
          )
        );
      } else {
        return await db.select().from(bookings).where(
          or(
            eq(bookings.customerId, customerId),
            eq(bookings.itemId, customerId),
            like(bookings.itemId, `lb-${customerId}-%`)
          )
        );
      }
    }
    return await db.select().from(bookings);
  } catch (error) {
    console.error("Database getBookingsList failed:", error);
    throw new Error("Failed to retrieve bookings list.", { cause: error });
  }
}

export async function addBookingItem(item: any) {
  try {
    const result = await db
      .insert(bookings)
      .values({
        id: item.id,
        type: item.type,
        itemId: item.itemId,
        itemName: item.itemName,
        itemImage: item.itemImage,
        startDate: item.startDate,
        endDate: item.endDate,
        durationDays: parseInt(item.durationDays.toString()),
        totalAmount: parseInt(item.totalAmount.toString()),
        status: item.status || "upcoming",
        customerName: item.customerName,
        customerId: item.customerId || null,
        location: item.location,
        deliveryMethod: item.deliveryMethod || null,
        operatorOption: item.operatorOption !== undefined ? !!item.operatorOption : null,
        paymentStatus: item.paymentStatus || "pending",
        dateBooked: item.dateBooked,
        loggedHours: item.loggedHours ? parseInt(item.loggedHours.toString()) : 0,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database addBookingItem failed:", error);
    throw new Error("Failed to create booking.", { cause: error });
  }
}

export async function updateBookingItem(id: string, item: any) {
  try {
    const updatePayload: any = {};
    if (item.status !== undefined) updatePayload.status = item.status;
    if (item.paymentStatus !== undefined) updatePayload.paymentStatus = item.paymentStatus;
    if (item.loggedHours !== undefined) updatePayload.loggedHours = parseInt(item.loggedHours.toString());

    const result = await db
      .update(bookings)
      .set(updatePayload)
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Database updateBookingItem failed for ${id}:`, error);
    throw new Error("Failed to update booking.", { cause: error });
  }
}

// ------------------------------------------
// 5. Disputes Queries (Query Layer)
// ------------------------------------------

export async function getDisputesList() {
  try {
    return await db.select().from(disputes);
  } catch (error) {
    console.error("Database getDisputesList failed:", error);
    throw new Error("Failed to retrieve disputes list.", { cause: error });
  }
}

export async function addDisputeItem(item: any) {
  try {
    const result = await db
      .insert(disputes)
      .values({
        id: item.id,
        bookingId: item.bookingId,
        itemName: item.itemName,
        complainant: item.complainant,
        reason: item.reason,
        status: item.status || "open",
        date: item.date,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database addDisputeItem failed:", error);
    throw new Error("Failed to register dispute.", { cause: error });
  }
}

export async function updateDisputeItem(id: string, item: any) {
  try {
    const result = await db
      .update(disputes)
      .set({
        status: item.status,
      })
      .where(eq(disputes.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Database updateDisputeItem failed for ${id}:`, error);
    throw new Error("Failed to update dispute status.", { cause: error });
  }
}

// ------------------------------------------
// 6. Notifications Queries (Query Layer)
// ------------------------------------------

export async function getNotificationsList(recipientId?: string) {
  try {
    if (recipientId) {
      return await db
        .select()
        .from(appNotifications)
        .where(
          or(
            eq(appNotifications.recipientId, recipientId),
            isNull(appNotifications.recipientId)
          )
        );
    }
    return await db.select().from(appNotifications);
  } catch (error) {
    console.error("Database getNotificationsList failed:", error);
    throw new Error("Failed to retrieve notifications.", { cause: error });
  }
}

export async function addNotificationItem(item: any) {
  try {
    const result = await db
      .insert(appNotifications)
      .values({
        id: item.id,
        bookingId: item.bookingId,
        title: item.title,
        message: item.message,
        type: item.type,
        recipientId: item.recipientId || null,
        isRead: !!item.isRead,
        timestamp: item.timestamp,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database addNotificationItem failed:", error);
    throw new Error("Failed to create notification.", { cause: error });
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const result = await db
      .update(appNotifications)
      .set({ isRead: true })
      .where(eq(appNotifications.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Database markNotificationAsRead failed for ${id}:`, error);
    throw new Error("Failed to mark notification as read.", { cause: error });
  }
}

