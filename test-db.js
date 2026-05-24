import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import dotenv from "dotenv"

dotenv.config({ path: ".env" })

async function main() {
  const connectionString = process.env.DATABASE_URL
  console.log("Testing connection:", connectionString)
  
  const pool = new Pool({ connectionString })
  try {
    const res = await pool.query("SELECT NOW()")
    console.log("Success:", res.rows[0])
  } catch (e) {
    console.error("Error:", e)
  } finally {
    await pool.end()
  }
}

main()
