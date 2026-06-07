const db = require("../config/db");

const getTasks = async (req, res,next) => {
    try {
        const userId = req.user.userId;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const completed = req.query.completed;
        const offset = (page - 1) * limit;
        const search = req.query.search;
      const result = await db.query(
    `SELECT *
     FROM tasks
     WHERE user_id = $1
     AND deleted = FALSE

     AND (
        $2::text IS NULL
        OR title ILIKE '%' || $2 || '%'
     )

     AND (
        $3::boolean IS NULL
        OR completed = $3
     )

     LIMIT $4
     OFFSET $5`,
    [
        userId,
        search || null,
        completed !== undefined ? completed === "true" : null,
        limit,
        offset
    ]
);
        res.json(result.rows);
    } catch (error) {
        next(error);
    }
};

const getTaskById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const userId = req.user.userId;

       const result = await db.query(
    `SELECT *
     FROM tasks
     WHERE id = $1
     AND user_id = $2
     AND deleted = FALSE`,
    [id, userId]
);
      if (result.rows.length === 0) {
    const error =
        new Error("Task not found");

    error.statusCode = 404;

    return next(error);
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
    const client = await db.connect();

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

        await client.query("BEGIN");

        const taskResult = await client.query(
            `INSERT INTO tasks
             (title, completed, user_id)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [title, taskCompleted, userId]
        );

        await client.query(
            `INSERT INTO audit_logs
             (user_id, task_id, action)
             VALUES ($1, $2, $3)`,
            [
                userId,
                taskResult.rows[0].id,
                "CREATE_TASK",
            ]
        );

        await client.query("COMMIT");

        res.status(201).json({
            message: "Task created successfully",
            task: taskResult.rows[0],
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(error);

        res.status(500).json({
            message: "Error creating task",
        });

    } finally {
        client.release();
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
             AND deleted = FALSE
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
    `UPDATE tasks
     SET deleted = TRUE
     WHERE id = $1
     AND user_id = $2
     AND deleted = FALSE
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