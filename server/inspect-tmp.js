const pool = require("./config/db");
(async () => {
  const u = await pool.query(`SELECT id, email, email_verified AS is_verified, role FROM users WHERE email='student@test.com'`);
  console.log("user:", JSON.stringify(u.rows[0]));
  const n = await pool.query(`SELECT COUNT(*)::int c FROM projects WHERE status='approved'`);
  console.log("approved projects:", n.rows[0].c);
  process.exit(0);
})();
