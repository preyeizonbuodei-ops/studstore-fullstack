
import { useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "../Store/AuthStore";


const VerifyEmail = () => {

    const initialValue = [ "", "", "", "", "", "" ];
    const [ code, setCode ] = useState(initialValue);
    const inputRefs = useRef([]);
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const email = location.state?.email;
    const navigate = useNavigate();
    const { verifyEmailSent, ResendVerificationCode } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!code.every((digit) => digit !== "")) {
            return;
        }

        const verificationCode = code.join("");

        try {
            setLoading(true);

            const response = await verifyEmailSent(email, verificationCode);

            if (response.success) {
            navigate("/me");
            } else {
            console.log("Invalid email");
            }
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
        };


    const handleResendVerificationCode = async (e) => {
        try {
            setLoading(false);

            alert("Resend fucntion reached")
            const response = await ResendVerificationCode;

            if(response.success) {
                alert("Verification Code Sent")
                navigate('/me');

            } else{
                console.log("Verification Code Resend Failed, please check your internet connection")
            }

        } catch (error) {
            console.log(error)
        }
    }

    const handleKeyChange = (index, value) => {

       const digit = value.slice(-1);

       const newCode = [...code];

       newCode[index] = digit;

       setCode(newCode);

       if(digit && index < 5) {
        inputRefs.current[index +1]?.focus();
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

  
return (
    <>
        <div className="w-full min-h-screen flex justify-center items-center px-4 py-8">
            <div className="bg-blue-950 w-full max-w-2xl min-h-80 rounded-lg px-4 sm:px-8 py-6">
                <h1 className="font-bold text-2xl sm:text-[29px] text-white text-center mt-2">
                    Verify Your Account
                </h1>

                <p className="text-white font-bold mt-4 text-center text-sm sm:text-base">
                    A 6 digit verification code has been sent to your email. put the code below
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-2 sm:gap-5 flex-wrap">
                        {code.map((digit, index) => (
                            <input
                                onChange={(e) => handleKeyChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                key={index}
                                value={digit}
                                maxLength={1}
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                className="w-10 h-10 sm:w-12 sm:h-12 text-white border border-amber-500 font-bold text-xl sm:text-[29px] text-center rounded-lg mt-6"
                            />
                        ))}
                    </div>

                    <div className="flex justify-center mt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full max-w-xs text-center text-white font-bold py-2 bg-amber-500 rounded-lg hover:bg-amber-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? "Verifying..." : "Verify"}
                        </button>
                    </div>

                    <div className="flex justify-evenly items-center mt-4 text-white">
                        <div>
                            <h4>Didn't recieve code?</h4>
                        </div>

                        <div onClick={handleResendVerificationCode}>
                            <button className="hover:cursor-pointer text-blue-400">Resend Code</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </>
);

}

export default VerifyEmail