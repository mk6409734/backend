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

const storage = new Storage({ keyFilename });
const bucketName = "capture-bucket1";

const uploadsDir = path.join(__dirname, "temp");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadFile = async (filePath, destination) => {
  try {
    console.log("Uploading file:", filePath, "to bucket:", bucketName);
    await storage.bucket(bucketName).upload(filePath, {
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

app.use(cors({ origin: "*" }));
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

app.post("/api/capture", async (req, res) => {
  const { image } = req.body;
  const tempDir = path.join(__dirname, "temp");
  const tempFilePath = path.join(tempDir, `temp-image-${Date.now()}.png`);

  try {
    if (!fs.existsSync(tempDir)) {
      console.log("Temporary directory does not exist. Creating:", tempDir);
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    console.log("Temporary file created at:", tempFilePath);

    fs.writeFileSync(tempFilePath, base64Data, "base64");
    console.log("File written successfully:", tempFilePath);

    const fileName = `user-${Date.now()}.png`;
    const publicUrl = await uploadFile(tempFilePath, fileName);

    console.log("Public URL:", publicUrl);
    res.send({
      status: "success",
      message: "Data captured!",
      imageUrl: publicUrl,
    });
  } catch (error) {
    console.error("Error handling capture:", error);
    res.status(500).send({ status: "error", message: "Failed to capture data" });
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log("Temporary file deleted:", tempFilePath);
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
