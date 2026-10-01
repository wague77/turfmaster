import postgres from "postgres";

const password = "T8Ufp3srKwqIasO9";
const hosts = [
  `postgres://postgres:${encodeURIComponent(password)}@db.daualabhqpwjyexbltgz.supabase.co:5432/postgres`,
  `postgres://postgres:${encodeURIComponent(password)}@db.daualabhqpwjyexbltgz.supabase.co:6543/postgres`,
  `postgres://postgres.daualabhqpwjyexbltgz:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  `postgres://postgres.daualabhqpwjyexbltgz:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
];

async function run() {
  for (const connStr of hosts) {
    console.log("Trying connection:", connStr.replace(password, "***"));
    try {
      const sql = postgres(connStr, { ssl: "require", connect_timeout: 5 });
      await sql`
        CREATE TABLE IF NOT EXISTS public.access_codes (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          code text NOT NULL UNIQUE,
          label text NOT NULL DEFAULT '',
          active boolean NOT NULL DEFAULT true,
          expires_at timestamptz,
          last_used_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now()
        );
      `;
      await sql`GRANT ALL ON public.access_codes TO service_role;`;
      await sql`ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;`;
      
      // Check if any default code exists, if not insert TURF2026
      const rows = await sql`SELECT * FROM public.access_codes LIMIT 5`;
      console.log("SUCCESS! Access codes table ready. Found rows:", rows.length);
      if (rows.length === 0) {
        await sql`INSERT INTO public.access_codes (code, label) VALUES ('TURF2026', 'Code demo par défaut')`;
        console.log("Inserted default access code: TURF2026");
      }
      await sql.end();
      process.exit(0);
    } catch (err) {
      console.error("Failed with this host:", err.message);
    }
  }
}

run();
