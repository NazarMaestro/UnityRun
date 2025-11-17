import express from "express";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

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

// Регистрация
app.post("/register", async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    connection = await mysql.createConnection(dbConfig);
    const [existing] = await connection.execute("SELECT id FROM UsersUnity WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "Email already used" });

    const hash = await bcrypt.hash(password, 10);
    await connection.execute("INSERT INTO UsersUnity (email, password) VALUES (?, ?)", [email, hash]);

    res.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Логин
app.post("/login", async (req, res) => {
  let connection;
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });

    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM UsersUnity WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(400).json({ error: "Wrong email or password" });

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Wrong email or password" });

    res.json({ status: "ok", userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
});

// Запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
