const express = require("express");
const dbCon = require("../dbMiddleWare");
const router = express.Router();
const BASE_URL = "/payment";

const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const API_URL = "https://api.slipok.com/api/line/apikey/39885";
const API_KEY = "SLIPOK5SRZVEA";

router.post(
  BASE_URL + "/uploadPayment",
  upload.single("files"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("Uploaded file:", req.file);

    const formData = new FormData();
    formData.append("files", req.file.buffer, req.file.originalname);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          ...formData.getHeaders(),
          "x-authorization": API_KEY,
        },
      });

      res.json(response.data);
    } catch (error) {
      console.error(
        "Upload error:",
        error.response ? error.response.data : error.message
      );
      res
        .status(500)
        .json({ message: "Internal Server Error", error: error.message });
    }
  }
);

router.post(BASE_URL + "/getRepairOrders", async (req, res) => {
  try {
    var query = "SELECT order_id,cost,bill_desc FROM repair_order where 1=1";
    if (req.body.userId) {
      query += ` AND u.user_id = '${req.body.userId}'`;
    }
    const data = await dbCon.query(query);
    res.json(data.rows)
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post(BASE_URL + "/getPayment", async (req, res) => {
  res.json({ message: "Payment API", apiUrl: API_URL });
});

module.exports = router;
