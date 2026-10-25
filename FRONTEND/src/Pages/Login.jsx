
import { motion } from "motion/react";
import Input from "../Components/Register/InputConponents";
import {
    FlaskConical,
    House,
    Loader,
    Lock,
    Mail,
    User,
    Users,
    Eye,
    EyeOff
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import faculty from "../Image/researching.jpg";
import logo from "../Image/FBLOGO.jpg";
import { useAuthStore } from "../Store/AuthStore";

const LoginPage = () => {
    const Login = useAuthStore((state) => state.Login);
    const navigate = useNavigate();

    const initialValues = {
        email: "",
        password: ""
    };

    const [formValues, setFormValues] = useState(initialValues);
    const [formErrors, setFormErrors] = useState({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        const updatedValues = {
            ...formValues,
            [name]: value
        };

        setFormValues(updatedValues);
        setServerError("");

        if (hasSubmitted) {
            setFormErrors(validate(updatedValues));
        }
    };

    const validate = (values) => {
        const errors = {};

        if (!values.email.trim()) {
            errors.email = "Email is required.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
        ) {
            errors.email = "Please enter a valid email address.";
        }

        if (!values.password) {
            errors.password = "Password is required.";
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        setHasSubmitted(true);
        setServerError("");

        const errors = validate(formValues);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsLoading(true);

        try {
            const response = await Login(
                formValues.email.trim(),
                formValues.password
            );

            if (response?.success) {
                navigate("/me");
            } else {
                setServerError(
                    response?.message || "Unable to log in. Please try again."
                );
            }
        } catch (error) {
            setServerError(
                error.response?.data?.message ||
                "Something went wrong. Please check your details and try again."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-gray-100 flex items-center justify-center p-5">
            <motion.div
                initial={{ opacity: 0, y: 33 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.88 }}
                className="flex w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-[0_2px_20px_rgba(0,0,0,0.12)]"
            >
                {/* Faculty information panel */}
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
                        </div>

                        <div className="mb-3 flex flex-col gap-3">
                            <div className="mb-3">
                                <h2 className="font-bold text-[42px]">
                                    Welcome Back
                                </h2>

                                <p>
                                    Login to continue to your
                                    <br />
                                    <span className="text-amber-500 text-[22px] font-bold">
                                        Faculty Portal
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <Users className="size-10 border rounded-lg border-amber-500 text-amber-500 p-1" />
                                <div>
                                    <h2 className="font-bold">2,000+</h2>
                                    <p className="text-[13px]">Students</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <User className="size-10 border rounded-lg border-amber-500 text-amber-500 p-1" />
                                <div>
                                    <h2 className="font-bold">50+</h2>
                                    <p className="text-[13px]">Lecturers</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <House className="size-10 border rounded-lg border-amber-500 text-amber-500 p-1" />
                                <div>
                                    <h2 className="font-bold">6</h2>
                                    <p className="text-[13px]">Departments</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <FlaskConical className="size-10 border rounded-lg border-amber-500 text-amber-500 p-1" />
                                <div>
                                    <h2 className="font-bold">30+</h2>
                                    <p className="text-[13px]">Laboratories</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login form */}
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                    <form onSubmit={handleSubmit} noValidate>
                        <h1 className="text-blue-950 text-center text-[23px] font-bold relative after:absolute after:bg-amber-500 after:top-9 after:left-1/2 after:-translate-x-1/2 after:rounded-lg after:w-15 after:h-1 mb-7">
                            Login
                        </h1>

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
                            <p className="text-red-500 text-xs mt-1">
                                {formErrors.email}
                            </p>
                        )}

                        {/* Password with show/hide eye icon */}
                        <div className="mt-4">
                            <label
                                htmlFor="login-password"
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
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formValues.password}
                                    onChange={handleChange}
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    aria-invalid={
                                        hasSubmitted && !!formErrors.password
                                    }
                                    className="w-full rounded-lg py-2.5 pl-10 pr-12 bg-gray-50 border border-gray-200 outline-none transition duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-blue-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    {showPassword ? (
                                        <EyeOff size={19} />
                                    ) : (
                                        <Eye size={19} />
                                    )}
                                </button>
                            </div>

                            {hasSubmitted && formErrors.password && (
                                <p className="text-red-500 text-xs mt-1">
                                    {formErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Forgot password */}
                        <div className="flex justify-between items-center gap-2 mt-4 mb-5 text-sm">
                            <span className="text-gray-600">
                                Forgot password?
                            </span>

                            <NavLink
                                to="/forget-password"
                                className="text-blue-900 font-medium hover:text-amber-600 hover:underline"
                            >
                                Reset password
                            </NavLink>
                        </div>

                        {/* Login button */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={isLoading ? undefined : { scale: 1.01 }}
                            whileTap={isLoading ? undefined : { scale: 0.99 }}
                            className={`w-full rounded-lg py-3 font-bold text-white transition duration-300 ${
                                isLoading
                                    ? "bg-blue-900 opacity-70 cursor-not-allowed"
                                    : "bg-blue-950 hover:bg-amber-500"
                            }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader size={20} className="animate-spin" />
                                    Logging in...
                                </span>
                            ) : (
                                "Login"
                            )}
                        </motion.button>

                        {serverError && (
                            <p
                                role="alert"
                                className="text-red-500 text-sm text-center mt-3"
                            >
                                {serverError}
                            </p>
                        )}

                        {/* Register link */}
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-7 text-sm">
                            <p className="text-gray-700">
                                Don't have an account?
                            </p>

                            <NavLink
                                to="/register"
                                className="rounded-md px-3 py-1.5 font-semibold text-amber-600 hover:bg-amber-50 hover:underline"
                            >
                                Register
                            </NavLink>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
