
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

const { ValidateAdmin } = require("../middlewares/validateAdmin");
const Admin = require("../modules/adminSchema");
const SendMail = require("../middlewares/sendMail");
const { hmacProcess, DoHash } = require("../utils/hashing");

const isProduction = process.env.NODE_ENV === "production";

// AUTH COOKIE OPTIONS
const authCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge,
});

// COOKIE CLEARING OPTIONS
const clearAuthCookieOptions = () => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
});

// CLEAR BOTH ADMIN AUTH COOKIES
const clearAdminCookies = (res) => {
    res.clearCookie(
        "adminAuthorization",
        clearAuthCookieOptions()
    );

    res.clearCookie(
        "adminRefreshToken",
        clearAuthCookieOptions()
    );
};

// SAFE ADMIN RESPONSE
const getSafeAdmin = (admin) => ({
    id: admin._id.toString(),
    username: admin.username,
    email: admin.email,
    role: admin.role,
    isVerified: admin.isVerified,
    isLoggedIn: admin.isLoggedIn,
    lastLoggedIn: admin.lastLoggedIn
});

// VERIFY EMAIL DELIVERY


// CENTRAL ERROR HANDLER
const sendControllerError = (res, error, label) => {
    console.error(`${label}:`, error);

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "An admin account with this email already exists"
        });
    }

    return res.status(500).json({
        success: false,
        message: "An unexpected server error occurred"
    });
};

// VERIFICATION SECRET
const getVerificationSecret = () => {
    const secret = process.env.HMAC_VERIFICATION_CODE_SECRET;

    if (!secret) {
        throw new Error(
            "HMAC_VERIFICATION_CODE_SECRET is not configured"
        );
    }

    return secret;
};


// 1. REGISTER ADMIN
// POST /register

exports.AdminRegister = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            confirmPassword,
            adminKey
        } = req.body;

        const { error } = ValidateAdmin.validate({
            username,
            email,
            password,
            confirmPassword
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
            return res.status(403).json({
                success: false,
                message: "Invalid Admin Key"
            });
        }


        const normalizedEmail = email.trim().toLowerCase();

        const existingAdmin = await Admin.findOne({
            email: normalizedEmail
        });

        if (existingAdmin) {
            return res.status(409).json({
                success: false,
                message: "Email already exists. Try another email."
            });
        }

        const hashedPassword = await DoHash(password, 10);

        const verificationCode = crypto
            .randomInt(100000, 1000000)
            .toString();

        const verificationToken = hmacProcess(
            verificationCode,
            getVerificationSecret()
        );

        const verificationTokenExpiresAt =
            Date.now() + 24 * 60 * 60 * 1000;

        const newAdmin = new Admin({
            username: username.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: "Admin",
            isLoggedIn: false,
            isVerified: false,
            verificationToken,
            verificationTokenExpiresAt
        });

        await SendMail({
            from: process.env.EMAIL_FROM,
            to: normalizedEmail,
            subject: "StudStore Admin Email Verification",
            text: `Your StudStore admin verification code is: ${verificationCode}. It expires in 24 hours.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px;">
                    <h2>Verify your StudStore admin account</h2>
                    <p>Use the verification code below:</p>
                    <h1 style="letter-spacing: 6px;">${verificationCode}</h1>
                    <p>This code expires in 24 hours.</p>
                    <p>If you did not request this account, ignore this email.</p>
                </div>
            `
        });


        await newAdmin.save();

        return res.status(201).json({
            success: true,
            admin: getSafeAdmin(newAdmin),
            message: "Registration successful. Check your email for the verification code."
        });
    } catch (error) {
        return sendControllerError(
            res,
            error,
            "ADMIN REGISTRATION ERROR"
        );
    }
};


// 2. VERIFY ADMIN EMAIL AND SEND PASSKEY
// PATCH /admin-verify-email

