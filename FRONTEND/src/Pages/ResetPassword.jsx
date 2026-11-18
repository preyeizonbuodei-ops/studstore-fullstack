import { useState } from "react";
import Input from "../Components/Register/InputConponents";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/AuthStore";
import { motion } from "motion/react";
import {
    Lock,
    LockKeyholeOpen,
    Loader,
    Eye,
    EyeOff
} from "lucide-react";

const ResetPassword = () => {

    const initialValues = {
        password: "",
        confirmPassword: ""
    };

    const [formValues, setFormValues] = useState(initialValues);
    const [formErrors, SetFormErrors] = useState({});
    const { ResetPassword } = useAuthStore();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormValues({
            ...formValues,
            [name]: value
        });

        SetFormErrors({
            ...formErrors,
            [name]: ""
        });
    };

    const validate = (values) => {

        const errors = {};

        // Password validation
        if (!values.password) {
            errors.password = "Enter Password.";
        } else if (values.password.length < 12) {
            errors.password = "Password must contain at least 12 characters.";
        } else if (values.password.length > 128) {
            errors.password = "Password cannot exceed 128 characters.";
        } else if (
            !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])/.test(
                values.password
            )
        ) {
            errors.password =
                "Include uppercase and lowercase letters, a number, and a special character.";
        }

        // Confirm password validation
        if (!values.confirmPassword) {
            errors.confirmPassword = "Enter Confirm Password.";
        } else if (values.confirmPassword.length < 12) {
            errors.confirmPassword =
                "Confirm password must contain at least 12 characters.";
        } else if (values.confirmPassword.length > 128) {
            errors.confirmPassword =
                "Confirm password cannot exceed 128 characters.";
        } else if (
            !/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s])/.test(
                values.confirmPassword
            )
        ) {
            errors.confirmPassword =
                "Include uppercase and lowercase letters, a number, and a special character.";
        } else if (
            values.password &&
            values.password !== values.confirmPassword
        ) {
            errors.confirmPassword = "Passwords do not match.";
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validate(formValues);

        SetFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            return;
        }

        setIsLoading(true);

        try {

            const response = await ResetPassword(
                formValues.password,
                formValues.confirmPassword
            );

            if (response.success) {
                navigate("/login");
            } else {
                console.log("Invalid");
            }

        } catch (error) {
            console.log(error);

        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 33 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.88 }}
                className="w-full min-h-screen relative flex justify-center items-center"
            >
                <div className="shadow-[0_2px_20px_rgba(0,0,0,0.12)] w-90 rounded-lg bg-white">

                    <div className="text-center mt-5 mb-5">
                        <h1 className="text-[29px] text-blue-950 font-bold text-center">
                            Reset Password
                        </h1>
                    </div>

                    <div className="ml-5 mr-5">

                        <form onSubmit={handleSubmit} className="bg-white">

                            {/* Password Field */}
                            <div className="relative">
                                <Input
                                    inputLabel="Password"
                                    icon={Lock}
                                    placeholder="Enter Password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formValues.password}
                                    onChange={handleChange}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-[38px] text-gray-500 hover:text-blue-950 cursor-pointer z-10"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>

                            <p className="text-red-500 text-[12px]">
                                {formErrors.password}
                            </p>

                            {/* Confirm Password Field */}
                            <div className="relative">
                                <Input
                                    inputLabel="Confirm Password"
                                    icon={LockKeyholeOpen}
                                    placeholder="Enter confirm password"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formValues.confirmPassword}
                                    onChange={handleChange}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-[38px] text-gray-500 hover:text-blue-950 cursor-pointer z-10"
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>

                            <p className="text-red-500 text-[12px]">
                                {formErrors.confirmPassword}
                            </p>

                            {/* Password Requirements */}
                            <p className="text-gray-500 text-[11px] mb-4">
                                Password must be 12–128 characters and contain uppercase and lowercase letters, a number, and a special character.
                            </p>

                            {/* Submit Button */}
                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={isLoading ? undefined : { scale: 1.02 }}
                                className={`w-full py-3 rounded-lg mb-9 font-semibold transition-all duration-200 bg-blue-950 text-white ${
                                    isLoading
                                        ? "cursor-not-allowed opacity-70"
                                        : "cursor-pointer hover:bg-amber-500 hover:scale-[1.02] hover:shadow-lg"
                                }`}
                            >

                                {isLoading ? (
                                    <>
                                        <Loader
                                            className="animate-spin inline-block mr-2"
                                            size={20}
                                        />
                                        Resetting Password...
                                    </>
                                ) : (
                                    "Submit"
                                )}

                            </motion.button>

                        </form>

                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default ResetPassword;