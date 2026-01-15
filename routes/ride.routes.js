const express = require("express");
const router = express.Router();
const rideController = require("../controllers/ride.controller");
const auth = require("../middleware/auth.middleware");
const can = require("../middleware/permission.middleware");
const { upload } = require("../middleware/upload.middleware");

// Admin
router.post(
  "/",
  auth,
  can("post_ride"),
  upload.array("images", 5), // ⬅️ ENABLE UPLOAD
  rideController.createRide
);

router.put("/:rideId", auth, can("put_ride"), upload.array("images", 5), rideController.updateRide);
router.delete("/:rideId", auth, can("delete_ride"), rideController.deleteRide);



// Public
router.get("/", rideController.getRides);
router.post("/book/:rideId", auth, rideController.bookRide);
router.post("/verify-payment", rideController.verifyRidePayment);


module.exports = router;
