const express = require("express");
const { Client } = require("pg");

const app = express();

app.use(express.json());

const tasks = [
  {
    id: 1,
    title: "Learn Express",
    completed: false,
  },
];
const db = new Client({
  user: "postgres",
  host: "localhost",
  database: "student_os",
  password: "9972603062",
  port: 5432,
});

app.get("/", (req, res) => {
  res.send("StudentOS API is running");
});



app.get("/tasks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM tasks");

    res.json(result.rows);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error fetching tasks",
    });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const { title, completed } = req.body;

    const result = await db.query(
      "INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING *",
      [title, completed]
    );

    res.status(201).json({
      message: "Task added successfully",
      task: result.rows[0],
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error adding task",
    });
  }
});
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
db.connect()
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((err) => {
    console.log("Database connection error");
    console.log(err);
  });