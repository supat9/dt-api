const express = require("express");
const dbCon = require("../dbMiddleWare");
const router = express.Router();
const BASE_URL = "/auth";
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = "DlogTechToken";
const REFRESH_TOKEN_SECRET = "DlogTechRefreshToken";

let refreshTokens = [];

router.post(BASE_URL + "/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!req.body.username || !req.body.password) {
      return res.status(400).json({ message: "Invalid Request" });
    }
    let queryStr = `SELECT * FROM user_data WHERE username = '${req.body.username}' AND password = '${req.body.password}'`;
    let data = await dbCon.query(queryStr);
    if (data.rowCount == 0) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    let userData = data.rows[0];
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

    let insertQuery = `
            INSERT INTO user_data (username, password, name, address, contact, email, permission) 
            VALUES ('${username}', '${password}', '${name}', '${address}', '${contact}', '${email}', 'customer')`;

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

    let updateQuery = `UPDATE user_data SET password = '${password}' WHERE username = '${username}'`;
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

router.post("/token", (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ message: "Token is required" });

  if (!refreshTokens.includes(token))
    return res.status(403).json({ message: "Invalid refresh token" });

  jwt.verify(token, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });

    const accessToken = jwt.sign(
      { username: user.username },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      accessToken,
    });
  });
});

router.post("/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = refreshTokens.filter((t) => t !== token);
  res.status(204).send();
});

module.exports = router;
