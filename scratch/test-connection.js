const { Liveblocks } = require("@liveblocks/node");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

async function test() {
  console.log("LIVEBLOCKS_SECRET_KEY:", process.env.LIVEBLOCKS_SECRET_KEY ? "Present" : "Missing");
  
  const lb = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY,
  });

  const roomId = "test-room-id-123";

  console.log("\n--- Testing getOrCreateRoom ---");
  const t0 = Date.now();
  try {
    const room = await lb.getOrCreateRoom(roomId, { defaultAccesses: [] });
    console.log(`Success in ${Date.now() - t0}ms:`, room.id);
  } catch (err) {
    console.error(`Failed getOrCreateRoom in ${Date.now() - t0}ms:`, err.message);
  }

  console.log("\n--- Testing session.authorize ---");
  const t1 = Date.now();
  try {
    const session = lb.prepareSession("user-test-123", {
      userInfo: { name: "Test User", avatar: "", color: "#ff0000" },
    });
    session.allow(roomId, session.FULL_ACCESS);
    const { status, body } = await session.authorize();
    console.log(`Success authorize in ${Date.now() - t1}ms: status=${status}`);
  } catch (err) {
    console.error(`Failed authorize in ${Date.now() - t1}ms:`, err.message);
  }
}

test();
