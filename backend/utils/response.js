/**
 * Standard Success Response helper
 */
export const successResponse = (res, message = "Success", data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data
    });
};

/**
 * Standard Error Response helper
 */
export const errorResponse = (res, message = "An error occurred", error = null, statusCode = 500) => {
    const response = {
        success: false,
        message
    };
    
    if (error) {
        response.error = error.message || error;
    }
    
    return res.status(statusCode).json(response);
};

export default {
    success: successResponse,
    error: errorResponse
};
