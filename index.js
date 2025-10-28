import express from "express";
import mysql from "mysql2/promise";

const app = express();
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_CA ? { ca: process.env.DB_CA } : undefined,
};

app.post("/save-score", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const { name, score } = req.body;
    if (!name || score === undefined)
      return res.status(400).json({ error: "Missing fields" });
    await connection.execute(
      "INSERT INTO players (name, score) VALUES (?, ?)",
      [name, score]
    );
    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection?.end();
  }
});

app.get("/top", async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      "SELECT name, score FROM players ORDER BY score DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection?.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
