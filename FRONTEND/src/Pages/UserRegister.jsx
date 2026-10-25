import { motion } from "motion/react";
import Input from "../Components/Register/InputConponents";
import {
    FlaskConical,
    GraduationCap,
    Loader,
    Lock,
    Mail,
    Rocket,
    User,
    Eye,
    EyeOff
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import faculty from "../Image/robot1.jpg";
import logo from "../Image/FBLOGO.jpg";
import { useAuthStore } from "../Store/AuthStore";

const matricNumberRegex =
    /^FUO\/\d{2}\/(MCE|CVE|PGE|EEE|MEE|CHM)\/\d{5}$/;

const departmentByCode = {
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
        name: "Petroleum and Gas Engineering",
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

const normalizeDepartment = (department) =>
    String(department || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const UserRegister = () => {
    const navigate = useNavigate();

    const initialValues = {
        username: "",
        email: "",
        matricNumber: "",
        password: "",
        confirmPassword: "",
        level: "",
        department: ""
    };

    const [formValues, setFormValues] = useState(initialValues);
    const [formErrors, setFormErrors] = useState({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { signup, isLoading } = useAuthStore();

    // Validate the form only when requested.
    const validate = (values) => {
        const errors = {};

        if (!values.username.trim()) {
            errors.username = "Username is required.";
        } else if (values.username.trim().length < 5) {
            errors.username = "Username must contain at least 5 characters.";
        } else if (values.username.trim().length > 59) {
            errors.username = "Username cannot exceed 59 characters.";
        }

        if (!values.email.trim()) {
            errors.email = "Email is required.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
            errors.email = "Please enter a valid email address.";
        }

        if (!values.password) {
            errors.password = "Password is required.";
        } else if (values.password.length < 12) {
            errors.password = "Password must contain at least 12 characters.";
        } else if (values.password.length > 128) {
            errors.password = "Password cannot exceed 128 characters.";
        } else if (
            !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])[\s\S]+$/.test(
                values.password
            )
        ) {
            errors.password =
                "Use uppercase and lowercase letters, a number, and a special character.";
        }

        if (!values.confirmPassword) {
            errors.confirmPassword = "Please confirm your password.";
        } else if (values.password !== values.confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
        }

        if (!values.matricNumber.trim()) {
            errors.matricNumber = "Matric number is required.";
        } else {
            const match = values.matricNumber.trim().match(matricNumberRegex);

            if (!match) {
                errors.matricNumber =
                    "Use the format FUO/24/MCE/12345 with a valid department code.";
            } else if (values.department) {
                const code = match[1];
                const expectedDepartment = departmentByCode[code];
                const selectedDepartment = normalizeDepartment(
                    values.department
                );

                if (
                    expectedDepartment &&
                    !expectedDepartment.aliases.includes(selectedDepartment)
                ) {
                    errors.department =
                        `The code ${code} requires ${expectedDepartment.name}.`;
                }
            }
        }

        if (!values.department) {
            errors.department = "Please select your department.";
        }

        if (!values.level) {
            errors.level = "Please select your level.";
        }

        return errors;
    };

    // Handle input changes without showing errors on initial page load.
    const handleChange = (e) => {
        const { name } = e.target;
        let { value } = e.target;

        // Keep matric numbers in the required uppercase format.
        if (name === "matricNumber") {
            value = value.toUpperCase().replace(/\s/g, "");
        }

        const updatedValues = {
            ...formValues,
            [name]: value
        };

        setFormValues(updatedValues);
        setServerError("");

        // Revalidate only after the student has attempted submission.
        if (hasSubmitted) {
            setFormErrors(validate(updatedValues));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) {
            return;
        }

        setHasSubmitted(true);
        setServerError("");

        const errors = validate(formValues);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            await signup(
                formValues.email.trim(),
                formValues.password,
                formValues.confirmPassword,
                formValues.username.trim(),
                formValues.department,
                formValues.matricNumber.trim(),
                formValues.level
            );

            navigate("/verify-email", {
                state: { email: formValues.email.trim() }
            });
        } catch (error) {
            console.error("Registration failed.");

            setServerError(
                error.response?.data?.message ||
                "Registration failed. Please check your details and try again."
            );
        }
    };

    const passwordInputClass =
        "w-full rounded-lg py-2.5 pl-10 pr-12 bg-gray-50 border border-gray-200 outline-none transition duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500";

    const fieldErrorClass = "text-red-500 text-xs mt-1";

    return (
        <div className="relative min-h-screen w-full bg-gray-100 flex items-center justify-center p-5">
            <motion.div
                initial={{ opacity: 0, y: 33 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.88 }}
                className="flex w-full max-w-5xl overflow-hidden mt-4 md:mt-8 rounded-lg bg-white shadow-lg"
            >
                {/* Left information panel */}
                <div className="relative hidden md:block w-1/2 min-h-[700px] overflow-hidden">
                    <img
                        src={faculty}
                        alt="Faculty of Engineering"
                        className="absolute inset-0 h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-blue-950 via-black/30 to-blue-600" />

                    <div className="absolute inset-0 px-10 text-white flex flex-col justify-between">
                        <div className="flex flex-col mt-5">
                            <div>
                                <img
                                    className="size-19 rounded-full mr-3 object-cover"
                                    src={logo}
                                    alt="Faculty Logo"
                                />
                            </div>

                            <div className="mb-8 mt-3">
                                <h1 className="font-bold leading-6">
                                    FACULTY OF
                                    <br />
                                    <span className="text-[22px]">
                                        ENGINEERING
                                    </span>
                                </h1>

                                <p className="text-amber-500 text-[13px] font-bold">
                                    Excellence. Innovation. Impact
                                </p>
                            </div>

                            <div>
                                <h2 className="font-bold text-[20px]">
                                    Join a Community
                                    <br />
                                    of Innovators and
                                    <br />
                                    problem solvers.
                                </h2>

                                <p>
                                    Register with us for free and get
                                    <br />
                                    <span className="text-amber-500 text-[22px] font-bold">
                                        STARTED
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="mb-5 flex flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="size-14 shrink-0 border rounded-lg border-amber-500 text-amber-500 p-1" />

                                <div>
                                    <h2 className="font-bold">
                                        Quality Education
                                    </h2>
                                    <p className="text-[13px]">
                                        Learn from experienced lecturers
                                        <br />
                                        and industry experts.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <FlaskConical className="size-14 shrink-0 border rounded-lg border-amber-500 text-amber-500 p-1" />

                                <div>
                                    <h2 className="font-bold">
                                        Modern Facilities
                                    </h2>
                                    <p className="text-[13px]">
                                        Access state-of-the-art labs
                                        <br />
                                        and learning resources.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Rocket className="size-14 shrink-0 border rounded-lg border-amber-500 text-amber-500 p-1" />

                                <div>
                                    <h2 className="font-bold">
                                        Innovative Research
                                    </h2>
                                    <p className="text-[13px]">
                                        Be part of cutting-edge research
                                        <br />
                                        and real-world solutions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration form */}
                <div className="w-full md:w-1/2 p-6 md:p-8">
                    <form onSubmit={handleSubmit} noValidate>
                        <fieldset
                            disabled={isLoading}
                            className="min-w-0"
                        >
                            <h1 className="text-blue-950 text-center text-[23px] font-bold relative after:absolute after:bg-amber-500 after:top-9 after:left-1/2 after:-translate-x-1/2 after:rounded-lg after:w-15 after:h-1 mb-7">
                                Register
                            </h1>

                            {/* Username */}
                            <Input
                                inputLabel="Username"
                                icon={User}
                                type="text"
                                name="username"
                                value={formValues.username}
                                onChange={handleChange}
                                placeholder="Enter your username"
                            />

                            {hasSubmitted && formErrors.username && (
                                <p className={fieldErrorClass}>
                                    {formErrors.username}
                                </p>
                            )}

                            {/* Email */}
                            <Input
                                inputLabel="Email"
                                icon={Mail}
                                type="email"
                                placeholder="example@gmail.com"
                                name="email"
                                value={formValues.email}
                                onChange={handleChange}
                            />

                            {hasSubmitted && formErrors.email && (
                                <p className={fieldErrorClass}>
                                    {formErrors.email}
                                </p>
                            )}

                            {/* Matric number */}
                            <Input
                                inputLabel="Matric Number"
                                icon={GraduationCap}
                                type="text"
                                placeholder="FUO/24/MCE/12345"
                                name="matricNumber"
                                value={formValues.matricNumber}
                                onChange={handleChange}
                            />

                            {hasSubmitted && formErrors.matricNumber && (
                                <p className={fieldErrorClass}>
                                    {formErrors.matricNumber}
                                </p>
                            )}

                            {/* Password with show/hide button */}
                            <div className="mb-1">
                                <label
                                    htmlFor="password"
                                    className="block pl-3 mb-1 text-blue-950"
                                >
                                    Password
                                </label>

                                <div className="relative">
                                    <Lock
                                        size={19}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                    />

                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formValues.password}
                                        onChange={handleChange}
                                        placeholder="Create a strong password"
                                        autoComplete="new-password"
                                        maxLength={128}
                                        aria-invalid={
                                            hasSubmitted && !!formErrors.password
                                        }
                                        className={passwordInputClass}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((previous) => !previous)
                                        }
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                        aria-pressed={showPassword}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-950 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded p-1"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={19} />
                                        ) : (
                                            <Eye size={19} />
                                        )}
                                    </button>
                                </div>

                                <p className="text-gray-500 text-xs mt-1">
                                    At least 12 characters, with uppercase and
                                    lowercase letters, a number, and a special
                                    character.
                                </p>

                                {hasSubmitted && formErrors.password && (
                                    <p className={fieldErrorClass}>
                                        {formErrors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirm password with independent show/hide button */}
                            <div className="mt-4 mb-4">
                                <label
                                    htmlFor="confirmPassword"
                                    className="block pl-3 mb-1 text-blue-950"
                                >
                                    Confirm Password
                                </label>

                                <div className="relative">
                                    <Lock
                                        size={19}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                                    />

                                    <input
                                        id="confirmPassword"
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirmPassword"
                                        value={formValues.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        autoComplete="new-password"
                                        maxLength={128}
                                        aria-invalid={
                                            hasSubmitted &&
                                            !!formErrors.confirmPassword
                                        }
                                        className={passwordInputClass}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                (previous) => !previous
                                            )
                                        }
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide confirm password"
                                                : "Show confirm password"
                                        }
                                        aria-pressed={showConfirmPassword}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-950 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded p-1"
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={19} />
                                        ) : (
                                            <Eye size={19} />
                                        )}
                                    </button>
                                </div>

                                {hasSubmitted && formErrors.confirmPassword && (
                                    <p className={fieldErrorClass}>
                                        {formErrors.confirmPassword}
                                    </p>
                                )}
                            </div>

                            {/* Department */}
                            <div className="mb-4">
                                <label
                                    htmlFor="department"
                                    className="block pl-3 mb-1 text-blue-950"
                                >
                                    Select Department
                                </label>

                                <select
                                    id="department"
                                    className="w-full rounded-lg py-2.5 pl-3 pr-3 bg-gray-50 border border-gray-200 outline-none transition duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                                    name="department"
                                    onChange={handleChange}
                                    value={formValues.department}
                                >
                                    <option value="">
                                        Select Department
                                    </option>

                                    <option value="Mechatronics Engineering">
                                        Mechatronics Engineering
                                    </option>

                                    <option value="Mechanical Engineering">
                                        Mechanical Engineering
                                    </option>

                                    <option value="Electrical Electronics Engineering">
                                        Electrical Electronics Engineering
                                    </option>

                                    <option value="Civil Engineering">
                                        Civil Engineering
                                    </option>

                                    <option value="Chemical Engineering">
                                        Chemical Engineering
                                    </option>

                                    <option value="Petroleum and Gas Engineering">
                                        Petroleum and Gas Engineering
                                    </option>
                                </select>

                                {hasSubmitted && formErrors.department && (
                                    <p className={fieldErrorClass}>
                                        {formErrors.department}
                                    </p>
                                )}
                            </div>

                            {/* Level */}
                            <div className="mb-4">
                                <label
                                    htmlFor="level"
                                    className="block pl-3 mb-1 text-blue-950"
                                >
                                    Select Level
                                </label>

                                <select
                                    id="level"
                                    className="w-full rounded-lg py-2.5 pl-3 pr-3 bg-gray-50 border border-gray-200 outline-none transition duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                                    name="level"
                                    onChange={handleChange}
                                    value={formValues.level}
                                >
                                    <option value="">Select level</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                    <option value="300">300</option>
                                    <option value="400">400</option>
                                    <option value="500">500</option>
                                </select>

                                {hasSubmitted && formErrors.level && (
                                    <p className={fieldErrorClass}>
                                        {formErrors.level}
                                    </p>
                                )}
                            </div>

                            {/* Registration button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={
                                    isLoading ? undefined : { scale: 1.01 }
                                }
                                whileTap={
                                    isLoading ? undefined : { scale: 0.99 }
                                }
                                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 bg-blue-900 text-white ${
                                    isLoading
                                        ? "cursor-not-allowed opacity-70"
                                        : "cursor-pointer hover:bg-blue-950 hover:shadow-lg"
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader
                                            className="animate-spin inline-block mr-2"
                                            size={20}
                                        />
                                        Registering...
                                    </>
                                ) : (
                                    "Register"
                                )}
                            </motion.button>

                            {/* Backend registration error */}
                            {serverError && (
                                <p
                                    role="alert"
                                    className="text-red-500 text-sm text-center mt-3"
                                >
                                    {serverError}
                                </p>
                            )}

                            {/* Login link */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-sm">
                                <p className="text-gray-700">
                                    Already have an account?
                                </p>

                                <NavLink
                                    to="/login"
                                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 font-semibold text-blue-900 hover:bg-blue-50 hover:underline transition-colors"
                                >
                                    Login
                                </NavLink>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default UserRegister;