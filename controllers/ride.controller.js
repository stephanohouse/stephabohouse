const { Ride, RideBooking, RideImage } = require("../models");
const { v4: uuidv4 } = require("uuid");
const paystack = require("../config/paystack");
const { notifyByEvent } = require("../utils/telegram.service");
const { uploadToCloudinary } = require("../middleware/upload.middleware");


// CREATE RIDE (Admin)
exports.createRide = async (req, res) => {
  try {
    const { title, description, pricePerKm, pricePerDay, vehicleType, capacity } = req.body;

    const ride = await Ride.create({
      title,
      description,
      pricePerKm,
      pricePerDay,
      vehicleType,
      capacity,
    });

    // ✅ Handle uploaded images
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file))
      );

      const imageRecords = uploads.map((img) => ({
        url: img.secure_url,
        RideId: ride.id,
      }));

      await RideImage.bulkCreate(imageRecords);
    }

    res.status(201).json(ride);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL RIDES
exports.getRides = async (req, res) => {
  try {
    const rides = await Ride.findAll({ include: RideImage });
    res.json(rides);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// BOOK RIDE (Initialize Paystack)
exports.bookRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { pickupLocation, dropoffLocation, distanceKm } = req.body;
    const userId = req.user.id;

    const ride = await Ride.findByPk(rideId);
    if (!ride) return res.status(404).json({ message: "Ride not found" });

    const totalPrice = distanceKm * ride.pricePerKm;

    const reference = "RIDE-" + uuidv4().split("-")[0].toUpperCase();
    const response = await paystack.post("/transaction/initialize", {
      email: req.user.email,
      amount: totalPrice * 100,
      reference,
      metadata: { userId, rideId, pickupLocation, dropoffLocation, distanceKm },
      callback_url: `${process.env.FRONTEND_URL}/rides/callback`,
    });

    await RideBooking.create({
      pickupLocation,
      dropoffLocation,
      distanceKm,
      totalPrice,
      RideId: ride.id,
      UserId: userId,
      bookingReference: reference,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ message: "Ride booking initialization failed" });
  }
};

exports.verifyRidePayment = async (req, res) => {
  try {
    const { reference } = req.body;

    const { data } = await paystack.get(`/transaction/verify/${reference}`);
    if (data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const booking = await RideBooking.findOne({
      where: { bookingReference: reference },
    });

    if (!booking) {
      return res.status(404).json({ message: "Ride booking not found" });
    }

    booking.isPaid = true;
    await booking.save();

    await notifyByEvent(
      "NEW_RIDE_BOOKING",
      "🚗 *New ride booking confirmed & paid*"
    );

    res.json({ message: "Ride booking confirmed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// UPDATE RIDE
exports.updateRide = async (req, res) => {
  try {
    const { rideId } = req.params;
    const { title, description, pricePerKm, pricePerDay, vehicleType, capacity } = req.body;

    const ride = await Ride.findByPk(rideId, {
      include: RideImage,
    });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    await ride.update({
      title,
      description,
      pricePerKm,
      pricePerDay,
      vehicleType,
      capacity,
    });

    // Replace images if new ones uploaded
    if (req.files && req.files.length > 0) {
      await RideImage.destroy({ where: { RideId: ride.id } });

      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file))
      );

      const imageRecords = uploads.map((img) => ({
        url: img.secure_url,
        RideId: ride.id,
      }));

      await RideImage.bulkCreate(imageRecords);
    }

    res.json({ message: "Ride updated successfully", ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE RIDE
exports.deleteRide = async (req, res) => {
  try {
    const { rideId } = req.params;

    const ride = await Ride.findByPk(rideId);
    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    await ride.destroy();

    res.json({ message: "Ride deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


