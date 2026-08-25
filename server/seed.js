require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/user.model");

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("❌ MONGODB_URI is not defined in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // ============================
    // Admin Details
    // ============================
    const adminData = {
      name: "CosmeGlow Admin",
      email: "admin@cosmeglow.com", // Change this to create another admin
      password: "cosmeglow@123",    // Change this to update password
      phone: "+919999999999",
      role: "admin",
      isVerified: true,
    };

    // Check only by EMAIL
    let adminUser = await User.findOne({
      email: adminData.email,
    });

    if (adminUser) {
      console.log("🟢 Existing admin found. Updating...");

      adminUser.name = adminData.name;
      adminUser.phone = adminData.phone;
      adminUser.role = adminData.role;
      adminUser.isVerified = true;

      const salt = await bcrypt.genSalt(10);
      adminUser.password = await bcrypt.hash(adminData.password, salt);

      await adminUser.save();

      console.log("✅ Admin updated successfully.");
    } else {
      console.log("🟢 No admin found with this email.");
      console.log("Creating new admin...");

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);

      adminUser = await User.create({
        name: adminData.name,
        email: adminData.email,
        password: hashedPassword,
        phone: adminData.phone,
        role: adminData.role,
        isVerified: true,
      });

      console.log("✅ New admin created successfully.");
    }

    console.log("\n==============================");
    console.log("Admin Details");
    console.log("==============================");
    console.log("Name :", adminData.name);
    console.log("Email:", adminData.email);
    console.log("Password:", adminData.password);
    console.log("==============================\n");

    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:");
    console.error(error);

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

seedDatabase();