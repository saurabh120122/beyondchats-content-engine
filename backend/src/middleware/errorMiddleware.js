import { ApiError } from "../utils/ApiError.js";

const errorMiddleware = (err, req, res, next) => {
  // If error is an instance of our custom ApiError, use its status code
  // Otherwise default to 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors,
    // Only show stack trace in development mode for security
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

export { errorMiddleware };