const express = require("express");
const dbCon = require("../dbMiddleWare");
const router = express.Router();
const BASE_URL = "/vehicle";

router.post(BASE_URL + "/getVehicle", async (req, res) => {
  try {
    await dbCon.query("SELECT * FROM vehicle").then((data) => {
      res.json(data.rows);
    });
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post(BASE_URL + "/addVehicle", async (req, res) => {
  try {
    const query = `
            INSERT INTO vehicle (license_plate, brand, model, year, miles, user_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`;

    const params = [
      req.body.license_plate,
      req.body.brand,
      req.body.model,
      req.body.year,
      req.body.miles,
      req.body.user_id,
    ];

    const result = await dbCon.queryWithValue(query, params);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(BASE_URL + "/updateVehicle", async (req, res) => {
  try {
    if (req.body.vehicle_id && req.body.user_id) {
      const query = `UPDATE vehicle SET 
          license_plate = $1, 
          brand = $2, 
          model = $3, 
          year = $4, 
          miles = $5 
          WHERE vehicle_id = $6 AND user_id = $7`;

      const params = [
        req.body.license_plate,
        req.body.brand,
        req.body.model,
        req.body.year,
        req.body.miles,
        req.body.vehicle_id,
        req.body.user_id,
      ];

      await dbCon.queryWithValue(query, params);
      res.json({ success: true });
    } else {
      res
        .status(400)
        .json({ success: false, error: "Missing required fields" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post(BASE_URL + "/deleteVehicle", async (req, res) => {
  try {
    if (req.body.vehicle_id) {
      const query = `DELETE FROM vehicle WHERE vehicle_id = $1`;
      await dbCon.queryWithValue(query, [req.body.vehicle_id]);
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: "Missing vehicle_id" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
