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
    if (req.body.license_plate && req.body.vehicle_id) {
      var strQuery = `UPDATE vehicle SET license_plate = '${req.body.license_plate}', brand = '${req.body.brand}', model = '${req.body.model}', year = '${req.body.year}', miles = '${req.body.miles}' WHERE vehicle_id = '${req.body.vehicle_id}'`;

      await dbCon.query(strQuery).then(async (data) => {
        if (data.rowCount == 0) {
          res.status(500).json({ success: false, error: "Data not found!!!" });
        } else {
          res.send({ success: true });
        }
      });
    } else {
      res.status(500).json({ success: false, error: "Not have brandName key" });
    }
  } catch (err) {
    console.log("err ", err);
    let errMsg = "";
    if (err.detail?.indexOf("already exists") > -1) {
      errMsg = "Data already exists!!!";
    }
    res.status(500).json({ success: false, error: errMsg });
  }
});

router.post(BASE_URL + "/deleteVehicle", async (req, res) => {
  try {
    if (req.body.vehicle_id) {
      var strQuery = `DELETE FROM vehicle WHERE vehicle_id = '${req.body.vehicle_id}'`;

      await dbCon.query(strQuery).then(async (data) => {
        if (data.rowCount == 0) {
          res.status(500).json({ success: false, error: "Data not found!!!" });
        } else {
          res.send({ success: true });
        }
      });
    } else {
      res.status(500).json({ success: false, error: "Not have brandName key" });
    }
  } catch (err) {
    console.log("err ", err);
    let errMsg = "";
    if (err.detail?.indexOf("already exists") > -1) {
      errMsg = "Data already exists!!!";
    }
    res.status(500).json({ success: false, error: errMsg });
  }
});

module.exports = router;
