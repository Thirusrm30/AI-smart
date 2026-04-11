const { classifyImage } = require("../services/imageClassifier");
const Report = require("../models/report");

const uploadImage = async (req, res) => {
    try {
        let prediction = null;

        if (req.file) {
            try {
                prediction = await classifyImage(req.file.path);
                console.log(`📸 Image classified as: ${prediction.className}`);
            } catch (aiError) {
                console.error("⚠️ AI classification failed:", aiError.message);
                prediction = {
                    className: "unknown",
                    probability: 0,
                    allPredictions: []
                };
            }
        }

        const newReport = new Report({
            title: req.body.title || "Untitled Report",
            description: req.body.description || "Civic issue report",
            location: req.body.location || "",
            latitude: req.body.latitude ? parseFloat(req.body.latitude) : undefined,
            longitude: req.body.longitude ? parseFloat(req.body.longitude) : undefined,
            image: req.file ? req.file.filename : undefined,
            aiPrediction: prediction ? {
                className: prediction.className,
                probability: prediction.probability,
                allPredictions: prediction.allPredictions
            } : undefined
        });

        const savedReport = await newReport.save();
        console.log(`💾 Report saved with ID: ${savedReport._id}`);

        res.status(201).json({
            success: true,
            message: "Report created successfully",
            report: savedReport
        });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({
            message: "Failed to create report",
            error: error.message
        });
    }
};

module.exports = { uploadImage };
