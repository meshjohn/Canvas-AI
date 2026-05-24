const { createClerkClient } = require("@clerk/backend");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function test() {
  console.log("CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "Present" : "Missing");
  
  const t0 = Date.now();
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const userList = await clerk.users.getUserList({ limit: 1 });
    console.log(`Clerk getUserList success in ${Date.now() - t0}ms:`, userList.data.length);
  } catch (err) {
    console.error(`Clerk failed in ${Date.now() - t0}ms:`, err.message);
  }
}

test();
