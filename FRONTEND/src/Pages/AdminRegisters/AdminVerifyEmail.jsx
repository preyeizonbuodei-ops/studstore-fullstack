
import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoaderCircle, Mail, ShieldCheck } from "lucide-react";
import { AdminRegister } from "../../Store/AdminStore";

const AdminVerifyEmail = () => {
  const initialValue = ["", "", "", "", "", ""];
  const [code, setCode] = useState(initialValue);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRefs = useRef([]);

  const location = useLocation();
  const email = location.state?.email;
  const navigate = useNavigate();

  const { verifyEmailSent } = AdminRegister();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isVerifying) return;

    if (!code.every((digit) => digit !== "")) {
      setErrorMessage("Please enter all 6 digits of your verification code.");
      return;
    }

    if (!email) {
      setErrorMessage(
        "Your email address is missing. Please register again to continue."
      );
      return;
    }

    const sentCode = code.join("");

    setErrorMessage("");
    setIsVerifying(true);

    try {
      await verifyEmailSent(email, sentCode);
      navigate("/admin-login", { replace: true });
    } catch (error) {
      setErrorMessage(
        "Verification failed. Please check your code and try again."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyChange = (index, value) => {
    if (isVerifying) return;

    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];

    newCode[index] = digit;
    setCode(newCode);
    setErrorMessage("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    if (isVerifying) return;

    e.preventDefault();

    const pastedCode = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!pastedCode) return;

    const newCode = [...initialValue];

    pastedCode.split("").forEach((digit, index) => {
      newCode[index] = digit;
    });

    setCode(newCode);
    setErrorMessage("");

    const pastedIndex = Math.min(pastedCode.length, 6) - 1;

    if (pastedIndex >= 0) {
      inputRefs.current[pastedIndex]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (isVerifying) return;

    if (e.key === "Backspace") {
      e.preventDefault();

      const newCode = [...code];

      if (code[index]) {
        newCode[index] = "";
        setCode(newCode);
        setErrorMessage("");
        return;
      }

      if (index > 0) {
        newCode[index - 1] = "";
        setCode(newCode);
        setErrorMessage("");
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
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-blue-950 px-5 py-8 shadow-xl sm:px-10 sm:py-10">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/10">
          <ShieldCheck
            size={30}
            className="text-amber-400"
            aria-hidden="true"
          />
        </div>

        <h1 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Verify Your Account
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-6 text-slate-200 sm:text-base">
          A 6-digit verification code has been sent to your email. Enter the
          code below to verify your account.
        </p>

        {email && (
          <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-amber-300 sm:text-sm">
            <Mail size={16} className="shrink-0" />
            <span className="break-all">{email}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7">
          <fieldset disabled={isVerifying} className="min-w-0">
            <div className="flex justify-center gap-2 sm:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  aria-label={`Verification digit ${index + 1}`}
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleKeyChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-11 min-w-0 w-full max-w-12 rounded-lg border border-amber-500 bg-white/10 text-center text-xl font-bold text-white outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-400/40 disabled:cursor-not-allowed disabled:opacity-60 sm:h-14 sm:text-2xl"
                />
              ))}
            </div>
          </fieldset>

          {errorMessage && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-300/30 bg-red-500/10 px-3 py-2 text-center text-sm text-red-200"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isVerifying || !code.every((digit) => digit !== "")}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 sm:mx-auto sm:max-w-xs"
          >
            {isVerifying ? (
              <>
                <LoaderCircle
                  size={20}
                  className="animate-spin"
                  aria-hidden="true"
                />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-slate-300 sm:text-sm">
          Please keep this page open while your code is being verified.
        </p>
      </div>
    </div>
  );
};

export default AdminVerifyEmail;
