const express = require("express");
require("dotenv").config();

const taskRoutes = require("./routes/taskRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("StudentOS API is running");
});

app.use("/tasks", taskRoutes);
app.use("/users", userRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});