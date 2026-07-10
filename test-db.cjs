const pg = require("pg");

async function test() {
  const pool = new pg.Pool({
    connectionString: "postgresql://postgres.iznxwoptmozropnquiir:P05tg635data@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("DB Time:", res.rows[0]);
    
    // Check if equipment table exists
    const res2 = await pool.query("SELECT count(*) FROM equipment");
    console.log("Equipment count:", res2.rows[0]);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}
test();
