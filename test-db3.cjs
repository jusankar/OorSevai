async function test() {
  const drizzle = await import("drizzle-orm/node-postgres");
  const pg = require("pg");
  const schema = await import("./src/db/schema.ts");

  // This will fail because it's a CJS script trying to import a TS file without tsx.
}
test();
