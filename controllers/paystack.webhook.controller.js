const crypto = require("crypto");
const {
  ApartmentBooking,
  RideBooking,
  TicketPurchase,
  TicketCategory,
} = require("../models");
const { notifyByEvent } = require("../utils/telegram.service");

exports.handlePaystackWebhook = async (req, res) => {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;

    if (event.event !== "charge.success") {
      return res.sendStatus(200);
    }

    const { reference, metadata } = event.data;

    /* ─────────────────────────────
       APARTMENT BOOKINGS
    ───────────────────────────── */
    if (reference.startsWith("APT-")) {
      const booking = await ApartmentBooking.findOne({
        where: { bookingReference: reference },
      });

      if (booking && !booking.isPaid) {
        booking.isPaid = true;
        await booking.save();

        await notifyByEvent(
          "NEW_APARTMENT_BOOKING",
          "🏠 *New apartment booking confirmed & paid*"
        );
      }
    }

    /* ─────────────────────────────
       RIDE BOOKINGS
    ───────────────────────────── */
    if (reference.startsWith("RIDE-")) {
      const booking = await RideBooking.findOne({
        where: { bookingReference: reference },
      });

      if (booking && !booking.isPaid) {
        booking.isPaid = true;
        await booking.save();

        await notifyByEvent(
          "NEW_RIDE_BOOKING",
          "🚗 *New ride booking confirmed & paid*"
        );
      }
    }

    /* ─────────────────────────────
       TICKET PURCHASES
    ───────────────────────────── */
    if (reference.startsWith("TCK-")) {
      const category = await TicketCategory.findByPk(metadata.categoryId);
      if (!category || category.quantity <= 0) {
        return res.sendStatus(200);
      }

      const ticket = await TicketPurchase.findOne({
        where: { paymentReference: reference },
      });

      if (!ticket) {
        await TicketPurchase.create({
          buyerName: metadata.buyerName,
          buyerEmail: metadata.buyerEmail,
          buyerPhone: metadata.buyerPhone,
          serialCode: require("../utils/generateSerial")(),
          TicketCategoryId: category.id,
          EventId: category.EventId,
          paymentReference: reference,
        });

        category.quantity -= 1;
        await category.save();

        await notifyByEvent(
          "NEW_TICKET_PURCHASE",
          `🎫 *New ticket purchase confirmed*\nCategory: ${category.name}`
        );
      }
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return res.sendStatus(500);
  }
};