exports.adminVerifyVerificationCode = async (req, res) => {
    try {
        const { email, sentCode } = req.body;

        if (!email || !sentCode) {
            return res.status(400).json({
                success: false,
                message: "Email and verification code are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingAdmin = await Admin.findOne({
            email: normalizedEmail
        }).select("+verificationToken +verificationTokenExpiresAt +key");

        if (!existingAdmin) {
            return res.status(404).json({
                success: false,
                message: "No admin account found"
            });
        }

        if (existingAdmin.isVerified) {
            return res.status(409).json({
                success: false,
                message: "This account has already been verified"
            });
        }

        if (
            !existingAdmin.verificationTokenExpiresAt ||
            Date.now() > new Date(
                existingAdmin.verificationTokenExpiresAt
            ).getTime()
        ) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired. Please register again or request a new code."
            });
        }

        const hashedCodeValue = hmacProcess(
            String(sentCode).trim(),
            getVerificationSecret()
        );

        if (hashedCodeValue !== existingAdmin.verificationToken) {
            return res.status(400).json({
                success: false,
                message: "Incorrect verification code"
            });
        }

        const adminPasskey = crypto.randomBytes(12).toString("hex");

        await SendMail({
            from: process.env.EMAIL_FROM,
            to: normalizedEmail,
            subject: "StudStore Admin Passkey",
            text: `Your admin passkey is: ${adminPasskey}. Keep it secure and never share it.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px;">
                    <h2>Your StudStore Admin Passkey</h2>
                    <p>Keep this key secure and never share it with anyone.</p>
                    <div style="padding: 16px; background: #f1f5f9; font-size: 20px; font-weight: bold; word-break: break-all;">
                        ${adminPasskey}
                    </div>
                    <p>You will need this passkey when logging in as an administrator.</p>
                </div>
            `
        });

    
        existingAdmin.key = hmacProcess(
            adminPasskey,
            getVerificationSecret()
        );

        existingAdmin.isVerified = true;
        existingAdmin.verificationToken = undefined;
        existingAdmin.verificationTokenExpiresAt = undefined;

        await existingAdmin.save();

        return res.status(200).json({
            success: true,
            admin: getSafeAdmin(existingAdmin),
            message: "Email verified successfully. Your admin passkey has been sent to your email."
        });
    } catch (error) {
        return sendControllerError(
            res,
            error,
            "ADMIN EMAIL VERIFICATION ERROR"
        );
    }
};


// 3. ADMIN LOGIN
// POST /login

exports.AdminLogIn = async (req, res) => {
    try {
        const { email, password, adminKey } = req.body;

        if (!email || !password || !adminKey) {
            return res.status(400).json({
                success: false,
                message: "Email, password and admin passkey are required"
            });
        }

        const existingAdmin = await Admin.findOne({
            email: email.trim().toLowerCase()
        }).select("+password +key");

        if (!existingAdmin) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!existingAdmin.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your account first"
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            existingAdmin.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (!existingAdmin.key) {
            return res.status(403).json({
                success: false,
                message: "Admin passkey has not been configured"
            });
        }

        const hashedPasskey = hmacProcess(
            String(adminKey).trim(),
            getVerificationSecret()
        );

        if (hashedPasskey !== existingAdmin.key) {
            return res.status(401).json({
                success: false,
                message: "Incorrect Admin Passkey"
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not configured");
        }

        const payload = {
            id: existingAdmin._id.toString(),
            email: existingAdmin.email,
            role: existingAdmin.role
        };

        const adminToken = jwt.sign(
            {
                ...payload,
                tokenType: "admin-access"
            },
            process.env.JWT_SECRET,
            { expiresIn: "4h" }
        );

        const refreshSecret =
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

        const adminRefreshToken = jwt.sign(
            {
                ...payload,
                tokenType: "admin-refresh"
            },
            refreshSecret,
            { expiresIn: "4d" }
        );

        res.cookie(
            "adminAuthorization",
            `Bearer ${adminToken}`,
            authCookieOptions(4 * 60 * 60 * 1000)
        );

        res.cookie(
            "adminRefreshToken",
            adminRefreshToken,
            authCookieOptions(4 * 24 * 60 * 60 * 1000)
        );

        existingAdmin.isLoggedIn = true;
        existingAdmin.lastLoggedIn = new Date();

        await existingAdmin.save();

        return res.status(200).json({
            success: true,
            admin: getSafeAdmin(existingAdmin),
            message: "Logged in successfully"
        });
    } catch (error) {
        return sendControllerError(
            res,
            error,
            "ADMIN LOGIN ERROR"
        );
    }
};


// 4. ADMIN LOGOUT
// POST /logout
// Requires admin authentication middleware

exports.AdminLogOut = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.admin?._id;

        if (!adminId) {
            clearAdminCookies(res);

            return res.status(401).json({
                success: false,
                message: "Admin authentication is required"
            });
        }

        const existingAdmin = await Admin.findById(adminId);

        if (existingAdmin) {
            existingAdmin.isLoggedIn = false;
            await existingAdmin.save();
        }

        clearAdminCookies(res);

        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("ADMIN LOGOUT ERROR:", error);

        clearAdminCookies(res);

        return res.status(500).json({
            success: false,
            message: "An error occurred during admin logout"
        });
    }
};


