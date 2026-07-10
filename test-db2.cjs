const pg = require("pg");

async function test() {
  const pool = new pg.Pool({
    connectionString: "postgresql://postgres.iznxwoptmozropnquiir:P05tg635data@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query("INSERT INTO equipment (id, name, category, sub_category, image, price_per_day, price_per_hour, about, owner_id, status) VALUES ('123', 'Test Eq', 'Heavy', 'Excavator', 'http://example.com/img.jpg', 100, null, 'Test About', '9876543210', 'available') RETURNING *");
    console.log("Insert result:", res.rows[0]);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    pool.end();
  }
}
test();
