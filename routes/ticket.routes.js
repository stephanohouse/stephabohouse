const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticket.controller");
const auth = require("../middleware/auth.middleware");
const can = require("../middleware/permission.middleware");
const { upload } = require("../middleware/upload.middleware");
// Admin / Manager
router.post(
  "/events",
  auth,
  can("create_event"),
  upload.single("flyer"),
  ticketController.createEvent
);

router.post(
  "/events/:eventId/categories",
  auth,
  can("post_ticket"),
  ticketController.createTicketCategory
);

router.put("/events/:eventId", auth, can("update_event"), ticketController.updateEvent);
router.delete("/events/:eventId", auth, can("delete_event"), ticketController.deleteEvent);


// Paystack ticket purchase
router.post("/pay/:categoryId", ticketController.initializePayment);
router.post("/verify-payment", ticketController.verifyPayment);

// Ticket verification at venue
router.post(
  "/verify",
  auth,
  can("verify_ticket"),
  ticketController.verifyTicket
);

// Ticket PDF
router.get("/url/:serialCode", ticketController.getTicketUrl);

// Public - list events
router.get("/events", ticketController.getEvents);
// Public - event details + tickets
router.get("/events/:eventId", ticketController.getEventDetails);

router.get(
  "/events/:eventId/tickets",
  ticketController.getAvailableTickets
);

//get analytics
router.get(
  "/events/:eventId/analytics",
  auth,
  can("view_analytics"),
  ticketController.getEventAnalytics
);

// Daily & monthly sales for admins
router.get(
  "/events/:eventId/sales/daily",
  auth,
  can("view_analytics"),
  ticketController.getDailySales
);

router.get(
  "/events/:eventId/sales/monthly",
  auth,
  can("view_analytics"),
  ticketController.getMonthlySales
);

// Event ticket analytics (admin)
router.get(
  "/events/:eventId/totalanalytics",
  auth,
  can("view_analytics"),
  ticketController.getTotalTicketAnalytics
);

// Add this route - it should be protected with authentication
router.get(
  "/my-tickets",
  auth,
  ticketController.getUserTickets
);

module.exports = router;
