const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Only log unexpected server errors
    if (statusCode >= 500) {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" &&
            statusCode >= 500 && {
                stack: err.stack,
            }),
    });
};

export default errorHandler;