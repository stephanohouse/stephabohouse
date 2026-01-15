const { User, UserKyc } = require("../models");
const { notifyByEvent } = require("../utils/telegram.service");
const { uploadToCloudinary } = require("../middleware/upload.middleware");

/**
 * SUBMIT KYC (USER)
 */
exports.submitKyc = async (req, res) => {
  try {
    const userId = req.user.id;
    const { documentType, documentNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Document image required" });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(req.file);

    await UserKyc.create({
      documentType,
      documentNumber,
      documentImage: uploadResult.secure_url,
      UserId: userId,
    });

    await User.update(
      {
        isKycCompleted: true,
        isKycApproved: false,
      },
      { where: { id: userId } }
    );

    // 🔔 Telegram notification
    await notifyByEvent(
      "NEW_KYC_SUBMISSION",
      "🛂 *New KYC submitted*\nAwaiting admin approval"
    );

    res.json({ message: "KYC submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "KYC submission failed" });
  }
};

/**
 * ADMIN APPROVE / REJECT KYC
 */
exports.approveKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const { approved } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isKycApproved = approved;
    await user.save();

    await notifyByEvent(
      "KYC_APPROVED",
      approved ? "✅ *KYC approved*" : "❌ *KYC rejected*"
    );

    res.json({ message: "KYC status updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update KYC" });
  }
};

/**
 * GET KYC STATUS (FRONTEND)
 */
exports.getKycStatus = async (req, res) => {
  const user = await User.findByPk(req.user.id);

  res.json({
    isKycCompleted: user.isKycCompleted,
    isKycApproved: user.isKycApproved,
  });
};

/**
 * GET ALL KYC DATA (ADMIN)
 */
exports.getAllKyc = async (req, res) => {
  try {
    const kycData = await UserKyc.findAll({
      include: [
        {
          model: User,
          attributes: [
            "id",
            "fullName",
            "email",
            "phone",
            "isKycCompleted",
            "isKycApproved",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json(kycData);
  } catch (error) {
    console.error("GET ALL KYC ERROR:", error);
    return res.status(500).json({ message: "Failed to fetch KYC data" });
  }
};
