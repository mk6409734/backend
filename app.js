const { Storage } = require('@google-cloud/storage');
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();



const keyFilename = path.resolve(__dirname, "./clientLibraryConfig-my-oidc-provider.json");
console.log("Using Key File:", keyFilename);

// Define your bucket name
const bucketName = "capture-bucket1"; // Replace with your actual bucket name

// Ensure uploads directory exists
const uploadFile = async (filePath, destination) => {
  try {
    console.log("Uploading file:", filePath, "to bucket:", bucketName);
    await Storage.bucket(bucketName).upload(filePath, {
      destination,
      public: true,
    });
    console.log(`${filePath} uploaded to ${bucketName}`);
    return `https://storage.googleapis.com/${bucketName}/${destination}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

const uploadsDir = path.join(__dirname, "downloads");
console.log("Uploads directory:", uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});


// API Route to handle image and location
app.get("/", (req, res) => {
    res.send("Backend is running successfully!");
});

app.post("/api/capture", async (req, res) => {
  const { image, location, deviceInfo, ipAddress } = req.body;

  try {
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      console.log("Temporary directory does not exist. Creating:", tempDir);
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const tempFilePath = path.join(tempDir, `temp-image-${Date.now()}.png`);
    console.log("Temporary file created at:", tempFilePath);

    fs.writeFileSync(tempFilePath, base64Data, "base64");
    console.log("File written successfully:", tempFilePath);

    const fileName = `user-${Date.now()}.png`;
    console.log("Uploading file to bucket:", bucketName);

    const publicUrl = await uploadFile(tempFilePath, fileName);

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath);

    console.log("Public URL:", publicUrl);
    res.send({
      status: "success",
      message: "Data captured!",
      imageUrl: publicUrl,
    });
  } catch (error) {
    console.error("Error handling capture:", error);
    res.status(500).send({ status: "error", message: "Failed to capture data" });
  }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


module.exports = uploadFile;
