const mongoose = require("mongoose");
require("dotenv").config({ path: "d:/Projects/Ongoing Projects/Team Sync/backend/.env" });
const User = require("d:/Projects/Ongoing Projects/Team Sync/backend/models/User");

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, { name: 1, email: 1, role: 1 });
    console.log("Existing Users:", JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUsers();
