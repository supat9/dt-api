const express = require("express");
const dbCon = require("../dbMiddleWare");
const router = express.Router();
const BASE_URL = "/service";

router.post(BASE_URL + "/getService", async (req, res) => {
  try {
    const result = await dbCon.query("SELECT * FROM service");
    res.json(result.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post(BASE_URL + "/addService", async (req, res) => {
  try {
    const {
      service_type,
      service_desc,
      service_status,
      service_time,
      service_date,
      vehicle_id,
    } = req.body;

    const query = `
      INSERT INTO service (service_type, service_desc, service_status, service_time, service_date, vehicle_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;

    const values = [
      service_type,
      service_desc,
      service_status,
      service_time,
      service_date,
      vehicle_id,
    ];

    const result = await dbCon.queryWithValue(query, values);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update service details
router.post(BASE_URL + "/updateServices", async (req, res) => {
  try {
    const {
      service_id,
      service_type,
      service_desc,
      service_status,
      service_time,
      service_date,
      vehicle_id,
    } = req.body;

    if (!service_id || !service_status || !vehicle_id) {
      return res
        .status(400)
        .json({ success: false, error: "ข้อมูลไม่ครบถ้วน" });
    }

    const query = `
      UPDATE service 
      SET service_type = $1, service_desc = $2, service_status = $3, service_time = $4, service_date = $5, vehicle_id = $6 
      WHERE service_id = $7 
      RETURNING *`;

    const values = [
      service_type,
      service_desc,
      service_status,
      service_time,
      service_date,
      vehicle_id, // Ensure vehicle_id is used in the update
      service_id,
    ];

    const result = await dbCon.queryWithValue(query, values);

    if (result.rowCount > 0) {
      res.json({ success: true, updated: result.rows[0] });
    } else {
      res.status(404).json({ success: false, error: "ไม่พบข้อมูล" });
    }
  } catch (err) {
    console.error("Error updating service:", err);
    res
      .status(500)
      .json({ success: false, error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

router.post(BASE_URL + "/updateService", async (req, res) => {
  try {
    const { service_id, service_status } = req.body;

    console.log("Received Data:", req.body); // Debug ข้อมูลที่ได้รับ

    if (!service_id || !service_status) {
      return res
        .status(400)
        .json({ success: false, error: "ข้อมูลไม่ครบถ้วน" });
    }

    const query = `UPDATE service SET service_status = $1 WHERE service_id = $2 RETURNING *`;
    const values = [service_status, service_id];

    const result = await dbCon.queryWithValue(query, values);

    if (result.rowCount > 0) {
      res.json({ success: true, updated: result.rows[0] });
    } else {
      res.status(404).json({ success: false, error: "ไม่พบข้อมูล" });
    }
  } catch (err) {
    console.error("Error updating service:", err);
    res
      .status(500)
      .json({ success: false, error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

router.post(BASE_URL + "/deleteService", async (req, res) => {
  try {
    const { service_id } = req.body;

    if (!service_id) {
      return res
        .status(400)
        .json({ success: false, error: "ข้อมูลไม่ครบถ้วน" });
    }

    const query = `DELETE FROM service WHERE service_id = $1`;
    const values = [service_id];

    const result = await dbCon.queryWithValue(query, values);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "ไม่พบข้อมูล" });
    } else {
      res.json({ success: true });
    }
  } catch (err) {
    console.error("Error deleting service:", err);
    res
      .status(500)
      .json({ success: false, error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
});

module.exports = router;
