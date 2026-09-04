/**
 * APEX database seeder.
 *
 * Usage:
 *   node scripts/seed.js            # seed users + profiles + categories + demo project
 *   node scripts/seed.js --users-only
 *   node scripts/seed.js --categories-only
 *   node scripts/seed.js --projects-only
 *
 * All operations are idempotent. Passwords are hashed at runtime with bcrypt,
 * so no pre-computed hashes are committed to the repository.
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pool = require("../config/db");

const SCHEMA_DIR = path.join(__dirname, "..", "..", "database", "schema");
const CATEGORY_SQL = path.join(__dirname, "..", "..", "database", "seed", "seed_categories.sql");

const seedUsers = async () => {
  // Hash each password individually (bcrypt is slow but secure)
  const hashedPasswords = {
    default: await bcrypt.hash("password123", 10),
    student: await bcrypt.hash("Student@123", 10),
    visitor: await bcrypt.hash("Visitor@123", 10),
    manager: await bcrypt.hash("Manager@123", 10),
    admin: await bcrypt.hash("Admin@123", 10),
  };

  // Demo/sample users
  const demoUsers = [
    { full_name: "Admin User", email: "admin@apex.com", role: "admin", passwordHash: hashedPasswords.default },
    { full_name: "Manager User", email: "manager@apex.com", role: "manager", passwordHash: hashedPasswords.default },
    { full_name: "John Student", email: "john@student.com", role: "student", passwordHash: hashedPasswords.default },
    { full_name: "Jane Student", email: "jane@student.com", role: "student", passwordHash: hashedPasswords.default },
    { full_name: "Visitor User", email: "visitor@apex.com", role: "visitor", passwordHash: hashedPasswords.default },
  ];

  // Development test users (for easy testing)
  const testUsers = [
    { full_name: "Test Admin", email: "admin@test.com", role: "admin", passwordHash: hashedPasswords.admin },
    { full_name: "Test Manager", email: "manager@test.com", role: "manager", passwordHash: hashedPasswords.manager },
    { full_name: "Test Student", email: "student@test.com", role: "student", passwordHash: hashedPasswords.student },
    { full_name: "Test Visitor", email: "visitor@test.com", role: "visitor", passwordHash: hashedPasswords.visitor },
  ];

  const allUsers = [...demoUsers, ...testUsers];

  for (const user of allUsers) {
    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, TRUE)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             role = EXCLUDED.role,
             email_verified = TRUE`,
      [user.full_name, user.email, user.passwordHash, user.role]
    );
  }

  // Student profiles for demo students
  await pool.query(
    `INSERT INTO student_profiles (user_id, college, department, year_of_study)
     SELECT id, 'APEX College', 'Computer Science', '3rd Year'
     FROM users WHERE email = 'john@student.com'
     ON CONFLICT (user_id) DO UPDATE
       SET college = EXCLUDED.college, department = EXCLUDED.department, year_of_study = EXCLUDED.year_of_study`
  );

  await pool.query(
    `INSERT INTO student_profiles (user_id, college, department, year_of_study)
     SELECT id, 'APEX College', 'Information Technology', '4th Year'
     FROM users WHERE email = 'jane@student.com'
     ON CONFLICT (user_id) DO UPDATE
       SET college = EXCLUDED.college, department = EXCLUDED.department, year_of_study = EXCLUDED.year_of_study`
  );

  // Student profile for test student
  await pool.query(
    `INSERT INTO student_profiles (user_id, college, department, year_of_study)
     SELECT id, 'Test University', 'Computer Science', '2nd Year'
     FROM users WHERE email = 'student@test.com'
     ON CONFLICT (user_id) DO UPDATE
       SET college = EXCLUDED.college, department = EXCLUDED.department, year_of_study = EXCLUDED.year_of_study`
  );

  // Visitor profiles for demo visitor
  await pool.query(
    `INSERT INTO visitor_profiles (user_id, phone, organization, purpose)
     SELECT id, '9876543210', 'TechCorp', 'Research'
     FROM users WHERE email = 'visitor@apex.com'
     ON CONFLICT (user_id) DO UPDATE
       SET phone = EXCLUDED.phone, organization = EXCLUDED.organization, purpose = EXCLUDED.purpose`
  );

  // Visitor profile for test visitor
  await pool.query(
    `INSERT INTO visitor_profiles (user_id, phone, organization, purpose)
     SELECT id, '1234567890', 'Test Organization', 'Learning'
     FROM users WHERE email = 'visitor@test.com'
     ON CONFLICT (user_id) DO UPDATE
       SET phone = EXCLUDED.phone, organization = EXCLUDED.organization, purpose = EXCLUDED.purpose`
  );

  console.log("✓ Users seeded (demo users: password123, test users: role-specific passwords)");
  console.log("");
  console.log("  Development Test Accounts:");
  console.log("  ────────────────────────────");
  console.log("  🔑 Student:  student@test.com / Student@123");
  console.log("  🔑 Visitor:  visitor@test.com / Visitor@123");
  console.log("  🔑 Manager:  manager@test.com / Manager@123");
  console.log("  🔑 Admin:    admin@test.com   / Admin@123");
};

const seedCategories = async () => {
  const sql = fs.readFileSync(CATEGORY_SQL, "utf8");
  await pool.query(sql);
  console.log("✓ Categories seeded");
};

const seedDemoProject = async () => {
  const john = await pool.query(`SELECT id FROM users WHERE email = 'john@student.com'`);
  const jane = await pool.query(`SELECT id FROM users WHERE email = 'jane@student.com'`);
  if (john.rows.length === 0) {
    throw new Error("john@student.com not found. Run without --projects-only first.");
  }

  const existing = await pool.query(
    `SELECT id FROM projects WHERE project_id = 'APX-DEMO-000001'`
  );
  if (existing.rows.length > 0) {
    console.log("✓ Demo project already present, skipping");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO projects
       (project_id, title, slug, problem_statement, solution, description, abstract,
        technologies, tags, github_link, demo_link, status, created_by_user_id,
        reviewed_by_user_id, review_notes, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'approved', $12, $13, $14, NOW())
       RETURNING id`,
      [
        "APX-DEMO-000001",
        "Smart Irrigation System",
        "smart-irrigation-system",
        "Farmers in arid regions waste water through inefficient manual irrigation schedules.",
        "An IoT-driven irrigation controller that senses soil moisture and weather data, then automates water release to reduce consumption by up to 40%.",
        "End-to-end prototype with sensor hardware, a Node.js gateway, and a web dashboard for monitoring.",
        "Smart irrigation using IoT, soil moisture sensors, and predictive scheduling.",
        ["IoT", "Node.js", "React", "Machine Learning"],
        ["iot", "agriculture", "sustainability"],
        "https://github.com/apex-demo/smart-irrigation",
        "https://demo.apex.local/smart-irrigation",
        john.rows[0].id,
        null,
        "Approved as demonstration project.",
      ]
    );

    const projectId = result.rows[0].id;

    const aiCat = await client.query(`SELECT id FROM categories WHERE slug = 'ai'`);
    const iotCat = await client.query(`SELECT id FROM categories WHERE slug = 'iot'`);
    const agriCat = await client.query(`SELECT id FROM categories WHERE slug = 'agriculture'`);

    for (const [i, row] of [aiCat, iotCat, agriCat].entries()) {
      if (row.rows.length > 0) {
        await client.query(
          `INSERT INTO project_categories (project_id, category_id, is_primary)
           VALUES ($1, $2, $3)
           ON CONFLICT (project_id, category_id) DO NOTHING`,
          [projectId, row.rows[0].id, i === 0]
        );
      }
    }

    await client.query(
      `INSERT INTO project_members (project_id, user_id, member_role, is_primary)
       VALUES ($1, $2, 'owner', TRUE)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [projectId, john.rows[0].id]
    );

    if (jane.rows.length > 0) {
      await client.query(
        `INSERT INTO project_members (project_id, user_id, member_role, is_primary)
         VALUES ($1, $2, 'member', FALSE)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, jane.rows[0].id]
      );
    }

    await client.query("COMMIT");
    console.log("✓ Demo project seeded");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const applySchema = async () => {
  const files = fs
    .readdirSync(SCHEMA_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      return numA - numB;
    });

  for (const file of files) {
    const sql = fs.readFileSync(path.join(SCHEMA_DIR, file), "utf8");
    await pool.query(sql);
  }
  console.log(`✓ Schema applied (${files.length} files)`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const only = {
    users: args.includes("--users-only"),
    categories: args.includes("--categories-only"),
    projects: args.includes("--projects-only"),
  };

  const runSchema = !only.users && !only.categories && !only.projects;

  try {
    if (runSchema) await applySchema();
    if (!only.projects) await seedUsers();
    if (!only.users && !only.projects) await seedCategories();
    if (!only.users && !only.categories) await seedDemoProject();

    console.log("✓ Seed complete");
  } catch (error) {
    console.error("✗ Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

main();
