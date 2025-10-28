import mysql from "mysql2/promise";

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: process.env.DB_CA ? { ca: process.env.DB_CA } : undefined,
};

export default async function handler(req, res) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    if (req.method === "POST") {
      const { name, score } = req.body;
      if (!name || score === undefined) {
        return res.status(400).json({ error: "Missing fields" });
      }
      await connection.execute(
        "INSERT INTO players (name, score) VALUES (?, ?)",
        [name, score]
      );
      return res.json({ status: "ok" });
    }

    if (req.method === "GET") {
      const [rows] = await connection.execute(
        "SELECT name, score FROM players ORDER BY score DESC LIMIT 10"
      );
      return res.json(rows);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.end();
  }
}
