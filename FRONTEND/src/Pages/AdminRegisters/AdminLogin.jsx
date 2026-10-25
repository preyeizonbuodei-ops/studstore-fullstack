
import Input from "../../Components/Register/InputConponents";
import { useState } from "react";
import {
    GraduationCap,
    Loader,
    Lock,
    Mail,
    UserCheck,
    Eye,
    EyeOff
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AdminRegister as useAdminRegister } from "../../Store/AdminStore";

const AdminLogin = () => {
    const initialValues = {
        email: "",
        password: "",
        adminKey: ""
    };

    const [formValues, setFormValues] = useState(initialValues);
    const [formErrors, setFormErrors] = useState({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [serverError, setServerError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showAdminKey, setShowAdminKey] = useState(false);

    const { login, isLoading, error } = useAdminRegister();
    const navigate = useNavigate();

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

        if (!values.adminKey) {
            errors.adminKey = "Admin key is required.";
        }

        return errors;
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
            await login(
                formValues.email.trim(),
                formValues.password,
                formValues.adminKey
            );

            navigate("/admin-dashboard");
        } catch (err) {
            setServerError(
                err.response?.data?.message ||
                "Admin login failed. Please check your details and try again."
            );
        }
    };

    const passwordFieldClass =
        "w-full rounded-lg py-2.5 pl-10 pr-12 bg-gray-50 border border-gray-200 outline-none transition duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500";

    const errorClass = "text-red-500 text-xs mt-1";

    const renderSecretField = ({
        id,
        name,
        label,
        placeholder,
        icon: Icon,
        value,
        visible,
        toggleVisibility,
        autoComplete
    }) => (
        <div className="mb-4" key={name}>
            <label
                htmlFor={id}
                className="block pl-3 mb-1 text-blue-950"
            >
                {label}
            </label>

            <div className="relative">
                <Icon
                    size={19}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />

                <input
                    id={id}
                    name={name}
                    type={visible ? "text" : "password"}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    aria-invalid={
                        hasSubmitted && Boolean(formErrors[name])
                    }
                    className={passwordFieldClass}
                />

                <button
                    type="button"
                    onClick={toggleVisibility}
                    aria-label={
                        visible ? `Hide ${label}` : `Show ${label}`
                    }
                    aria-pressed={visible}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-blue-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                    {visible ? (
                        <EyeOff size={19} />
                    ) : (
                        <Eye size={19} />
                    )}
                </button>
            </div>

            {hasSubmitted && formErrors[name] && (
                <p className={errorClass}>
                    {formErrors[name]}
                </p>
            )}
        </div>
    );

    const storeErrorMessage =
        typeof error === "string"
            ? error
            : error
                ? "Admin login failed. Please check your details and try again."
                : "";

    return (
        <section>
            <motion.div
                initial={{ opacity: 0, y: 33 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.88 }}
                className="relative min-h-screen w-full flex items-center justify-center p-5 bg-gray-100"
            >
                <div className="w-full max-w-lg bg-white shadow-[0_2px_20px_rgba(0,0,0,0.12)] mx-3 rounded-lg">
                    <div className="flex flex-col items-center mt-9 mb-6">
                        <UserCheck className="size-19 border rounded-full p-3 bg-blue-950 text-white" />

                        <h1 className="text-[33px] font-bold text-blue-950 mt-3 mb-3 text-center">
                            Admin Login
                        </h1>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="mx-5"
                    >
                        <fieldset
                            disabled={isLoading}
                            className="min-w-0"
                        >
                            {/* Email */}
                            <Input
                                placeholder="Email"
                                inputLabel="Email"
                                icon={Mail}
                                type="email"
                                name="email"
                                value={formValues.email}
                                onChange={handleChange}
                            />

                            {hasSubmitted && formErrors.email && (
                                <p className={errorClass}>
                                    {formErrors.email}
                                </p>
                            )}

                            {/* Admin password with eye icon */}
                            <div className="mt-4">
                                {renderSecretField({
                                    id: "admin-login-password",
                                    name: "password",
                                    label: "Password",
                                    placeholder: "Enter password",
                                    icon: Lock,
                                    value: formValues.password,
                                    visible: showPassword,
                                    toggleVisibility: () =>
                                        setShowPassword(
                                            (previous) => !previous
                                        ),
                                    autoComplete: "current-password"
                                })}
                            </div>

                            {/* Admin key with independent eye icon */}
                            {renderSecretField({
                                id: "admin-login-key",
                                name: "adminKey",
                                label: "Admin Key",
                                placeholder: "Enter admin key",
                                icon: GraduationCap,
                                value: formValues.adminKey,
                                visible: showAdminKey,
                                toggleVisibility: () =>
                                    setShowAdminKey(
                                        (previous) => !previous
                                    ),
                                autoComplete: "off"
                            })}

                            {/* Login errors */}
                            {(hasSubmitted && (serverError || storeErrorMessage)) && (
                                <p
                                    role="alert"
                                    className="text-red-500 text-sm text-center mb-3"
                                >
                                    {serverError || storeErrorMessage}
                                </p>
                            )}

                            {/* Login button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={
                                    isLoading
                                        ? undefined
                                        : { scale: 1.01 }
                                }
                                whileTap={
                                    isLoading
                                        ? undefined
                                        : { scale: 0.99 }
                                }
                                className={`w-full py-3 rounded-lg font-bold text-white mb-4 transition duration-300 ${
                                    isLoading
                                        ? "bg-blue-950 cursor-not-allowed opacity-75"
                                        : "bg-blue-950 cursor-pointer hover:bg-amber-500 hover:shadow-lg"
                                }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Loader
                                            className="animate-spin"
                                            size={20}
                                        />
                                        Logging in...
                                    </span>
                                ) : (
                                    "Login"
                                )}
                            </motion.button>

                            {/* Admin registration link */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-sm">
                                <span className="text-gray-700">
                                    Don't have an account?
                                </span>

                                <NavLink
                                    to="/admin-register"
                                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 font-semibold text-blue-950 transition duration-300 hover:bg-amber-50 hover:text-amber-600"
                                >
                                    Register
                                </NavLink>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </motion.div>
        </section>
    );
};

export default AdminLogin;
