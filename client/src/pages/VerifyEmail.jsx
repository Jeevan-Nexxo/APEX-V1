import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { verifyEmail, resendOtp } from "../services/authServices";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const email = searchParams.get("email") || "";

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP code.");
      return;
    }
    setLoading(true);
    verifyEmail(otp)
      .then(() => setVerified(true))
      .catch((error) => toast.error(error.response?.data?.message || error.message || "Invalid or expired code."))
      .finally(() => setLoading(false));
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email address not found. Please go back to registration.");
      return;
    }
    setResending(true);
    try {
      await resendOtp(email);
      toast.success("A new OTP code has been sent to your email.");
      startCountdown();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm"
      >
        <h1 className="text-3xl font-bold text-foreground">Verify Your <span className="text-primary">Email</span></h1>
        {verified ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-green-500">Email verified successfully.</p>
            <Link to="/login" className="block w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground text-center hover:opacity-90 transition">
              Continue to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit verification code to <span className="font-medium text-foreground">{email || "your email"}</span>.
            </p>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              inputMode="numeric"
              autoFocus
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              required
            />
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
              {loading ? "Verifying..." : "Verify email"}
            </button>
            <div className="text-sm text-muted-foreground">
              Didn't receive the code?{" "}
              {countdown > 0 ? (
                <span className="font-medium text-foreground">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend OTP"}
                </button>
              )}
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}

export default VerifyEmail;
