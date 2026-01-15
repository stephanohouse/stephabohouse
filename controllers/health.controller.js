/**
 * =========================
 * HEALTH CHECK
 * =========================
 * Used by UptimeRobot / Render
 */
exports.healthCheck = async (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: "stephabohouse-api",
  });
};
