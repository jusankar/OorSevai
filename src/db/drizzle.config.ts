import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env file.
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;
const port = Number(process.env.SQL_PORT || 5432);

if (!databaseUrl && (!sqlHost || !sqlDbName || !user || !password)) {
  throw new Error(
    "Either DATABASE_URL or the full set of SQL environment variables (SQL_HOST, SQL_DB_NAME, SQL_ADMIN_USER, SQL_ADMIN_PASSWORD) must be provided."
  );
}

if (databaseUrl) {
  console.log("Using DATABASE_URL connection string for schema migrations.");
} else {
  console.log(`Using user: ${user} on host: ${sqlHost} for schema migrations.`);
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle", // Output directory for migrations.
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: databaseUrl
    ? {
        url: databaseUrl,
      }
    : {
        host: sqlHost!,
        port: port,
        user: user!,
        password: password!,
        database: sqlDbName!,
        ssl: (sqlHost !== "localhost" && !sqlHost.startsWith("/")) ? "require" : undefined,
      },
  verbose: true,
});
