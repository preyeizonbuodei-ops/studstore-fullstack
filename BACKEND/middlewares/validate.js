const joi = require("joi");

const strongPassword = () =>
    joi.string()
        .min(12)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])[\s\S]+$/)
        .required()
        .messages({
            "string.base": "Password must be a valid string.",
            "string.empty": "Password is required.",
            "string.min": "Password must contain at least 12 characters.",
            "string.max": "Password cannot exceed 128 characters.",
            "string.pattern.base":
                "Password must contain uppercase and lowercase letters, a number, and a special character.",
            "any.required": "Password is required."
        });

const normalizeDepartment = (department) =>
    String(department || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const departmentCodes = {
    CVE: {
        name: "Civil Engineering",
        aliases: ["civilengineering", "civil"]
    },
    MEE: {
        name: "Mechanical Engineering",
        aliases: ["mechanicalengineering", "mechanical"]
    },
    MCE: {
        name: "Mechatronics Engineering",
        aliases: ["mechatronicsengineering", "mechatronics"]
    },
    PGE: {
        name: "Petroleum and Gas",
        aliases: [
            "petroleumandgas",
            "petroleumandgasengineering",
            "petroleumgas",
            "petroleumgasengineering"
        ]
    },
    EEE: {
        name: "Electrical Electronics Engineering",
        aliases: [
            "electricalelectronicsengineering",
            "electricalandelectronicsengineering",
            "electricalelectronics"
        ]
    },
    CHM: {
        name: "Chemical Engineering",
        aliases: ["chemicalengineering", "chemical"]
    }
};

exports.ValidateUser = joi.object({
    username: joi.string()
        .min(5)
        .max(59)
        .required()
        .messages({
            "string.empty": "Username is required.",
            "string.min": "Username must contain at least 5 characters.",
            "string.max": "Username cannot exceed 59 characters.",
            "any.required": "Username is required."
        }),

    email: joi.string()
        .email()
        .required()
        .messages({
            "string.empty": "Email is required.",
            "string.email": "Please enter a valid email address.",
            "any.required": "Email is required."
        }),

    password: strongPassword(),

    confirmPassword: joi.string()
        .valid(joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords do not match.",
            "string.empty": "Please confirm your password.",
            "any.required": "Please confirm your password."
        }),

    department: joi.string()
        .required()
        .messages({
            "string.empty": "Please select a department.",
            "any.required": "Please select a department."
        }),

    level: joi.number()
        .required()
        .messages({
            "number.base": "Please select a valid level.",
            "any.required": "Please select a level."
        }),

    matricNumber: joi.string()
        .pattern(/^FUO\/\d{2}\/(MCE|CVE|PGE|EEE|MEE|CHM)\/\d{5}$/)
        .required()
        .messages({
            "string.empty": "Matric number is required.",
            "string.pattern.base":
                "Matric number must follow the format FUO/24/MCE/12345, using a valid department code.",
            "any.required": "Matric number is required."
        })
}).custom((value, helpers) => {
    const match = value.matricNumber?.match(
        /^FUO\/\d{2}\/(MCE|CVE|PGE|EEE|MEE|CHM)\/\d{5}$/
    );

    // Let the matric-number pattern validation report malformed numbers.
    if (!match) {
        return value;
    }

    const code = match[1];
    const expectedDepartment = departmentCodes[code];

    if (!expectedDepartment) {
        return helpers.error("any.invalid");
    }

    const selectedDepartment = normalizeDepartment(value.department);

    if (!expectedDepartment.aliases.includes(selectedDepartment)) {
        return helpers.error("any.invalid");
    }

    return value;
}).messages({
    "any.invalid":
        "The selected department does not match the department code in your matric number."
});

exports.ValidateChangePassword = joi.object({
    oldPassword: joi.string()
        .required()
        .messages({
            "string.empty": "Current password is required.",
            "any.required": "Current password is required."
        }),

    newPassword: strongPassword()
});

exports.ValidateComment = joi.object({
    username: joi.string()
        .required()
        .messages({
            "string.empty": "Username is required."
        }),

    comment: joi.string()
        .required()
        .messages({
            "string.empty": "Cannot submit an empty comment."
        })
});