// 5. REFRESH ADMIN ACCESS TOKEN
// POST /admin-refresh-token
// Must NOT require the access-token middleware

exports.GetAdminRefreshToken = async (req, res) => {
    try {
        const { adminRefreshToken } = req.cookies || {};

        if (!adminRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "No admin refresh token found"
            });
        }

        const refreshSecret =
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

        if (!refreshSecret || !process.env.JWT_SECRET) {
            throw new Error("JWT secrets are not configured");
        }

        const decodedAdmin = jwt.verify(
            adminRefreshToken,
            refreshSecret
        );

        if (
            decodedAdmin.tokenType !== "admin-refresh" ||
            !decodedAdmin.id
        ) {
            clearAdminCookies(res);

            return res.status(401).json({
                success: false,
                message: "Invalid admin refresh token"
            });
        }

        const existingAdmin = await Admin.findById(decodedAdmin.id);

        if (!existingAdmin || !existingAdmin.isVerified) {
            clearAdminCookies(res);

            return res.status(401).json({
                success: false,
                message: "Admin account is unavailable or unverified"
            });
        }

        const newAccessToken = jwt.sign(
            {
                id: existingAdmin._id.toString(),
                email: existingAdmin.email,
                role: existingAdmin.role,
                tokenType: "admin-access"
            },
            process.env.JWT_SECRET,
            { expiresIn: "4h" }
        );

        res.cookie(
            "adminAuthorization",
            `Bearer ${newAccessToken}`,
            authCookieOptions(4 * 60 * 60 * 1000)
        );

        return res.status(200).json({
            success: true,
            message: "Admin access token refreshed successfully"
        });
    } catch (error) {
        console.error("ADMIN REFRESH ERROR:", error);

        clearAdminCookies(res);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin refresh token"
        });
    }
};


// 6. CHECK ADMIN AUTHENTICATION
// GET /admin-check-auth
// Requires admin authentication middleware

exports.AdminCheckAuth = async (req, res) => {
    try {
        const adminId = req.admin?.id || req.admin?._id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication is required"
            });
        }

        const existingAdmin = await Admin.findById(adminId);

        if (!existingAdmin || !existingAdmin.isVerified) {
            clearAdminCookies(res);

            return res.status(401).json({
                success: false,
                message: "Admin account is unavailable or unverified"
            });
        }

        return res.status(200).json({
            success: true,
            admin: getSafeAdmin(existingAdmin),
            message: "Admin authentication verified"
        });
    } catch (error) {
        return sendControllerError(
            res,
            error,
            "ADMIN AUTH CHECK ERROR"
        );
    }
};
