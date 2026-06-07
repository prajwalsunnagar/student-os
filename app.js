const express = require("express");
require("dotenv").config();

const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");
const errorMiddleware =
    require("./middleware/errorMiddleware");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("StudentOS API is running");
});

app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);

app.use(errorMiddleware);
module.exports = app;