import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

// Function to create a new connection pool.
export const createPool = () => {
  if (process.env.DATABASE_URL) {
    console.log("Using DATABASE_URL for connection...");
    const isVercel = Boolean(process.env.VERCEL);
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000, // Increased timeout
      idleTimeoutMillis: isVercel ? 100 : 10000, // Close idle connections quickly on Vercel to prevent stale connections
      max: isVercel ? 1 : 10, // Max 1 connection per serverless function instance
      ssl: { rejectUnauthorized: false },
    });
  }

  const host = process.env.SQL_HOST || "localhost";
  const user = process.env.SQL_USER || "postgres";
  const password = process.env.SQL_PASSWORD;
  const database = process.env.SQL_DB_NAME || "oorsevai";
  const port = process.env.SQL_PORT || 5432;

  return new Pool({
    host,
    user,
    port: Number(port),
    password: typeof password === "string" ? password : "",
    database,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    max: 10,
    keepAlive: true,
    ssl: host !== "localhost" ? { rejectUnauthorized: false } : false,
  });
};

// Create a pool instance.
const pool = createPool();

// Prevent unhandled pool-level errors from crashing the application
pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });
export type Database = typeof db;
export { schema };
