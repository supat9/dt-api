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
    console.log("Request body:", req.body);

    // Make sure order_id exists in the request body
    const order_id = req.body.order_id;
    if (!order_id) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const formData = new FormData();
    formData.append("files", req.file.buffer, req.file.originalname);

    try {
      // Send the slip to SLIPOK API for verification
      const response = await axios.post(API_URL, formData, {
        headers: {
          ...formData.getHeaders(),
          "x-authorization": API_KEY,
        },
      });

      // Extract payment data from response
      const slipData = response.data;
      console.log("SLIPOK Response:", slipData);

      try {
        // Insert payment data into the database
        const insertQuery = `
          INSERT INTO payment (
            payment_id, 
            amount, 
            payment_status, 
            payment_date, 
            order_id, 
            sender, 
            receiver, 
            status
          ) VALUES (
            DEFAULT, 
            $1, 
            'VERIFIED', 
            NOW(), 
            $2, 
            $3, 
            $4, 
            'COMPLETED'
          ) RETURNING *`;

        // Ensure we have all the parameters and handle null values appropriately
        const amount =
          slipData.data && slipData.data.amount ? slipData.data.amount : 0;
        const sender =
          slipData.data && slipData.data.sender
            ? slipData.data.sender.displayName
            : null;
        const receiver =
          slipData.data && slipData.data.receiver
            ? slipData.data.receiver.displayName
            : null;

        console.log("Database parameters:", [
          amount,
          order_id,
          sender,
          receiver,
        ]);

        const dbResult = await dbCon.queryWithValue(insertQuery, [
          amount,
          order_id,
          sender,
          receiver,
        ]);
        console.log("Database insert result:", dbResult.rows[0]);

        // Return the combined response
        res.json({
          ...response.data,
          dbResult: {
            success: true,
            payment: dbResult.rows[0],
          },
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Return the SLIPOK data even if there's a database error
        res.json({
          ...response.data,
          dbResult: {
            success: false,
            error: dbError.message,
          },
        });
      }
    } catch (error) {
      console.error(
        "SLIPOK API error:",
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
    let query = "SELECT order_id, cost, bill_desc FROM repair_order";
    let values = [];

    if (req.body.userId) {
      query += " WHERE user_id = $1";
      values.push(req.body.userId);
    }

    console.log("Query:", query, "Values:", values);
    const data = await dbCon.query(query, values);
    res.json(data.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post(BASE_URL + "/getPaymentByOrderId", async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, error: "Order ID is required" });
    }

    const query =
      "SELECT * FROM payment WHERE order_id = $1 ORDER BY payment_date DESC";
    const data = await dbCon.query(query, [order_id]);
    res.json({ success: true, payments: data.rows });
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post(BASE_URL + "/getAllPayments", async (req, res) => {
  try {
    const query = "SELECT * FROM payment ORDER BY payment_date DESC";
    const data = await dbCon.query(query);
    res.json({ success: true, payments: data.rows });
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
