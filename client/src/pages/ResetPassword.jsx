import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../services/authServices";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords do not match."); return; }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Password must be 8+ characters with uppercase, lowercase, and a number.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      toast.success("Password reset successfully. Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-11 w-full rounded-xl border border-border bg-background px-4 pr-12 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="mx-auto flex max-w-md items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full space-y-4 rounded-2xl border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold text-foreground">Reset password</h1>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            className={inputClass}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            className={inputClass}
            required
          />
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle confirm password visibility">
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button type="submit" disabled={loading || !token} className="h-11 w-full rounded-xl bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50">
          {loading ? "Resetting..." : "Reset password"}
        </button>
        <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-foreground">
          Back to login
        </Link>
      </form>
    </div>
  );
}

export default ResetPassword;
