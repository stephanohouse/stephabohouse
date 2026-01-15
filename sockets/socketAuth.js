const jwt = require("jsonwebtoken");
const { User } = require("../models");

module.exports = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user to socket
    socket.user = user;

    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
};
