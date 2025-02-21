const express = require("express");
const dbCon = require("../dbMiddleWare");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const BASE_URL = "/auth";
const ACCESS_TOKEN_SECRET = "DlogTechToken";
const REFRESH_TOKEN_SECRET = "DlogTechRefreshToken";
const SALT_ROUNDS = 10;

let refreshTokens = [];

// ✅ สมัครสมาชิก (SignUp) พร้อมเข้ารหัสรหัสผ่าน
router.post(BASE_URL + "/signIn", async (req, res) => {
  try {
    const { username, password, name, address, contact, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Invalid Request" });
    }

    // ตรวจสอบว่ามี username นี้อยู่แล้วหรือไม่
    let checkUserQuery = `SELECT * FROM user_data WHERE username = '${username}'`;
    let existingUser = await dbCon.query(checkUserQuery);

    if (existingUser.rowCount > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // 🔐 เข้ารหัสรหัสผ่านก่อนบันทึกลงฐานข้อมูล
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let insertQuery = `
            INSERT INTO user_data (username, password, name, address, contact, email, permission) 
            VALUES ('${username}', '${hashedPassword}', '${name}', '${address}', '${contact}', '${email}', 'customer')`;

    let result = await dbCon.query(insertQuery);

    if (result.rowCount == 0) {
      return res.status(500).json({ message: "Failed to create user" });
    }

    return res.status(201).json({ message: "User Created Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ ล็อกอิน (Login) พร้อมตรวจสอบรหัสผ่านแบบเข้ารหัส
router.post(BASE_URL + "/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Invalid Request" });
    }

    let queryStr = `SELECT * FROM user_data WHERE username = '${username}'`;
    let data = await dbCon.query(queryStr);

    if (data.rowCount == 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    let userData = data.rows[0];

    // 🔐 ตรวจสอบรหัสผ่าน (เปรียบเทียบรหัสที่เข้ารหัสไว้)
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    delete userData.password;

    const accessToken = jwt.sign(
      { username, ...userData },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    // Create JWT refresh token
    const refreshToken = jwt.sign({ username }, REFRESH_TOKEN_SECRET, {
      expiresIn: "1h",
    });

    // Store the refresh token
    refreshTokens.push(refreshToken);

    res.json({
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ เปลี่ยนรหัสผ่าน (Update Password) พร้อมเข้ารหัสก่อนบันทึก
router.post(BASE_URL + "/updatePassword", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Invalid Request" });
    }

    let checkUserQuery = `SELECT * FROM user_data WHERE username = '${username}'`;
    let existingUser = await dbCon.query(checkUserQuery);

    if (existingUser.rowCount == 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔐 เข้ารหัสรหัสผ่านใหม่ก่อนอัปเดต
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    let updateQuery = `UPDATE user_data SET password = '${hashedPassword}' WHERE username = '${username}'`;
    let result = await dbCon.query(updateQuery);

    if (result.rowCount == 0) {
      return res.status(500).json({ message: "Failed to update password" });
    }

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
