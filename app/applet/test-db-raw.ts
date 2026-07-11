import pg from "pg";
const { Client } = pg;

async function main() {
  const host = process.env.SQL_HOST || "localhost";
  const user = process.env.SQL_USER || "postgres";
  const password = process.env.SQL_PASSWORD || "";
  const database = process.env.SQL_DB_NAME || "cloud_sql_development_database";
  const port = host.startsWith("/") ? 5432 : 5432;

  console.log("Connecting with:", { host, user, database, port, hasPassword: !!password });

  const client = new Client({
    host,
    user,
    password,
    database,
    port,
    ssl: (host !== "localhost" && !host.startsWith("/")) ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log("Successfully connected!");
    const res = await client.query("SELECT NOW()");
    console.log("Query result:", res.rows[0]);
    
    const tables = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log("Tables in public:", tables.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await client.end();
  }
}

main();
