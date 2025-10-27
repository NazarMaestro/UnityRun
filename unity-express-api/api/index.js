const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(cors());

// Подключение к базе MySQL через переменные окружения
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    ca: fs.readFileSync("ca/ca.pem") // сертификат остаётся в проекте
  }
});

db.connect(err => {
  if (err) console.error("❌ DB connection failed:", err.message);
  else console.log("✅ Connected to MySQL!");
});

// Добавить результат игрока
app.post("/save-score", (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined)
    return res.status(400).json({ error: "Missing fields" });

  db.query("INSERT INTO players (name, score) VALUES (?, ?)", [name, score], err => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ status: "ok" });
  });
});

// Получить топ игроков
app.get("/top", (req, res) => {
  db.query("SELECT name, score FROM players ORDER BY score DESC LIMIT 10", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = app; // ВАЖНО для Vercel
