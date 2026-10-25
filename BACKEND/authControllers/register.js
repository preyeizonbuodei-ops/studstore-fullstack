const User = require("../modules/registerSchema");
const mongoose = require("mongoose");
const {
    ValidateUser,
    ValidateChangePassword,
} = require("../middlewares/validate");
const bcrypt = require("bcrypt");
const { DoHash } = require("../utils/hashing");
const jwt = require("jsonwebtoken");
const SendMail = require("../middlewares/sendMail");
const { hmacProcess } = require("../utils/hashing");
const Admin = require("../modules/adminSchema");

// Consistent authentication cookie settings
const authCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge,
});

const clearAuthCookieOptions = () => ({
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
});

// Strict password validation
const getPasswordValidationError = (password) => {
    if (typeof password !== "string") {
        return "Password must be a valid string.";
    }

    if (password.length < 12) {
        return "Password must contain at least 12 characters.";
    }

    if (password.length > 128) {
        return "Password cannot exceed 128 characters.";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
        return "Password must contain at least one special character.";
    }

    return null;
};

exports.Register = async (req, res) => {
    try {
        const {
            username,
            email,
            password,
            confirmPassword,
            matricNumber,
            level,
            department,
            role,
            lastLogin,
            isLoggedIn,
        } = req.body;

        const { error } = ValidateUser.validate({
            username,
            email,
            password,
            confirmPassword,
            matricNumber,
            level,
            department,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message,
            });
        }

        // Enforce password requirements before hashing.
        const passwordError = getPasswordValidationError(password);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError,
            });
        }

        if (confirmPassword !== password) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match.",
            });
        }

        const check = await User.findOne({ email });

        if (check) {
            return res.status(409).json({
                success: false,
                message: "Email already exists. Try another email.",
            });
        }

        const hashedPassword = await DoHash(password, 10);

        const verificationToken = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const verificationTokenExpiresAt =
            Date.now() + 24 * 60 * 60 * 1000;

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            level,
            department,
            matricNumber,
            role,
            isLoggedIn,
            lastLogin,
            verificationToken,
            verificationTokenExpiresAt,
        });

        await SendMail({
            to: newUser.email,
            subject: "StudStore Account Verification Code",
            text: `Your Verification Code is: ${verificationToken}. Keep it secure and never share it.`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 24px;">
                    <h2>StudStore Account Verification Code</h2>
                    <p>Keep this code secure and never share it with anyone.</p>
                    <div style="padding: 16px; background: #f1f5f9; font-size: 20px; font-weight: bold; word-break: break-all;">
                        ${verificationToken}
                    </div>
                    <p>Thanks for choosing StudStore.</p>
                </div>
            `,
        });

        const hashedCodeValue = hmacProcess(
            verificationToken,
            process.env.HMAC_VERIFICATION_CODE_SECRET
        );

        newUser.verificationToken = hashedCodeValue;

        await newUser.save();

        return res.status(201).json({
            success: true,
            message:
                "Registration successful. Please check your email for the verification code.",
        });
    } catch (error) {
        console.error("REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed.",
        });
    }
};

exports.verifyVerificationCode = async (req, res) => {
    try {
        const { email, verificationCode } = req.body;

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email.",
            });
        }

        if (existingUser.isVerified) {
            return res.status(409).json({
                success: false,
                message: "You are already a verified user.",
            });
        }

        const hashedCodeValue = hmacProcess(
            String(verificationCode).trim(),
            process.env.HMAC_VERIFICATION_CODE_SECRET
        );

        if (hashedCodeValue !== existingUser.verificationToken) {
            return res.status(400).json({
                success: false,
                message: "Incorrect verification token.",
            });
        }

        if (Date.now() > existingUser.verificationTokenExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired.",
            });
        }

        existingUser.isVerified = true;
        existingUser.isLoggedIn = true;
        existingUser.verificationToken = undefined;
        existingUser.verificationTokenExpiresAt = undefined;

        const token = jwt.sign(
            {
                id: existingUser._id,
                role: existingUser.role,
                email: existingUser.email,
                isVerified: true,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        res.cookie(
            "authorization",
            `Bearer ${token}`,
            authCookieOptions(60 * 60 * 1000)
        );

        const refreshToken = jwt.sign(
            {
                id: existingUser._id,
                role: existingUser.role,
                email: existingUser.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "4d",
            }
        );

        res.cookie(
            "refreshToken",
            refreshToken,
            authCookieOptions(4 * 24 * 60 * 60 * 1000)
        );

        await existingUser.save();

        const user = existingUser.toObject();

        delete user.password;
        delete user.confirmPassword;
        delete user.verificationToken;
        delete user.verificationTokenExpiresAt;

        await SendMail({
            from: process.env.EMAIL_FROM,
            to: existingUser.email,
            subject: "Welcome to StudStore — Learn. Explore. Innovate!",
            text: `Welcome to StudStore, ${existingUser.username}! We're excited to have you join our growing community of learners, innovators, and future engineers. Thank you for choosing StudStore. Empowering learning. Inspiring innovation.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b; line-height: 1.7;">
                    <h2 style="color: #2563eb; text-align: center;">
                        Welcome to StudStore — Your Journey to Learning and Innovation Starts Here!
                    </h2>

                    <p>Hi ${existingUser.username},</p>

                    <h1 style="text-align: center;">Welcome to StudStore!</h1>

                    <p>
                        We're excited to have you join our growing community of learners,
                        innovators, and future engineers.
                    </p>

                    <p>
                        StudStore was created to make learning more accessible, help
                        students grow academically, and connect people with the knowledge
                        and resources they need to succeed.
                    </p>

                    <p><strong>With StudStore, you can:</strong></p>

                    <h3>Learn Smarter</h3>
                    <p>Explore courses, lessons, and topics designed to support your academic journey.</p>

                    <h3>Expand Your Knowledge</h3>
                    <p>Discover learning materials, educational videos, and useful resources.</p>

                    <h3>Explore Engineering Research</h3>
                    <p>Discover research papers, academic publications, and ideas that inspire innovation.</p>

                    <h3>Grow and Innovate</h3>
                    <p>Build your knowledge, strengthen your skills, and take steps toward your future goals.</p>

                    <p>
                        We believe that every great innovation begins with curiosity,
                        learning, and the courage to explore new ideas. Whether you're
                        preparing for an examination, deepening your understanding of
                        engineering, or discovering new research, StudStore is here to
                        support your journey.
                    </p>

                    <div style="padding: 16px; background: #eff6ff; border-radius: 8px; text-align: center; margin: 24px 0;">
                        <h2 style="color: #1d4ed8;">
                            Your journey to knowledge, growth, and innovation starts here.
                        </h2>
                    </div>

                    <p>
                        Thank you for choosing StudStore. We're glad you're part of our
                        community, and we look forward to being part of your academic journey.
                    </p>

                    <p>Log in to your account and start exploring!</p>

                    <h2 style="text-align: center; color: #2563eb;">
                        Learn. Explore. Innovate.
                    </h2>

                    <p>Warm regards,</p>
                    <h2>The StudStore Team</h2>

                    <p style="color: #64748b;">
                        Empowering learning. Inspiring innovation.
                    </p>

                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

                    <p style="font-size: 12px; color: #64748b; text-align: center;">
                        Thank you for choosing StudStore.
                    </p>
                </div>
            `,
        });

        return res.status(200).json({
            success: true,
            user,
            message: "Logged in successfully.",
        });
    } catch (error) {
        console.error("VERIFICATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
};

exports.Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Reject non-string inputs before performing database queries.
        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email and password.",
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const compare = await bcrypt.compare(password, user.password);

        if (!compare) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password.",
            });
        }

        if (!user.isVerified) {
            return res.status(409).json({
                success: false,
                message: "Please verify your account before login.",
            });
        }

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email,
                isVerified: user.isVerified,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        res.cookie(
            "authorization",
            `Bearer ${token}`,
            authCookieOptions(60 * 60 * 1000)
        );

        const refreshToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "4d",
            }
        );

        res.cookie(
            "refreshToken",
            refreshToken,
            authCookieOptions(4 * 24 * 60 * 60 * 1000)
        );

        user.isLoggedIn = true;
        user.lastLogin = new Date();

        await user.save();

        const sentUser = user.toObject();

        delete sentUser.password;
        delete sentUser.confirmPassword;

        return res.status(200).json({
            success: true,
            user: sentUser,
            message: "Logged in successfully.",
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during login.",
        });
    }
};

exports.Logout = async (req, res) => {
    try {
        const userId = req.user.id;

        const existingUser = await User.findById(userId);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        existingUser.isLoggedIn = false;

        await existingUser.save();

        res.clearCookie("authorization", clearAuthCookieOptions());
        res.clearCookie("refreshToken", clearAuthCookieOptions());

        return res.status(200).json({
            success: true,
            message: "You have logged out successfully.",
        });
    } catch (error) {
        console.error("LOGOUT ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong during logout.",
        });
    }
};

exports.ChangePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const checking = ValidateChangePassword.validate({
            oldPassword,
            newPassword,
        });

        if (checking.error) {
            return res.status(400).json({
                success: false,
                message: checking.error.details[0].message,
            });
        }

        // Validate the new password before hashing.
        const passwordError = getPasswordValidationError(newPassword);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError,
            });
        }

        const existingUser = await User.findById(userId).select("+password");

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "No user was found.",
            });
        }

        if (!existingUser.isVerified) {
            return res.status(403).json({
                success: false,
                message: "You are not a verified user.",
            });
        }

        const result = await bcrypt.compare(
            oldPassword,
            existingUser.password
        );

        if (!result) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials.",
            });
        }

        const hashedPassword = await DoHash(newPassword, 12);

        existingUser.password = hashedPassword;

        await existingUser.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("CHANGE PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
};

exports.ForgotPasswordEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address.",
            });
        }

        const existingUser = await User.findOne({
            email: email.trim().toLowerCase(),
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "No user found with this email.",
            });
        }

        if (!existingUser.isVerified) {
            return res.status(403).json({
                success: false,
                message: "You are not a verified user.",
            });
        }

        const forgotPasswordCode = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const forgotPasswordCodeExpiresAt =
            Date.now() + 24 * 60 * 60 * 1000;

        const sendingMail = await transport.sendMail({
            from: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
            to: existingUser.email,
            subject: "Forgot Password Code",
            html: "<h1>" + forgotPasswordCode + "</h1>",
        });

        if (sendingMail.accepted[0] === existingUser.email) {
            const hashedValue = hmacProcess(
                forgotPasswordCode,
                process.env.HMAC_VERIFICATION_CODE_SECRET
            );

            existingUser.forgotPasswordCode = hashedValue;
            existingUser.forgotPasswordCodeExpiresAt =
                forgotPasswordCodeExpiresAt;

            const verificationToken = jwt.sign(
                {
                    user_Id: existingUser._id,
                    purpose: "forget-password-user",
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h",
                }
            );

            res.cookie(
                "forget-password-user",
                verificationToken,
                authCookieOptions(60 * 60 * 1000)
            );

            await existingUser.save();

            return res.status(200).json({
                success: true,
                message: "Check your email for the reset password code.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to send the reset password code.",
        });
    } catch (error) {
        console.error("FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending the reset password code.",
        });
    }
};

exports.VerifyForgotPasswordCode = async (req, res) => {
    try {
        const { providedCodeValue } = req.body;

        const verificationToken = req.cookies["forget-password-user"];

        if (!verificationToken) {
            return res.status(401).json({
                success: false,
                message: "Token expired.",
            });
        }

        const decoded = jwt.verify(
            verificationToken,
            process.env.JWT_SECRET
        );

        if (decoded.purpose !== "forget-password-user") {
            return res.status(403).json({
                success: false,
                message: "Invalid verification session.",
            });
        }

        const existingUser = await User.findById(decoded.user_Id);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email.",
            });
        }

        if (!existingUser.isVerified) {
            return res.status(403).json({
                success: false,
                message: "You are not a verified user.",
            });
        }

        const hashedCodeValue = hmacProcess(
            String(providedCodeValue).trim(),
            process.env.HMAC_VERIFICATION_CODE_SECRET
        );

        if (hashedCodeValue !== existingUser.forgotPasswordCode) {
            return res.status(400).json({
                success: false,
                message: "Incorrect verification token.",
            });
        }

        if (Date.now() > existingUser.forgotPasswordCodeExpiresAt) {
            return res.status(400).json({
                success: false,
                message: "Verification code has expired.",
            });
        }

        const resetToken = jwt.sign(
            {
                id: existingUser._id,
                purpose: "reset-password",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        res.cookie(
            "reset-password",
            resetToken,
            authCookieOptions(60 * 60 * 1000)
        );

        await existingUser.save();

        return res.status(200).json({
            success: true,
            message: "Verification successful.",
        });
    } catch (error) {
        console.error("VERIFY FORGOT PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
};

exports.ResetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const resetToken = req.cookies["reset-password"];

        if (!resetToken) {
            return res.status(401).json({
                success: false,
                message: "Token session expired.",
            });
        }

        const decoded = jwt.verify(
            resetToken,
            process.env.JWT_SECRET
        );

        if (decoded.purpose !== "reset-password") {
            return res.status(403).json({
                success: false,
                message: "Invalid reset token.",
            });
        }

        const existingUser = await User.findById(decoded.id);

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found with this email.",
            });
        }

        if (password !== confirmPassword) {
            return res.status(409).json({
                success: false,
                message: "Passwords do not match.",
            });
        }

        // Validate reset passwords before hashing.
        const passwordError = getPasswordValidationError(password);

        if (passwordError) {
            return res.status(400).json({
                success: false,
                message: passwordError,
            });
        }

        const hashedPassword = await DoHash(password, 10);

        existingUser.password = hashedPassword;
        existingUser.forgotPasswordCode = undefined;
        existingUser.forgotPasswordCodeExpiresAt = undefined;

        await existingUser.save();

        res.clearCookie(
            "reset-password",
            clearAuthCookieOptions()
        );

        res.clearCookie(
            "forget-password-user",
            clearAuthCookieOptions()
        );

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("RESET PASSWORD ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
        });
    }
};

exports.getRefreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies || {};

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "No refresh token was found.",
            });
        }

        const decodedUser = jwt.verify(
            refreshToken,
            process.env.JWT_SECRET
        );

        if (!decodedUser.id) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token payload.",
            });
        }

        const user = await User.findById(decodedUser.id);

        if (!user || !user.isVerified || !user.isLoggedIn) {
            return res.status(401).json({
                success: false,
                message:
                    "Session expired or account not verified. Please log in again.",
            });
        }

        const newAccessToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                email: user.email,
                isVerified: user.isVerified,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        res.cookie(
            "authorization",
            `Bearer ${newAccessToken}`,
            authCookieOptions(60 * 60 * 1000)
        );

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully.",
        });
    } catch (error) {
        console.error("REFRESH TOKEN ERROR:", error.message);

        return res.status(401).json({
            success: false,
            message:
                error.name === "TokenExpiredError"
                    ? "Refresh token expired. Please log in again."
                    : "Invalid refresh token.",
        });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const [students, admins] = await Promise.all([
            User.find()
                .select(
                    "username email level department matricNumber role isVerified isLoggedIn lastLogin createdAt updatedAt"
                )
                .lean(),

            Admin.find()
                .select(
                    "username email role isVerified isLoggedIn lastLoggedIn createdAt updatedAt"
                )
                .lean(),
        ]);

        const formattedStudents = students.map((student) => ({
            ...student,
            accountType: "Student",
            lastLogin: student.lastLogin,
        }));

        const formattedAdmins = admins.map((admin) => ({
            ...admin,
            accountType: "Admin",
            lastLogin: admin.lastLoggedIn,
        }));

        const allUsers = [...formattedStudents, ...formattedAdmins].sort(
            (a, b) =>
                new Date(b.createdAt || 0) -
                new Date(a.createdAt || 0)
        );

        return res.status(200).json({
            success: true,
            totalUsers: allUsers.length,
            totalStudents: students.length,
            totalAdmins: admins.length,
            users: allUsers,
        });
    } catch (error) {
        console.error("GET ALL USERS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve users.",
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const {
            username,
            email,
            level,
            department,
            matricNumber,
        } = req.body;

        const updates = {};

        if (username !== undefined) updates.username = username;
        if (email !== undefined) updates.email = email;
        if (level !== undefined) updates.level = level;
        if (department !== undefined) updates.department = department;

        if (matricNumber !== undefined) {
            updates.matricNumber = matricNumber;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update.",
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            {
                new: true,
                runValidators: true,
            }
        ).select(
            "username email level department matricNumber role isVerified isLoggedIn lastLogin createdAt updatedAt"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            user,
        });
    } catch (error) {
        console.error("UPDATE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update user.",
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (
            typeof userId !== "string" ||
            !mongoose.Types.ObjectId.isValid(userId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "User deleted successfully.",
        });
    } catch (error) {
        console.error("DELETE USER ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete user.",
        });
    }
};