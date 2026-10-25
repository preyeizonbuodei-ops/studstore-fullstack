
import Input from "../../Components/Register/InputConponents";
import { useState } from "react";
import {
    GraduationCap,
    KeyIcon,
    Loader,
    Lock,
    Mail,
    User,
    UserCheck,
    Eye,
    EyeOff
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AdminRegister as useAdminRegister } from "../../Store/AdminStore";

const AdminRegister = () => {
    const initialValues = {
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        adminKey: ""
    };

    const [formValues, setFormValues] = useState(initialValues);
    const [formErrors, setFormErrors] = useState({});
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showAdminKey, setShowAdminKey] = useState(false);

    const { register, isLoading, error } = useAdminRegister();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;

        const updatedValues = {
            ...formValues,
            [name]: value
        };

        setFormValues(updatedValues);

        if (hasSubmitted) {
            setFormErrors(validate(updatedValues));
        }
    };

    const validate = (values) => {
        const errors = {};

        if (!values.username.trim()) {
            errors.username = "Username is required.";
        }

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

        if (!values.confirmPassword) {
            errors.confirmPassword = "Confirm password is required.";
        } else if (values.password !== values.confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
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

        const errors = validate(formValues);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        try {
            await register(
                formValues.username.trim(),
                formValues.email.trim(),
                formValues.password,
                formValues.confirmPassword,
                formValues.adminKey
            );

            navigate("/admin-verify-email", {
                state: {
                    email: formValues.email.trim()
                }
            });
        } catch (err) {
            // The store's error message is displayed below the fields.
            console.error(
                "Admin registration failed:",
                err.response?.status || err.message
            );
        }
    };

    const renderPasswordField = ({
        id,
        name,
        label,
        placeholder,
        value,
        visible,
        toggleVisibility,
        icon: Icon
    }) => (
        <div className="mb-1" key={name}>
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
                    type={visible ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoComplete={
                        name === "adminKey"
                            ? "off"
                            : "new-password"
                    }
                    aria-invalid={
                        hasSubmitted && Boolean(formErrors[name])
                    }
                    className="w-full rounded-lg py-2.5 pl-10 pr-12 bg-gray-50 border border-gray-200 outline-none transition duration-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                />

                <button
                    type="button"
                    onClick={toggleVisibility}
                    aria-label={
                        visible
                            ? `Hide ${label}`
                            : `Show ${label}`
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
                <p className="text-red-500 text-xs mt-1">
                    {formErrors[name]}
                </p>
            )}
        </div>
    );

    return (
        <section>
            <motion.div
                initial={{ opacity: 0, y: 33 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.88 }}
                className="relative min-h-screen w-full flex items-center justify-center p-5"
            >
                <div className="w-full max-w-lg bg-white shadow-[0_2px_20px_rgba(0,0,0,0.12)] mx-3 rounded-lg">
                    <div className="flex flex-col items-center mt-9">
                        <UserCheck className="size-19 border rounded-full p-3 bg-blue-950 text-white" />

                        <h1 className="text-[33px] font-bold text-blue-950 mb-3">
                            Admin Register
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
                            {/* Username */}
                            <Input
                                placeholder="Username"
                                inputLabel="Username"
                                icon={User}
                                type="text"
                                name="username"
                                value={formValues.username}
                                onChange={handleChange}
                            />

                            {hasSubmitted && formErrors.username && (
                                <p className="text-red-500 text-xs mt-1">
                                    {formErrors.username}
                                </p>
                            )}

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
                                <p className="text-red-500 text-xs mt-1">
                                    {formErrors.email}
                                </p>
                            )}

                            {/* Password */}
                            <div className="mt-4">
                                {renderPasswordField({
                                    id: "admin-register-password",
                                    name: "password",
                                    label: "Password",
                                    placeholder: "Create password",
                                    value: formValues.password,
                                    visible: showPassword,
                                    toggleVisibility: () =>
                                        setShowPassword((previous) => !previous),
                                    icon: Lock
                                })}
                            </div>

                            {/* Confirm Password */}
                            <div className="mt-4">
                                {renderPasswordField({
                                    id: "admin-register-confirm-password",
                                    name: "confirmPassword",
                                    label: "Confirm Password",
                                    placeholder: "Confirm password",
                                    value: formValues.confirmPassword,
                                    visible: showConfirmPassword,
                                    toggleVisibility: () =>
                                        setShowConfirmPassword(
                                            (previous) => !previous
                                        ),
                                    icon: KeyIcon
                                })}
                            </div>

                            {/* Admin Key */}
                            <div className="mt-4">
                                {renderPasswordField({
                                    id: "admin-register-key",
                                    name: "adminKey",
                                    label: "Admin Key",
                                    placeholder: "Enter admin key",
                                    value: formValues.adminKey,
                                    visible: showAdminKey,
                                    toggleVisibility: () =>
                                        setShowAdminKey((previous) => !previous),
                                    icon: GraduationCap
                                })}
                            </div>

                            {/* Backend error */}
                            {hasSubmitted && error && (
                                <p
                                    role="alert"
                                    className="text-red-500 text-sm text-center mt-3 mb-3"
                                >
                                    {typeof error === "string"
                                        ? error
                                        : "Registration failed. Please try again."}
                                </p>
                            )}

                            {/* Register button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={
                                    isLoading
                                        ? undefined
                                        : { scale: 1.01 }
                                }
                                className={`mt-5 bg-blue-950 text-center text-lg w-full py-3 rounded-lg font-bold text-white mb-4 transition duration-300 ${
                                    isLoading
                                        ? "cursor-not-allowed opacity-75"
                                        : "cursor-pointer hover:bg-amber-500 hover:shadow-lg"
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

                            {/* Admin login link */}
                            <div className="flex flex-wrap items-center justify-center gap-2 mb-6 text-sm">
                                <span className="text-gray-700">
                                    Already have an account?
                                </span>

                                <NavLink
                                    to="/admin-login"
                                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-blue-950 font-bold transition duration-300 hover:bg-amber-50 hover:text-amber-600"
                                >
                                    Login
                                </NavLink>
                            </div>
                        </fieldset>
                    </form>
                </div>
            </motion.div>
        </section>
    );
};

export default AdminRegister;
