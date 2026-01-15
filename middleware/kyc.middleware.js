// middleware/kyc.middleware.js
const { User } = require("../models");

module.exports = async (req, res, next) => {
  const user = await User.findByPk(req.user.id);

  if (!user.isKycCompleted) {
    return res.status(403).json({
      message: "Complete KYC before using this service",
    });
  }

  if (!user.isKycApproved) {
    return res.status(403).json({
      message: "KYC pending approval",
    });
  }

  next();
};
