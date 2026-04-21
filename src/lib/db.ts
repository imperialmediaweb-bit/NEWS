import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 10000,
});

export default pool;
