const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({
            message: "Name is required",
        });
    }

    if (!email || email.trim() === "") {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    if (!password || password.trim() === "") {
        return res.status(400).json({
            message: "Password is required",
        });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
        return res.status(400).json({
            message: "Email already exists",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email`,
        [name, normalizedEmail, hashedPassword]
    );

    res.status(201).json({
        message: "User registered successfully",
        user: result.rows[0],
    });
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || email.trim() === "") {
        return res.status(400).json({
            message: "Email is required",
        });
    }

    if (!password || password.trim() === "") {
        return res.status(400).json({
            message: "Password is required",
        });
    }

    const normalizedEmail = email.toLowerCase();

    const userResult = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [normalizedEmail]
    );

    if (userResult.rows.length === 0) {
        return res.status(400).json({
            message: "Invalid email or password",
        });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isMatch) {
        return res.status(400).json({
            message: "Invalid email or password",
        });
    }

    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );

    res.json({
        message: "Login successful",
        token,
    });
};

module.exports = {
    registerUser,
    loginUser,
};