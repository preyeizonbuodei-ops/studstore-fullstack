import { motion } from "motion/react";
import { useState } from "react";
import {
    Key,
    LockKeyhole,
    Eye,
    EyeOff,
    Loader,
    CheckCircle
} from "lucide-react";
import { useAuthStore } from "../Store/AuthStore";

const initialValues = {
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: ""
};

const ChangePassword = () => {
    const [formValues, setFormValues] = useState(initialValues);
    const [formErrors, setFormErrors] = useState({});
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [serverError, setServerError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // AuthStore must expose a changePassword(oldPassword, newPassword) action.
    const { changePassword, isLoading, error } = useAuthStore();

    const validate = (values) => {
        const errors = {};

        if (!values.oldPassword) {
            errors.oldPassword = "Current password is required.";
        }

        if (!values.newPassword) {
            errors.newPassword = "New password is required.";
        } else if (values.newPassword.length < 12) {
            errors.newPassword =
                "Password must contain at least 12 characters.";
        } else if (values.newPassword.length > 128) {
            errors.newPassword =
                "Password cannot exceed 128 characters.";
        } else if (
            !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])/.test(
                values.newPassword
            )
        ) {
            errors.newPassword =
                "Include uppercase and lowercase letters, a number, and a special character.";
        }

        if (!values.confirmNewPassword) {
            errors.confirmNewPassword =
                "Please confirm your new password.";
        } else if (
            values.newPassword !== values.confirmNewPassword
        ) {
            errors.confirmNewPassword = "Passwords do not match.";
        }

        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        const updatedValues = {
            ...formValues,
            [name]: value
        };

        setFormValues(updatedValues);
        setServerError("");
        setSuccessMessage("");

        // Do not show validation errors until the form has been submitted.
        if (hasSubmitted) {
            setFormErrors(validate(updatedValues));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        setHasSubmitted(true);
        setServerError("");
        setSuccessMessage("");

        const errors = validate(formValues);
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        if (typeof changePassword !== "function") {
            setServerError(
                "The change-password action is not available in AuthStore."
            );
            return;
        }

        try {
            await changePassword(
                formValues.oldPassword,
                formValues.newPassword
            );

            // Check the latest store error in case the action handles
            // request failures internally instead of throwing them.
            const latestError = useAuthStore.getState().error;

            if (latestError) {
                setServerError(
                    typeof latestError === "string"
                        ? latestError
                        : "Unable to change your password. Please try again."
                );
                return;
            }

            setSuccessMessage("Your password has been changed.");
            setFormValues(initialValues);
            setFormErrors({});
            setHasSubmitted(false);

            setShowOldPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err) {
            setServerError(
                err.response?.data?.message ||
                err.message ||
                "Unable to change your password. Please try again."
            );
        }
    };

    const inputClass =
        "w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-11 pr-12 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500";

    const errorClass = "mt-1 text-xs text-red-500";

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
        <div className="mb-5" key={name}>
            <label
                htmlFor={id}
                className="mb-2 block text-sm font-medium text-blue-950"
            >
                {label}
            </label>

            <div className="relative">
                <Icon
                    size={19}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                    id={id}
                    type={visible ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    autoComplete={
                        name === "oldPassword"
                            ? "current-password"
                            : "new-password"
                    }
                    maxLength={128}
                    aria-invalid={
                        hasSubmitted && Boolean(formErrors[name])
                    }
                    className={inputClass}
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
                    {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
            </div>

            {hasSubmitted && formErrors[name] && (
                <p className={errorClass}>{formErrors[name]}</p>
            )}
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 33 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex min-h-screen w-full items-center justify-center bg-gray-100 p-5"
        >
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)] sm:p-9">
                <h1 className="relative mb-8 text-center text-2xl font-bold text-blue-950 after:absolute after:-bottom-3 after:left-1/2 after:h-1 after:w-24 after:-translate-x-1/2 after:rounded-lg after:bg-amber-500">
                    Change Password
                </h1>

                <form onSubmit={handleSubmit} noValidate>
                    <fieldset disabled={isLoading} className="min-w-0">
                        {renderPasswordField({
                            id: "oldPassword",
                            name: "oldPassword",
                            label: "Current Password",
                            placeholder: "Enter your current password",
                            value: formValues.oldPassword,
                            visible: showOldPassword,
                            toggleVisibility: () =>
                                setShowOldPassword((previous) => !previous),
                            icon: Key
                        })}

                        {renderPasswordField({
                            id: "newPassword",
                            name: "newPassword",
                            label: "New Password",
                            placeholder: "Create a strong password",
                            value: formValues.newPassword,
                            visible: showNewPassword,
                            toggleVisibility: () =>
                                setShowNewPassword((previous) => !previous),
                            icon: LockKeyhole
                        })}

                        <p className="-mt-3 mb-4 text-xs leading-5 text-gray-500">
                            Use at least 12 characters with uppercase and
                            lowercase letters, a number, and a special
                            character.
                        </p>

                        {renderPasswordField({
                            id: "confirmNewPassword",
                            name: "confirmNewPassword",
                            label: "Confirm New Password",
                            placeholder: "Re-enter your new password",
                            value: formValues.confirmNewPassword,
                            visible: showConfirmPassword,
                            toggleVisibility: () =>
                                setShowConfirmPassword(
                                    (previous) => !previous
                                ),
                            icon: LockKeyhole
                        })}

                        {serverError && (
                            <p
                                role="alert"
                                className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
                            >
                                {serverError}
                            </p>
                        )}

                        {hasSubmitted && error && !serverError && (
                            <p
                                role="alert"
                                className="mb-4 text-sm text-red-500"
                            >
                                {typeof error === "string"
                                    ? error
                                    : "Unable to change your password. Please try again."}
                            </p>
                        )}

                        {successMessage && (
                            <p
                                role="status"
                                className="mb-4 flex items-center gap-2 text-sm text-green-700"
                            >
                                <CheckCircle size={18} />
                                {successMessage}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`mt-2 flex w-full items-center justify-center rounded-lg bg-blue-950 py-3 font-semibold text-white transition duration-300 ${
                                isLoading
                                    ? "cursor-not-allowed opacity-70"
                                    : "hover:bg-amber-500"
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader
                                        className="mr-2 animate-spin"
                                        size={20}
                                    />
                                    Changing Password...
                                </>
                            ) : (
                                "Change Password"
                            )}
                        </button>
                    </fieldset>
                </form>
            </div>
        </motion.div>
    );
};

export default ChangePassword;