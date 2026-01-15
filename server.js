const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const db = require("./models");
const seedRoles = require("./utils/seedRoles");
const seedPermissions = require("./utils/seedPermissions");
const seedRolePermissions = require("./utils/seedRolePermissions");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const ticketRoutes = require("./routes/ticket.routes");
const apartmentRoutes = require("./routes/apartment.routes");
const rideRoutes = require("./routes/ride.routes");

const app = express();

/* ──────────────────────
   VERY IMPORTANT 🔐
   PAYSTACK WEBHOOK (RAW BODY)
   MUST COME BEFORE express.json()
────────────────────── */
app.use(
  "/api/webhooks",
  require("./routes/paystack.webhook.routes")
);

/* ──────────────────────
   GLOBAL MIDDLEWARE
────────────────────── */
app.use(cors());
app.use(morgan("dev"));
app.use(express.json()); // ✅ SAFE HERE NOW

/* ──────────────────────
   SERVE CHAT UPLOADS ✅
────────────────────── */
app.use("/uploads", express.static("uploads"));

/* ──────────────────────
   HEALTH CHECK
────────────────────── */
app.get("/", (req, res) => {
  res.json({ message: "Stephano House API running 🚀" });
});

/* ──────────────────────
   ROUTES
────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/apartments", apartmentRoutes);
app.use("/api/rides", rideRoutes);

app.use("/api/telegram", require("./routes/telegram.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/telegram", require("./routes/telegram.webhook.routes"));
app.use("/api/chat", require("./routes/chat.upload.routes"));
app.use("/api/kyc", require("./routes/kyc.routes"));
app.use("/api/chatrooms", require("./routes/chatroom.routes"));
app.use("/api/roles", require("./routes/roles.routes"));
app.use("/api/blogs", require("./routes/blog.routes"));

/* ──────────────────────
   SOCKET.IO SETUP
────────────────────── */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const socketAuth = require("./sockets/socketAuth");
io.use(socketAuth);

// Make io accessible inside routes ✅
app.set("io", io);

// Register socket handlers
require("./sockets/chat.socket")(io);

/* ──────────────────────
   DATABASE + SERVER START
────────────────────── */
const PORT = process.env.PORT || 5000;

db.sequelize
  .authenticate()
  .then(async () => {
    console.log("✅ Database connected");

    await db.sequelize.sync({ alter: true });
    console.log("🗄️ Database synced");

    await seedRoles();
    console.log("✅ Roles seeded");

    await seedPermissions();
    await seedRolePermissions();
    console.log("✅ Permissions & role-permissions seeded");

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
  });
