const Joi = require("joi");

const strongPassword = () =>
    Joi.string()
        .min(12)
        .max(128)
        .pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])[\s\S]+$/
        )
        .required()
        .messages({
            "string.base": "Password must be a valid string.",
            "string.empty": "Password is required.",
            "string.min": "Password must contain at least 12 characters.",
            "string.max": "Password cannot exceed 128 characters.",
            "string.pattern.base":
                "Password must contain uppercase and lowercase letters, a number, and a special character.",
            "any.required": "Password is required.",
        });

const normalizeDepartment = (department) =>
    String(department || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const departmentCodes = {
    CVE: {
        name: "Civil Engineering",
        aliases: ["civilengineering", "civil"],
    },
    MEE: {
        name: "Mechanical Engineering",
        aliases: ["mechanicalengineering", "mechanical"],
    },
    MCE: {
        name: "Mechatronics Engineering",
        aliases: ["mechatronicsengineering", "mechatronics"],
    },
    PGE: {
        name: "Petroleum and Gas",
        aliases: [
            "petroleumandgas",
            "petroleumandgasengineering",
            "petroleumgas",
            "petroleumgasengineering",
        ],
    },
    EEE: {
        name: "Electrical Electronics Engineering",
        aliases: [
            "electricalelectronicsengineering",
            "electricalandelectronicsengineering",
            "electricalelectronics",
        ],
    },
    CME: {
        name: "Chemical Engineering",
        aliases: ["chemicalengineering", "chemical"],
    },
};

const matricNumberPattern =
    /^FUO\/\d{2}\/(MCE|CVE|PGE|EEE|MEE|CME)\/\d{5}$/;

const matricNumberValidation = Joi.string()
    .pattern(matricNumberPattern)
    .messages({
        "string.base": "Matric number must be a valid string.",
        "string.empty": "Matric number is required.",
        "string.pattern.base":
            "Matric number must follow the format FUO/24/MCE/12345, using a valid department code.",
        "any.required": "Matric number is required.",
    });

exports.ValidateUser = Joi.object({
    username: Joi.string()
        .min(5)
        .max(59)
        .required()
        .messages({
            "string.empty": "Username is required.",
            "string.min": "Username must contain at least 5 characters.",
            "string.max": "Username cannot exceed 59 characters.",
            "any.required": "Username is required.",
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.empty": "Email is required.",
            "string.email": "Please enter a valid email address.",
            "any.required": "Email is required.",
        }),

    password: strongPassword(),

    confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords do not match.",
            "string.empty": "Please confirm your password.",
            "any.required": "Please confirm your password.",
        }),

    department: Joi.string()
        .required()
        .messages({
            "string.empty": "Please select a department.",
            "any.required": "Please select a department.",
        }),

    level: Joi.number()
        .required()
        .messages({
            "number.base": "Please select a valid level.",
            "any.required": "Please select a level.",
        }),

    matricNumber: Joi.when("level", {
        is: 100,

        // 100-level students may leave this field empty.
        // If they provide a number, its format is still checked.
        then: matricNumberValidation.allow("").optional(),

        // All other levels must provide a valid matric number.
        otherwise: matricNumberValidation.required(),
    }),
}).custom((value, helpers) => {
    const matricNumber = value.matricNumber;

    // No matric number is acceptable for 100-level students.
    if (!matricNumber) {
        if (Number(value.level) === 100) {
            return value;
        }

        return value;
    }

    // The Joi pattern validation reports malformed matric numbers.
    const match = matricNumber.match(matricNumberPattern);

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
        "The selected department does not match the department code in your matric number.",
});

exports.ValidateChangePassword = Joi.object({
    oldPassword: Joi.string()
        .required()
        .messages({
            "string.empty": "Current password is required.",
            "any.required": "Current password is required.",
        }),

    newPassword: strongPassword(),
});

exports.ValidateComment = Joi.object({
    comment: Joi.string()
        .trim()
        .min(3)
        .max(2000)
        .required()
        .messages({
            "string.empty": "Cannot submit an empty comment.",
            "string.min": "Your comment must contain at least 3 characters.",
            "string.max": "Your comment cannot exceed 2,000 characters.",
            "any.required": "Comment is required.",
        }),
});