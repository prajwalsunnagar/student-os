const express = require("express");

const router = express.Router();

const {
    registerUser,
    loginUser,
    refreshAccessToken,
    getAllUsers,
} = require("../controllers/userController");
const adminMiddleware =
    require("../middleware/adminMiddleware");
const authMiddleware =
    require("../middleware/authMiddleware");
const validateRegister =
    require("../middleware/validateRegister");

router.post("/register", validateRegister, registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshAccessToken);
router.get(
    "/all",
    authMiddleware,
    adminMiddleware,
    getAllUsers
);

module.exports = router;