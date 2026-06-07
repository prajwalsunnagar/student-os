const validateRegister = (
    req,
    res,
    next
) => {
    const {
        name,
        email,
        password
    } = req.body;

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

    next();
};

module.exports = validateRegister;