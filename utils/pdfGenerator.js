const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

const generateTicketPDF = async (ticket) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Path to save locally
  const pdfPath = path.join(__dirname, "..", "upload", `${ticket.serialCode}.pdf`);
  doc.pipe(fs.createWriteStream(pdfPath));

  // Event Flyer (if exists)
  if (ticket.Event.flyerUrl) {
    try {
      doc.image(ticket.Event.flyerUrl, { fit: [500, 200], align: "center" });
      doc.moveDown();
    } catch (err) {
      console.warn("Failed to load flyer:", err);
    }
  }

  // Title
  doc.fontSize(25).text(ticket.Event.title, { align: "center" });
  doc.moveDown();

  // Ticket Info
  doc.fontSize(16).text(`Ticket Category: ${ticket.TicketCategory.name}`);
  doc.text(`Buyer: ${ticket.buyerName}`);
  doc.text(`Email: ${ticket.buyerEmail}`);
  doc.text(`Phone: ${ticket.buyerPhone}`);
  doc.text(`Serial Code: ${ticket.serialCode}`);
  doc.text(`Event Date: ${ticket.Event.eventDate}`);
  doc.text(`Location: ${ticket.Event.location}`);

  // Generate QR Code
  const qrData = await QRCode.toDataURL(ticket.serialCode);
  doc.image(qrData, { fit: [150, 150], align: "center", valign: "center" });

  doc.end();

  // Upload to Cloudinary
  const uploaded = await cloudinary.uploader.upload(pdfPath, {
    resource_type: "raw",
    folder: "tickets",
    public_id: ticket.serialCode,
  });

  return uploaded.secure_url; // return URL instead of local path
};

module.exports = generateTicketPDF;
