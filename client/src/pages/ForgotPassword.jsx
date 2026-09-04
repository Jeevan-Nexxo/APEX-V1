import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { forgotPassword } from "../services/authServices";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    forgotPassword(email)
      .then(() => setSent(true))
      .catch((error) => toast.error(error.message || "Something went wrong."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-md items-center justify-center px-4 py-12">
      <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-center">Forgot Password</h1>
        <p className="text-center text-sm text-muted-foreground mt-2">Enter your email to receive a reset link.</p>

        {sent ? (
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-green-500">If the email exists, a reset link has been sent to {email}</p>
            <Link to="/login" className="block mt-4 text-sm text-muted-foreground hover:text-foreground transition">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8">
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-foreground">Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <Link to="/login" className="block text-center mt-4 text-sm text-muted-foreground hover:text-foreground transition">
              ← Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
