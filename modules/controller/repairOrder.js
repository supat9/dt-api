const express = require("express");
const dbCon = require("../dbMiddleWare");
const router = express.Router();
const BASE_URL = "/repairOrder";

// Get all repair orders (ใช้ GET)
router.post(BASE_URL + "/getRepairOrders", async (req, res) => {
  try {
    const result = await dbCon.queryWithValue("SELECT * FROM repair_order");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Get all services
router.post(BASE_URL + "/getServices", async (req, res) => {
  try {
    const result = await dbCon.query(
      "SELECT service_id, service_type FROM service"
    ); // ✅ เพิ่ม service_type
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching services", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Add payment
router.post(BASE_URL + "/addPayment", async (req, res) => {
    try {
      const { amount, success } = req.body;
  
      if (!amount || success === undefined) {
        return res.status(400).json({ error: "Missing amount or success status" });
      }
  
      const paymentStatus = success ? "success" : "failed";
  
      const query = `
        INSERT INTO payment (payment_date, amount, payment_status)
        VALUES (NOW(), $1, $2)
        RETURNING *`;
  
      const result = await dbCon.queryWithValue(query, [amount, paymentStatus]);
  
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error("Database Error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
// Get repair order by ID
router.post(BASE_URL + "/getRepairOrderById", async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    const query = "SELECT * FROM repair_order WHERE order_id = $1";
    const result = await dbCon.queryWithValue(query, [order_id]);

    res.json(result.rows[0] || {});
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Add repair order
router.post(BASE_URL + "/addRepairOrder", async (req, res) => {
  try {
    const { cost, bill_desc, service_id } = req.body;
    if (!cost || !bill_desc || !service_id)
      return res.status(400).json({ error: "Missing fields" });

    const query = `
      INSERT INTO repair_order (cost, bill_desc, service_id)
      VALUES ($1, $2, $3)
      RETURNING *`;

    const result = await dbCon.queryWithValue(query, [
      cost,
      bill_desc,
      service_id,
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update repair order
router.post(BASE_URL + "/updateRepairOrder", async (req, res) => {
  try {
    const { order_id, cost, bill_desc, service_id } = req.body;
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    const query = `
      UPDATE repair_order
      SET cost = $1, bill_desc = $2, service_id = $3
      WHERE order_id = $4
      RETURNING *`;

    const result = await dbCon.queryWithValue(query, [
      cost,
      bill_desc,
      service_id,
      order_id,
    ]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete repair order
router.post(BASE_URL + "/deleteRepairOrder", async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: "Missing order_id" });

    const query = "DELETE FROM repair_order WHERE order_id = $1 RETURNING *";
    const result = await dbCon.queryWithValue(query, [order_id]);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
