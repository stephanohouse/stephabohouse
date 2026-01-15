const express = require("express");
const router = express.Router();
const apartmentController = require("../controllers/apartment.controller");
const auth = require("../middleware/auth.middleware");
const can = require("../middleware/permission.middleware");
const { upload } = require("../middleware/upload.middleware");

// Admin / Manager
router.post(
  "/",
  auth,
  can("post_apartment"),
  upload.array("images", 8),
  apartmentController.createApartment
);

router.put(
  "/:apartmentId",
  auth,
  can("update_apartment"),
  upload.array("images", 8), // Add this for update too
  apartmentController.updateApartment
);

router.delete(
  "/:apartmentId", 
  auth,
  can("delete_apartment"),
  apartmentController.deleteApartment
);

// Public
router.get("/", apartmentController.getApartments);
router.get("/availability/:apartmentId", apartmentController.checkAvailability);
router.post("/book/:apartmentId", auth, apartmentController.bookApartment);
router.post("/verify-payment", apartmentController.verifyApartmentPayment);

module.exports = router;