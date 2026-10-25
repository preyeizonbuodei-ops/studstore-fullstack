
const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./ConnectDB/ConnectDB");
const router = require("./authRouters/routes");
const adminRouter = require("./authRouters/adminRoutes");
const { default: mongoose } = require("mongoose");
const cookieparser = require("cookie-parser");


// Import rate limiters
const { GeneralRateLimiter } = require("./middlewares/RateLimit");

const app = express();
app.set('trust proxy', 1);


app.use(
    cors({
        origin: [
            "https://studstore.com.ng",
            "https://www.studstore.com.ng",
            "https://studstore-frontend-staging.onrender.com",
            "http://localhost:5173",
            "http://localhost:3000",
        ],
        credentials: true,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
        ],
    })
);

app.use(express.json());
app.use(cookieparser());

// Home route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to the Home Page",
    });

    console.log("welcome to the home page");
});

// User Routes with general rate limiting
app.use("/api/v1/users", GeneralRateLimiter, router);

// Admin Routes with general rate limiting
app.use("/api/v1/admin", GeneralRateLimiter, adminRouter);

connectDB();

// Start the server
const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
});
