const pool = require("./config/db");
(async () => {
  try {
    const cols = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='projects' ORDER BY ordinal_position`);
    console.log("PROJECTS COLUMNS:");
    cols.rows.forEach(r => console.log(` - ${r.column_name} ${r.data_type} null=${r.is_nullable}`));
  } catch(e){ console.log("ERR", e.message); }
  process.exit(0);
})();
