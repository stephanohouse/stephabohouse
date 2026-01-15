const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// Store file in memory (buffer)
const storage = multer.memoryStorage();

// File filter for chat
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip",
    "application/x-rar-compressed",
    "text/plain",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Upload buffer to Cloudinary for chat
const uploadToCloudinary = async (file, userId) => {
  return new Promise((resolve, reject) => {
    const folder = `chat/${userId}`;
    
    // Determine resource type based on mime type
    let resourceType = "auto";
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
    } else if (file.mimetype === "application/pdf") {
      resourceType = "raw";
    } else if (file.mimetype.includes("document") || file.mimetype.includes("sheet")) {
      resourceType = "raw";
    } else if (file.mimetype.includes("text")) {
      resourceType = "raw";
    } else if (file.mimetype.includes("zip") || file.mimetype.includes("rar")) {
      resourceType = "raw";
    }

    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      // For images, you can add transformations
      ...(resourceType === "image" && {
        transformation: [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" }
        ]
      }),
      // Add user context for better organization
      context: {
        alt: file.originalname,
        caption: `Chat upload by user ${userId}`
      }
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(error);
        }
        resolve(result);
      })
      .end(file.buffer);
  });
};

// Alternative: Upload with error handling and retry
const uploadWithRetry = async (file, userId, maxRetries = 2) => {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await uploadToCloudinary(file, userId);
      return result;
    } catch (error) {
      console.error(`Upload attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries + 1) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

module.exports = {
  upload,
  uploadToCloudinary: uploadWithRetry,
};