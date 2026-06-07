const errorMiddleware = (
    error,
    req,
    res,
    next
) => {
    console.error(error);

    res.status(
        error.statusCode || 500
    ).json({
        message:
            error.message ||
            "Internal Server Error",
    });
};

module.exports = errorMiddleware;