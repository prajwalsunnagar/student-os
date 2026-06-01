const db = require("../config/db");

const getTasks = async (req, res) => {
    try {
        const userId = req.user.userId;

        const result = await db.query(
            "SELECT * FROM tasks WHERE user_id = $1",
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error fetching tasks",
        });
    }
};

const getTaskById = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;

        const result = await db.query(
            "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error fetching task",
        });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, completed } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({
                message: "Title is required",
            });
        }

        const taskCompleted =
            completed === undefined ? false : completed;

        const userId = req.user.userId;

        const result = await db.query(
            `INSERT INTO tasks (title, completed, user_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [title, taskCompleted, userId]
        );

        res.status(201).json({
            message: "Task created successfully",
            task: result.rows[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error creating task",
        });
    }
};

const updateTask = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;

        const { title, completed } = req.body;

        if (!title || title.trim() === "") {
            return res.status(400).json({
                message: "Title is required",
            });
        }

        if (completed === undefined) {
            return res.status(400).json({
                message: "Completed status is required",
            });
        }

        const result = await db.query(
            `UPDATE tasks
             SET title = $1,
                 completed = $2
             WHERE id = $3
             AND user_id = $4
             RETURNING *`,
            [title, completed, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        res.json({
            message: "Task updated successfully",
            task: result.rows[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error updating task",
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;

        const result = await db.query(
            `DELETE FROM tasks
             WHERE id = $1
             AND user_id = $2
             RETURNING *`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Task not found",
            });
        }

        res.json({
            message: "Task deleted successfully",
            task: result.rows[0],
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error deleting task",
        });
    }
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
};