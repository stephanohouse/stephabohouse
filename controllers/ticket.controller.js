const {
  Event,
  TicketCategory,
  TicketPurchase,
  User
} = require("../models");

const generateSerial = require("../utils/generateSerial");
const paystack = require("../config/paystack");
const { v4: uuidv4 } = require("uuid");
const generateTicketPDF = require("../utils/pdfGenerator");
const { notifyByEvent } = require("../utils/telegram.service");
const { uploadToCloudinary } = require("../middleware/upload.middleware");
const { Op, fn, col, literal } = require("sequelize");

/**
 * =========================
 * EVENT MANAGEMENT
 * =========================
 */

/**
 * CREATE EVENT
 */
exports.createEvent = async (req, res) => {
  try {
    let flyerUrl = null;

    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file, "event-flyers");
      flyerUrl = uploaded.secure_url;
    }

    // Map frontend fields to model fields
    const eventData = {
      title: req.body.name,           // Map 'name' to 'title'
      description: req.body.description,
      location: req.body.venue,       // Map 'venue' to 'location'
      eventDate: req.body.eventDate,
      flyerUrl: flyerUrl
    };

    const event = await Event.create(eventData);

    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE EVENT
 */
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let flyerUrl = event.flyerUrl;

    // Replace flyer if uploaded
    if (req.file) {
      const uploaded = await uploadToCloudinary(req.file, "event-flyers");
      flyerUrl = uploaded.secure_url;
    }

    // Map frontend fields to model fields
    await event.update({
      title: req.body.name ?? event.title,
      description: req.body.description ?? event.description,
      location: req.body.venue ?? event.location,
      eventDate: req.body.eventDate ?? event.eventDate,
      flyerUrl,
    });

    res.json({ message: "Event updated successfully", event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE EVENT
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    await event.destroy();

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET ALL EVENTS (PUBLIC)
 */
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      order: [["eventDate", "ASC"]],
    });

    // Map to frontend format
    const formattedEvents = events.map(event => ({
      id: event.id,
      name: event.title,
      description: event.description,
      venue: event.location,
      eventDate: event.eventDate,
      flyerUrl: event.flyerUrl,
      createdAt: event.createdAt
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET EVENT WITH TICKET CATEGORIES (PUBLIC)
 */
exports.getEventDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findByPk(eventId, {
      include: [
        {
          model: TicketCategory,
          attributes: ["id", "name", "price", "quantity"],
        },
      ],
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Return data in format frontend expects
    const formattedEvent = {
      id: event.id,
      name: event.title,           // Map 'title' to 'name'
      description: event.description,
      venue: event.location,       // Map 'location' to 'venue'
      eventDate: event.eventDate,
      flyerUrl: event.flyerUrl,
      createdAt: event.createdAt,
      TicketCategories: event.TicketCategories
    };

    res.json(formattedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * =========================
 * TICKET CATEGORY MANAGEMENT
 * =========================
 */

/**
 * CREATE TICKET CATEGORY
 */
exports.createTicketCategory = async (req, res) => {
  try {
    const { eventId } = req.params;

    const category = await TicketCategory.create({
      ...req.body,
      EventId: eventId,
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE TICKET CATEGORY
 */
exports.updateTicketCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await TicketCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Ticket category not found" });
    }

    await category.update(req.body);

    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE TICKET CATEGORY
 */
exports.deleteTicketCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await TicketCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Ticket category not found" });
    }

    // Check if any tickets have been purchased for this category
    const purchaseCount = await TicketPurchase.count({
      where: { TicketCategoryId: categoryId }
    });

    if (purchaseCount > 0) {
      return res.status(400).json({ 
        message: "Cannot delete category with existing ticket purchases" 
      });
    }

    await category.destroy();

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET AVAILABLE TICKETS FOR EVENT
 */
exports.getAvailableTickets = async (req, res) => {
  try {
    const { eventId } = req.params;

    const categories = await TicketCategory.findAll({
      where: {
        EventId: eventId,
        quantity: { [Op.gt]: 0 },
      },
    });

    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * =========================
 * PAYMENT PROCESSING
 * =========================
 */

/**
 * INIT PAYSTACK PAYMENT
 */
exports.initializePayment = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { buyerName, buyerEmail, buyerPhone } = req.body;

    const category = await TicketCategory.findByPk(categoryId);
    if (!category || category.quantity <= 0) {
      return res.status(400).json({ message: "Ticket sold out" });
    }

    const reference = "TCK-" + uuidv4().split("-")[0].toUpperCase();

    const response = await paystack.post("/transaction/initialize", {
      email: buyerEmail,
      amount: category.price,
      reference,
      metadata: {
        buyerName,
        buyerEmail,
        buyerPhone,
        categoryId,
        eventId: category.EventId,
      },
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ message: "Payment initialization failed" });
  }
};

/**
 * VERIFY PAYSTACK PAYMENT (SINGLE SOURCE OF TRUTH)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.body;

    const { data } = await paystack.get(`/transaction/verify/${reference}`);
    if (data.status !== "success") {
      return res.status(400).json({ message: "Payment not successful" });
    }

    const metadata = data.metadata;

    const category = await TicketCategory.findByPk(metadata.categoryId);
    if (!category) {
      return res.status(404).json({ message: "Ticket category not found" });
    }

    if (category.quantity <= 0) {
      return res.status(400).json({ message: "Ticket sold out" });
    }

    // Create ticket purchase record
    const purchase = await TicketPurchase.create({
      buyerName: metadata.buyerName,
      buyerEmail: metadata.buyerEmail,
      buyerPhone: metadata.buyerPhone,
      serialCode: generateSerial(),
      TicketCategoryId: category.id,
      EventId: category.EventId,
      paymentReference: reference,
    });

    // Reduce quantity
    category.quantity -= 1;
    await category.save();

    // Notify ticket purchase
    await notifyByEvent(
      "NEW_TICKET_PURCHASE",
      `🎫 *New ticket purchase confirmed*\n` +
      `Category: ${category.name}\n` +
      `Event: ${category.EventId}\n` +
      `Buyer: ${metadata.buyerName}\n` +
      `Email: ${metadata.buyerEmail}`
    );

    // Notify sold out
    if (category.quantity === 0) {
      await notifyByEvent(
        "TICKET_SOLD_OUT",
        `🚨 *Ticket Sold Out*\nCategory: ${category.name}`
      );
    }

    res.json({
      message: "Payment verified successfully",
      purchase,
    });
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

/**
 * =========================
 * TICKET VERIFICATION & MANAGEMENT
 * =========================
 */

/**
 * VERIFY TICKET AT EVENT
 */
exports.verifyTicket = async (req, res) => {
  try {
    const { serialCode } = req.body;

    const ticket = await TicketPurchase.findOne({
      where: { serialCode },
      include: [
        {
          model: TicketCategory,
          include: [Event]
        }
      ]
    });
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: "Invalid ticket code" 
      });
    }

    if (ticket.isUsed) {
      return res.status(400).json({ 
        success: false,
        message: "Ticket already used",
        ticketDetails: {
          buyerName: ticket.buyerName,
          usedAt: ticket.updatedAt,
          eventName: ticket.TicketCategory?.Event?.title
        }
      });
    }

    ticket.isUsed = true;
    await ticket.save();

    res.json({ 
      success: true,
      message: "Ticket verified successfully",
      ticketDetails: {
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        eventName: ticket.TicketCategory?.Event?.title,
        categoryName: ticket.TicketCategory?.name,
        verifiedAt: ticket.updatedAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false,
      message: "Server error during verification" 
    });
  }
};

/**
 * GENERATE / DOWNLOAD TICKET PDF
 */
exports.getTicketUrl = async (req, res) => {
  try {
    const { serialCode } = req.params;

    const ticket = await TicketPurchase.findOne({
      where: { serialCode },
      include: [TicketCategory, Event],
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const pdfUrl = await generateTicketPDF(ticket);

    res.json({ 
      message: "Ticket generated successfully", 
      url: pdfUrl 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate ticket PDF" });
  }
};

/**
 * GET ALL TICKETS FOR EVENT (ADMIN)
 */
exports.getEventTickets = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { page = 1, limit = 20, search = "" } = req.query;

    const offset = (page - 1) * limit;

    const whereClause = {
      EventId: eventId,
      ...(search && {
        [Op.or]: [
          { buyerName: { [Op.iLike]: `%${search}%` } },
          { buyerEmail: { [Op.iLike]: `%${search}%` } },
          { serialCode: { [Op.iLike]: `%${search}%` } },
        ]
      })
    };

    const { count, rows: tickets } = await TicketPurchase.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: TicketCategory,
          attributes: ["id", "name", "price"]
        }
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      tickets,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tickets" });
  }
};

/**
 * =========================
 * ANALYTICS & REPORTING
 * =========================
 */

/**
 * EVENT ANALYTICS (SUMMARY)
 */
exports.getEventAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Total tickets sold
    const totalSold = await TicketPurchase.count({
      where: { EventId: eventId },
    });

    // Total revenue
    const revenueResult = await TicketPurchase.findAll({
      where: { EventId: eventId },
      include: [{ model: TicketCategory, attributes: [] }],
      attributes: [
        [fn("SUM", col("TicketCategory.price")), "totalRevenue"],
      ],
      raw: true,
    });

    // Tickets per category
    const perCategory = await TicketPurchase.findAll({
      where: { EventId: eventId },
      include: [
        {
          model: TicketCategory,
          attributes: ["id", "name"],
        },
      ],
      attributes: [
        [col("TicketCategory.id"), "categoryId"],
        [col("TicketCategory.name"), "categoryName"],
        [fn("COUNT", col("TicketPurchase.id")), "sold"],
      ],
      group: [
        col("TicketCategory.id"),
        col("TicketCategory.name"),
      ],
      raw: true,
    });

    // Tickets used vs unused
    const usageStats = await TicketPurchase.findAll({
      where: { EventId: eventId },
      attributes: [
        "isUsed",
        [fn("COUNT", col("id")), "count"],
      ],
      group: ["isUsed"],
      raw: true,
    });

    res.json({
      totalSold,
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
      breakdown: perCategory,
      usageStats,
    });
  } catch (error) {
    console.error("Event analytics error:", error);
    res.status(500).json({ 
      message: "Analytics fetch failed",
      error: error.message 
    });
  }
};

/**
 * DAILY SALES (POSTGRES)
 */
exports.getDailySales = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { days = 30 } = req.query;

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    const dailySales = await TicketPurchase.findAll({
      where: { 
        EventId: eventId,
        createdAt: { [Op.gte]: daysAgo }
      },
      include: [{ model: TicketCategory, attributes: [] }],
      attributes: [
        [fn("DATE", col("TicketPurchase.createdAt")), "date"],
        [fn("COUNT", col("TicketPurchase.id")), "ticketsSold"],
        [fn("SUM", col("TicketCategory.price")), "revenue"],
      ],
      group: [fn("DATE", col("TicketPurchase.createdAt"))],
      order: [[fn("DATE", col("TicketPurchase.createdAt")), "ASC"]],
      raw: true,
    });

    res.json({ dailySales });
  } catch (error) {
    console.error("Daily sales error:", error);
    res.status(500).json({ 
      message: "Daily sales fetch failed",
      error: error.message 
    });
  }
};

/**
 * MONTHLY SALES (POSTGRES)
 */
exports.getMonthlySales = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { months = 12 } = req.query;

    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

    const monthlySales = await TicketPurchase.findAll({
      where: { 
        EventId: eventId,
        createdAt: { [Op.gte]: monthsAgo }
      },
      include: [{ model: TicketCategory, attributes: [] }],
      attributes: [
        [
          literal(`TO_CHAR("TicketPurchase"."createdAt", 'YYYY-MM')`),
          "month",
        ],
        [fn("COUNT", col("TicketPurchase.id")), "ticketsSold"],
        [fn("SUM", col("TicketCategory.price")), "revenue"],
      ],
      group: [
        literal(`TO_CHAR("TicketPurchase"."createdAt", 'YYYY-MM')`),
      ],
      order: [
        [literal(`TO_CHAR("TicketPurchase"."createdAt", 'YYYY-MM')`), "ASC"],
      ],
      raw: true,
    });

    res.json({ monthlySales });
  } catch (error) {
    console.error("Monthly sales error:", error);
    res.status(500).json({ 
      message: "Monthly sales fetch failed",
      error: error.message 
    });
  }
};

/**
 * TOTAL ANALYTICS (DASHBOARD)
 */
exports.getTotalTicketAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    // TOTAL STATS
    const totalResult = await TicketPurchase.findAll({
      where: { EventId: eventId },
      include: [{ model: TicketCategory, attributes: [] }],
      attributes: [
        [fn("COUNT", col("TicketPurchase.id")), "totalTicketsSold"],
        [fn("SUM", col("TicketCategory.price")), "totalRevenue"],
        [fn("AVG", col("TicketCategory.price")), "averageTicketPrice"],
      ],
      raw: true,
    });

    // LAST 30 DAYS
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySales = await TicketPurchase.findAll({
      where: {
        EventId: eventId,
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      include: [{ model: TicketCategory, attributes: [] }],
      attributes: [
        [fn("DATE", col("TicketPurchase.createdAt")), "date"],
        [fn("COUNT", col("TicketPurchase.id")), "ticketsSold"],
        [fn("SUM", col("TicketCategory.price")), "revenue"],
      ],
      group: [fn("DATE", col("TicketPurchase.createdAt"))],
      order: [[fn("DATE", col("TicketPurchase.createdAt")), "ASC"]],
      raw: true,
    });

    // LAST 12 MONTHS
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);

    const monthlySales = await TicketPurchase.findAll({
      where: {
        EventId: eventId,
        createdAt: { [Op.gte]: twelveMonthsAgo },
      },
      include: [{ model: TicketCategory, attributes: [] }],
      attributes: [
        [
          literal(`TO_CHAR("TicketPurchase"."createdAt", 'YYYY-MM')`),
          "month",
        ],
        [fn("COUNT", col("TicketPurchase.id")), "ticketsSold"],
        [fn("SUM", col("TicketCategory.price")), "revenue"],
      ],
      group: [
        literal(`TO_CHAR("TicketPurchase"."createdAt", 'YYYY-MM')`),
      ],
      order: [
        [literal(`TO_CHAR("TicketPurchase"."createdAt", 'YYYY-MM')`), "ASC"],
      ],
      raw: true,
    });

    // TOP PERFORMING CATEGORIES
    const topCategories = await TicketPurchase.findAll({
      where: { EventId: eventId },
      include: [
        {
          model: TicketCategory,
          attributes: ["name"],
        },
      ],
      attributes: [
        [col("TicketCategory.name"), "categoryName"],
        [fn("COUNT", col("TicketPurchase.id")), "ticketsSold"],
        [fn("SUM", col("TicketCategory.price")), "revenue"],
      ],
      group: [col("TicketCategory.name")],
      order: [[fn("SUM", col("TicketCategory.price")), "DESC"]],
      limit: 5,
      raw: true,
    });

    res.json({
      total: totalResult[0] || {
        totalTicketsSold: 0,
        totalRevenue: 0,
        averageTicketPrice: 0,
      },
      dailySales,
      monthlySales,
      topCategories,
    });
  } catch (error) {
    console.error("Total analytics error:", error);
    res.status(500).json({
      message: "Analytics fetch failed",
      error: error.message,
    });
  }
};

