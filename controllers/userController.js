const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateRefreshToken } =
    require("../utils/tokenUtils");
const validateRegister =
    require("../middleware/validateRegister");

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

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
    console.log(userResult.rows);
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

    const accessToken = jwt.sign(
    {
        userId: user.id,
        role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
);
    const refreshToken =
    generateRefreshToken();
    const tokenHash =
    await bcrypt.hash(refreshToken, 10);
    await db.query(
    `INSERT INTO refresh_tokens
     (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [
        user.id,
        tokenHash,
        new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        )
    ]
);
    res.json({
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
        id: user.id,
        name: user.name,
        email: user.email
    }
});
};
const refreshAccessToken = async (req, res) => {
    const { refreshToken } = req.body;

if (!refreshToken) {
    return res.status(400).json({
        message: "Refresh token required",
    });
}
const tokenResult = await db.query(
    `SELECT *
     FROM refresh_tokens
     WHERE expires_at > NOW()`
);
let matchedToken = null;
for (const row of tokenResult.rows) {
    const isMatch = await bcrypt.compare(
        refreshToken,
        row.token_hash
    );

    if (isMatch) {
        matchedToken = row;
        break;
    }
}
if (!matchedToken) {
    return res.status(401).json({
        message: "Invalid refresh token",
    });
}
const accessToken = jwt.sign(
    { userId: matchedToken.user_id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
);
res.json({
    accessToken,
});
};
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT id, name, email, role
             FROM users`
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Error fetching users",
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    getAllUsers,
};