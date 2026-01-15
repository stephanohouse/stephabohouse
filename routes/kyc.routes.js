const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const can = require("../middleware/permission.middleware");
const { upload } = require("../middleware/upload.middleware");
const controller = require("../controllers/kyc.controller");

// User routes
router.post(
  "/submit",
  auth,
  upload.single("documentImage"),
  controller.submitKyc
);

router.get("/status", auth, controller.getKycStatus);

// Admin routes
router.post(
  "/approve/:userId",
  auth,
  can("approve_kyc"),
  controller.approveKyc
);

// Add this route to your routes
router.get("/all", auth, controller.getAllKyc);

module.exports = router;
