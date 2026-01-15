const { Apartment, ApartmentImage, ApartmentBooking, User } = require("../models");
const { v4: uuidv4 } = require("uuid");
const paystack = require("../config/paystack");
const { notifyByEvent } = require("../utils/telegram.service");
const { uploadToCloudinary } = require("../middleware/upload.middleware");

// CREATE APARTMENT
exports.createApartment = async (req, res) => {
  try {
    const { title, description, pricePerNight, location, quantity } = req.body;

    const apartment = await Apartment.create({
      title,
      description,
      pricePerNight,
      location,
      quantity,
    });

    // ✅ Upload images
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file))
      );

      const imageRecords = uploads.map((img) => ({
        url: img.secure_url,
        ApartmentId: apartment.id,
      }));

      await ApartmentImage.bulkCreate(imageRecords);
    }

    res.status(201).json(apartment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL APARTMENTS
exports.getApartments = async (req, res) => {
  try {
    const apartments = await Apartment.findAll({
      include: ApartmentImage,
    });
    res.json(apartments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// CHECK AVAILABILITY
exports.checkAvailability = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { startDate, endDate } = req.query;

    const bookings = await ApartmentBooking.findAll({
      where: { ApartmentId: apartmentId, isPaid: true },
    });

    const overlap = bookings.some(
      (b) => !(new Date(endDate) < new Date(b.startDate) || new Date(startDate) > new Date(b.endDate))
    );

    res.json({ available: !overlap });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// BOOK APARTMENT (Initialize Paystack)
exports.bookApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { startDate, endDate } = req.body;
    const userId = req.user.id;

    const apartment = await Apartment.findByPk(apartmentId);
    if (!apartment) return res.status(404).json({ message: "Apartment not found" });

    // Check availability
    const bookings = await ApartmentBooking.findAll({
      where: { ApartmentId: apartmentId, isPaid: true },
    });

    const overlap = bookings.some(
      (b) => !(new Date(endDate) < new Date(b.startDate) || new Date(startDate) > new Date(b.endDate))
    );

    if (overlap) return res.status(400).json({ message: "Apartment not available for selected dates" });

    const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
    const totalPrice = days * apartment.pricePerNight;

    // Paystack transaction
    const reference = "APT-" + uuidv4().split("-")[0].toUpperCase();
    const response = await paystack.post("/transaction/initialize", {
      email: req.user.email,
      amount: totalPrice * 100, // in kobo
      reference,
      metadata: { userId, apartmentId, startDate, endDate },
      callback_url: `${process.env.FRONTEND_URL}/apartments/callback`,
    });

    // Save provisional booking
    await ApartmentBooking.create({
      startDate,
      endDate,
      totalPrice,
      ApartmentId: apartment.id,
      UserId: userId,
      bookingReference: reference,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ message: "Booking initialization failed" });
  }
};

exports.verifyApartmentPayment = async (req, res) => {
  try {
    const { reference } = req.body;

    const { data } = await paystack.get(`/transaction/verify/${reference}`);
    if (data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const booking = await ApartmentBooking.findOne({
      where: { bookingReference: reference },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    booking.isPaid = true;
    await booking.save();

    await notifyByEvent(
      "NEW_APARTMENT_BOOKING",
      "🏠 *New apartment booking confirmed & paid*"
    );

    res.json({ message: "Apartment booking confirmed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};

// UPDATE APARTMENT
exports.updateApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const { title, description, pricePerNight, location, quantity } = req.body;

    const apartment = await Apartment.findByPk(apartmentId, {
      include: ApartmentImage,
    });

    if (!apartment) {
      return res.status(404).json({ message: "Apartment not found" });
    }

    // Update fields
    await apartment.update({
      title,
      description,
      pricePerNight,
      location,
      quantity,
    });

    // If new images are uploaded, replace old ones
    if (req.files && req.files.length > 0) {
      // Delete old images (DB only — Cloudinary optional)
      await ApartmentImage.destroy({
        where: { ApartmentId: apartment.id },
      });

      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file))
      );

      const imageRecords = uploads.map((img) => ({
        url: img.secure_url,
        ApartmentId: apartment.id,
      }));

      await ApartmentImage.bulkCreate(imageRecords);
    }

    res.json({ message: "Apartment updated successfully", apartment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE APARTMENT
exports.deleteApartment = async (req, res) => {
  try {
    const { apartmentId } = req.params;

    const apartment = await Apartment.findByPk(apartmentId);

    if (!apartment) {
      return res.status(404).json({ message: "Apartment not found" });
    }

    await apartment.destroy();

    res.json({ message: "Apartment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

