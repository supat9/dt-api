const express = require("express");
const dbCon = require("../dbMiddleWare");
const router = express.Router();
const BASE_URL = "/appointment";

router.post(BASE_URL + "/getAppointment", async (req, res) => {
  try {
    var query = `
      SELECT 
        u.name AS fullname,
        v.license_plate AS "licensePlate",
        v.brand AS "brand",
        v.model AS "model",
        v.year AS "year",
        s.service_type AS "serviceType",
        s.service_desc AS "serviceDesc",
        s.service_date AS "appointmentDate",
        s.service_time AS "appointmentTime",
        s.service_status AS status
      FROM appointment a
      JOIN service s ON a.service_id = s.service_id
      JOIN vehicle v ON s.vehicle_id = v.vehicle_id
      JOIN user_data u ON v.user_id = u.user_id
      WHERE 1=1`;
      if(req.body.userId){
        query += ` AND u.user_id = '${req.body.userId}'`;
      }

    const data = await dbCon.query(query);
    res.json(data.rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post(BASE_URL + "/addAppointment", async (req, res) => {
  try {
    const query = `
        INSERT INTO appointment (appointment_date, service_id)
        VALUES ($1, $2)
        RETURNING *`;

    const params = [req.body.appointment_date, req.body.service_id];
    const result = await dbCon.queryWithValue(query, params);

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Database Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(BASE_URL + "/updateAppointment", async (req, res) => {
  try {
    if (req.body.appointment_date && req.body.appointment_id) {
      var strQuery = `UPDATE appointment SET appointment_date = '${req.body.appointment_date}', service_id = '${req.body.service_id}' WHERE appointment_id = '${req.body.appointment_id}'`;

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
    } else {
      errMsg = "Internal server error!!!";
    }
    res.status(500).json({ success: false, error: errMsg });
  }
});
router.post(BASE_URL + "/deleteAppointment", async (req, res) => {
  try {
    if (req.body.appointment_id) {
      var strQuery = `DELETE FROM appointment WHERE appointment_id = '${req.body.appointment_id}'`;

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
    } else {
      errMsg = "Internal server error!!!";
    }
    res.status(500).json({ success: false, error: errMsg });
  }
});

module.exports = router;
