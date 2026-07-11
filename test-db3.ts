import "dotenv/config";
import { db } from "./src/db/index.ts";
import { equipment } from "./src/db/schema.ts";

async function test() {
  try {
    const result = await db.insert(equipment).values({
        id: '123',
        name: 'Test Eq',
        category: 'Heavy',
        subCategory: 'Excavator',
        image: 'http://example.com/img.jpg',
        pricePerDay: 100,
        about: 'Test About',
        ownerId: '9876543210',
        status: 'available',
        location: 'Chennai',
        ownerName: 'Arun',
        specs: 'Test Specs'
    }).returning();
    console.log("Insert result:", result);
  } catch (err) {
    console.error("DB Error:", err);
  }
}
test();
