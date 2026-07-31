import validator from "validator";
import ApiError from "../utils/ApiError.js";

const validateUrl = (longUrl) => {
    if (!longUrl) {
        throw new ApiError(400, "Long URL is required");
    }

    if (
        !validator.isURL(longUrl, {
            protocols: ["http", "https"],
            require_protocol: true,
        })
    ) {
        throw new ApiError(400, "Invalid URL");
    }
};

export default validateUrl;