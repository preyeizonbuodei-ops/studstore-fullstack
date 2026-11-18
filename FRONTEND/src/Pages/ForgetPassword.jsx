
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../Store/AuthStore";
import { Loader } from "lucide-react";

const ForgetPasswordVerification = () => {

    const initialValues = ["", "", "", "", "", ""];

    const [isLoading, setIsLoading] = useState(false);
    const [code, setCode] = useState(initialValues);

    const inputRefs = useRef([]);
    const navigate = useNavigate();

    const { VerifyForgetPasswordCode } = useAuthStore();

    const KeyChange = (index, value) => {
        const digit = value.replace(/\D/g, "").slice(-1);

        const newCode = [...code];
        newCode[index] = digit;

        setCode(newCode);

        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedCode = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedCode) return;

        const newCode = ["", "", "", "", "", ""];

        pastedCode.split("").forEach((digit, index) => {
            newCode[index] = digit;
        });

        setCode(newCode);

        const pastedIndex = Math.min(pastedCode.length, 6) - 1;

        if (pastedIndex >= 0) {
            inputRefs.current[pastedIndex]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {

        if (e.key === "Backspace") {
            e.preventDefault();

            const newCode = [...code];

            if (code[index]) {
                newCode[index] = "";
                setCode(newCode);
                return;
            }

            if (index > 0) {
                newCode[index - 1] = "";
                setCode(newCode);
                inputRefs.current[index - 1]?.focus();
            }
        }

        if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        if (e.key === "ArrowRight" && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!code.every((digit) => digit !== "")) {
            return;
        }

        const providedCodeValue = code.join("");

        // START LOADING
        setIsLoading(true);

        try {

            const response = await VerifyForgetPasswordCode(providedCodeValue);

            console.log("Verification response:", response);

            if (response.success) {
                navigate("/reset-password");
            } else {
                console.log("Invalid verification code");
            }

        } catch (error) {
            console.log(error);

        } finally {

            // STOP LOADING WHETHER SUCCESSFUL OR NOT
            setIsLoading(false);

        }
    };

    return (
        <>
            <div className="w-full min-h-screen relative flex justify-center items-center">

                <div className="w-170 min-h-69 bg-blue-950 rounded-lg">

                    <h1 className="text-[29px] relative mt-5 text-white mb-6 text-center font-bold after:absolute after:-bottom-2 after:left-50 rounded-lg after:h-[2px] after:w-40 after:bg-blue-950">
                        Verify Forget Password
                    </h1>

                    <p className="text-white font-bold mt-4 text-center">
                        A 6 digit verification code has been sent to your email. Put the code below.
                    </p>

                    <div className="flex justify-center gap-4">

                        <form onSubmit={handleSubmit}>

                            <div className="flex justify-center gap-5">

                                {code.map((digit, index) => (
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        ref={(element) => (
                                            inputRefs.current[index] = element
                                        )}
                                        onChange={(e) =>
                                            KeyChange(index, e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyDown(index, e)
                                        }
                                        onPaste={handlePaste}
                                        key={index}
                                        value={digit}
                                        maxLength={1}
                                        disabled={isLoading}
                                        className="w-12 h-12 text-white border border-amber-500 font-bold text-[29px] text-center rounded-lg mt-9"
                                    />
                                ))}

                            </div>

                            <div className="flex justify-center">

                                <button
                                    type="submit"
                                    className="text-center w-80 text-white font-bold py-2 bg-amber-500 rounded-lg mt-9 hover:bg-amber-600 mb-6 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                    disabled={isLoading}
                                >

                                    {isLoading ? (
                                        <>
                                            <Loader
                                                className="animate-spin inline-block mr-2"
                                                size={20}
                                            />
                                            Verifying...
                                        </>
                                    ) : (
                                        "Verify"
                                    )}

                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </div>
        </>
    );
};

export default ForgetPasswordVerification;
