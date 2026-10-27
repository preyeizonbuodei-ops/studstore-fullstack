
const jwt = require("jsonwebtoken");
const User = require('../modules/registerSchema')
exports.ValidateToken = async (req, res, next) => {
    let token;
    const authHeader =
        req.cookies.authorization || req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer")) {
        token = authHeader.split(" ")[1];
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "No token was given, Authorization denied"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select(
            "_id role email isVerified isLoggedIn"
        );

        if (!user || !user.isVerified || !user.isLoggedIn) {
            return res.status(401).json({
                success: false,
                message: "Session is no longer active. Please log in again."
            });
        }

        req.user = {
            ...decoded,
            id: user._id.toString(),
            role: user.role,
            email: user.email,
            isVerified: user.isVerified
        };

        next();
    } catch (error) {
        console.error("TOKEN VALIDATION ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message:
                error.name === "TokenExpiredError"
                    ? "Access token expired"
                    : "Invalid or unauthorized access token"
        });
    }
};

