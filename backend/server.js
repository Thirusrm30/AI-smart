const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const Report = require("./models/report");
const auth = require("./middleware/auth");
const { reportValidation } = require("./middleware/validation");
const handleValidationErrors = require("./middleware/validationHandler");
const { generalLimiter, authLimiter, uploadLimiter } = require("./middleware/rateLimiter");

const app = express();

// =============================================
// MIDDLEWARE
// =============================================

// CORS - Control which websites can access your API
// In development: allow all origins
// In production: restrict to your frontend domain only
const corsOptions = {
    origin: process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL   // Only allow your frontend in production
        : "*",                        // Allow all in development
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images as static files
// Access images at: http://localhost:5000/uploads/filename.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Apply general rate limiting to API routes
app.use("/api", generalLimiter);
app.use("/report", generalLimiter);
app.use("/reports", generalLimiter);

// Connect to MongoDB
connectDB();

// =============================================
// HELPER: Validate MongoDB ObjectId
// =============================================
// MongoDB IDs must be 24 hex characters (e.g., "69ab01ab91d22af94e6d0496")
// If someone sends "abc" or "123", it causes an ugly CastError
// This helper catches that early and sends a clean error message
const mongoose = require("mongoose");

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// =============================================
// ROUTES
// =============================================

// Auth Routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authLimiter, authRoutes);

// User Routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", authLimiter, userRoutes);

// Upload Routes (Image Upload + AI Classification)
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/upload", uploadLimiter, uploadRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({ message: "Smart Civic Backend Running" });
});

// =============================================
// REPORT API ROUTES
// =============================================

// POST /report - Create a new civic issue report (Protected)
app.post("/report", auth, reportValidation, handleValidationErrors, async (req, res) => {
    try {
        const { title, description, location, latitude, longitude, image } = req.body;

        const newReport = new Report({
            reportedBy: req.user.id,
            title: title.trim(),
            description: description.trim(),
            location: location ? location.trim() : undefined,
            latitude,
            longitude,
            image
        });

        const savedReport = await newReport.save();

        res.status(201).json({
            message: "Report created",
            data: savedReport
        });
    } catch (error) {
        console.error("POST /report error:", error.message);
        res.status(500).json({
            message: "Failed to create report"
        });
    }
});

// GET /reports - Return all reports from the database
app.get("/reports", async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });

        res.status(200).json({
            message: "Reports fetched successfully",
            data: reports
        });
    } catch (error) {
        console.error("GET /reports error:", error.message);
        res.status(500).json({
            message: "Failed to fetch reports"
        });
    }
});

// GET /reports/my - Return reports submitted by the logged-in user (Protected)
app.get("/reports/my", auth, async (req, res) => {
    try {
        const reports = await Report.find({ reportedBy: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            message: "My reports fetched successfully",
            data: reports
        });
    } catch (error) {
        console.error("GET /reports/my error:", error.message);
        res.status(500).json({
            message: "Failed to fetch your reports"
        });
    }
});

// GET /reports/:id - Return a single report by ID
app.get("/reports/:id", async (req, res) => {
    try {
        // Validate the ID format before querying
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid report ID format"
            });
        }

        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        res.status(200).json({
            message: "Report fetched successfully",
            data: report
        });
    } catch (error) {
        console.error("GET /reports/:id error:", error.message);
        res.status(500).json({
            message: "Failed to fetch report"
        });
    }
});

// PUT /reports/:id - Update a report (full update by authorities) (Protected)
app.put("/reports/:id", auth, async (req, res) => {
    try {
        // Validate the ID format
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid report ID format"
            });
        }

        // Only allow specific fields to be updated
        // This prevents attackers from overwriting _id, createdAt, etc.
        const allowedFields = ["title", "description", "location", "latitude", "longitude", "image", "status", "aiPrediction"];
        const updateData = {};

        for (const key of allowedFields) {
            if (req.body[key] !== undefined) {
                updateData[key] = req.body[key];
            }
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        res.status(200).json({
            message: "Report updated successfully",
            data: report
        });
    } catch (error) {
        console.error("PUT /reports/:id error:", error.message);
        res.status(500).json({
            message: "Failed to update report"
        });
    }
});

// PATCH /reports/:id/status - Update report status (Protected)
app.patch("/reports/:id/status", auth, async (req, res) => {
    try {
        // Validate the ID format
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid report ID format"
            });
        }

        const { status } = req.body;

        // Validate status value
        const validStatuses = ["Pending", "In Progress", "Resolved"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const report = await Report.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        res.status(200).json({
            message: "Report status updated successfully",
            data: report
        });
    } catch (error) {
        console.error("PATCH /reports/:id/status error:", error.message);
        res.status(500).json({
            message: "Failed to update report status"
        });
    }
});

// DELETE /reports/:id - Delete a report (Protected)
app.delete("/reports/:id", auth, async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid report ID format"
            });
        }

        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                message: "Report not found"
            });
        }

        // Only allow deletion if user is the author or an authority
        if (report.reportedBy && report.reportedBy.toString() !== req.user.id && req.user.role !== "authority") {
            return res.status(403).json({
                message: "You do not have permission to delete this report"
            });
        }
        
        await Report.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: "Report deleted successfully"
        });
    } catch (error) {
        console.error("DELETE /reports/:id error:", error.message);
        res.status(500).json({
            message: "Failed to delete report"
        });
    }
});

// =============================================
// AI MODEL LOADING (Step 15)
// =============================================
// Import the AI image classifier service
const { loadModel } = require("./services/imageClassifier");

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🚀 Server running on port ${PORT} at 0.0.0.0`);

    // Load the MobileNet AI model after the server starts
    // This runs in the background so the server starts immediately
    // The model takes ~10-30 seconds to download on first run
    console.log("");
    console.log("=".repeat(50));
    console.log("  LOADING AI MODEL (Step 15)");
    console.log("=".repeat(50));

    const modelLoaded = await loadModel();

    if (modelLoaded) {
        console.log("=".repeat(50));
        console.log("  ✅ AI is ready! Upload an image to classify it.");
        console.log("=".repeat(50));
    } else {
        console.log("=".repeat(50));
        console.log("  ⚠️ AI model failed to load.");
        console.log("  Image uploads will still work, but without AI labels.");
        console.log("=".repeat(50));
    }
});