/**
 * EXPORT TICKET DATA (CSV)
 */
exports.exportTicketData = async (req, res) => {
  try {
    const { eventId } = req.params;

    const tickets = await TicketPurchase.findAll({
      where: { EventId: eventId },
      include: [
        {
          model: TicketCategory,
          attributes: ["name", "price"],
          include: [
            {
              model: Event,
              attributes: ["title", "location", "eventDate"]
            }
          ]
        }
      ],
      attributes: [
        "id", 
        "buyerName", 
        "buyerEmail", 
        "buyerPhone", 
        "serialCode", 
        "isUsed", 
        "createdAt",
        "updatedAt"
      ],
      order: [["createdAt", "DESC"]],
    });

    // Convert to CSV format
    const csvHeader = [
      "ID", "Buyer Name", "Email", "Phone", 
      "Serial Code", "Status", "Event", 
      "Category", "Price", "Purchase Date", "Used Date"
    ].join(',');

    const csvRows = tickets.map(ticket => [
      ticket.id,
      `"${ticket.buyerName}"`,
      `"${ticket.buyerEmail}"`,
      `"${ticket.buyerPhone || ''}"`,
      ticket.serialCode,
      ticket.isUsed ? 'Used' : 'Unused',
      `"${ticket.TicketCategory?.Event?.title || ''}"`,
      `"${ticket.TicketCategory?.name || ''}"`,
      ticket.TicketCategory?.price || 0,
      ticket.createdAt.toISOString(),
      ticket.isUsed ? ticket.updatedAt.toISOString() : ''
    ].join(','));

    const csvContent = [csvHeader, ...csvRows].join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=event-${eventId}-tickets-${Date.now()}.csv`);
    
    res.send(csvContent);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ 
      message: "Failed to export data",
      error: error.message 
    });
  }
};

/**
 * GET USER'S TICKETS (MY TICKETS)
 */
exports.getUserTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tickets = await TicketPurchase.findAll({
      where: {
        buyerEmail: user.email // Match tickets by user's email
      },
      include: [
        {
          model: TicketCategory,
          attributes: ["id", "name", "price"],
          include: [
            {
              model: Event,
              attributes: ["id", "title", "eventDate", "location", "flyerUrl"]
            }
          ]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    // Format tickets to match frontend expectations
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      eventName: ticket.TicketCategory?.Event?.title,
      categoryName: ticket.TicketCategory?.name,
      serialCode: ticket.serialCode,
      price: ticket.TicketCategory?.price,
      isUsed: ticket.isUsed,
      buyerName: ticket.buyerName,
      buyerEmail: ticket.buyerEmail,
      buyerPhone: ticket.buyerPhone,
      eventDate: ticket.TicketCategory?.Event?.eventDate,
      eventLocation: ticket.TicketCategory?.Event?.location,
      eventFlyerUrl: ticket.TicketCategory?.Event?.flyerUrl,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt
    }));

    res.json(formattedTickets);
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    res.status(500).json({ 
      message: "Failed to fetch user tickets",
      error: error.message 
    });
  }
};

module.exports = exports;