const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const { User } = require("../models");
const { notifyByEvent } = require("../utils/telegram.service"); // ✅ ADD THIS
const { uploadToCloudinary } = require("../middleware/upload.middleware");


// =========================
// REGISTER
// =========================
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      isActive: false, // admin approval
    });

    // 🔔 TELEGRAM NOTIFICATION (NEW USER REGISTERED)
    await notifyByEvent(
      "NEW_USER_REGISTERED",
      `👤 *New User Registration*\n` +
      `Name: ${fullName}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone || "N/A"}\n` +
      `Status: Pending approval`
    );

    return res.status(201).json({
      message: "Registration successful. Await admin approval.",
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// LOGIN
// =========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account not approved" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
    });

    return res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// GET CURRENT USER
// =========================
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: [
        "id",
        "fullName",
        "email",
        "phone",
        "profileImage",
        "isActive",
        "isKycCompleted",
        "isKycApproved",
        "createdAt",
      ],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("ME ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// =========================
// UPLOAD PROFILE IMAGE
// =========================
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const uploaded = await uploadToCloudinary(req.file);

    await User.update(
      { profileImage: uploaded.secure_url },
      { where: { id: req.user.id } }
    );

    return res.json({
      message: "Profile image uploaded successfully",
      profileImage: uploaded.secure_url,
    });
  } catch (error) {
    console.error("PROFILE IMAGE UPLOAD ERROR:", error);
    return res.status(500).json({ message: "Failed to upload profile image" });
  }
};

