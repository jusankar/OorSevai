import "dotenv/config";
import { db } from "./src/db/index.js";
import { equipment, laborers } from "./src/db/schema.js";

async function test() {
  try {
    const eqRows = await db.select().from(equipment);
    const lbRows = await db.select().from(laborers);
    console.log("EQUIPMENT COUNT:", eqRows.length);
    eqRows.forEach(r => console.log(`  - ID: ${r.id}, Name: ${r.name}, Cat: ${r.category}, Sub: ${r.subCategory}, Loc: ${r.location}, Status: ${r.status}`));
    console.log("LABORERS COUNT:", lbRows.length);
    lbRows.forEach(r => console.log(`  - ID: ${r.id}, Name: ${r.name}, Cat: ${r.category}, Loc: ${r.location}, Avail: ${r.availability}, Verified: ${r.verified}`));
  } catch (err) {
    console.error("DB Error:", err);
  }
}
test();
