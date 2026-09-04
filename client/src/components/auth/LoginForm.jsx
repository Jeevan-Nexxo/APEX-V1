import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { loginUser } from "../../services/authServices";

function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginUser(formData.email, formData.password);
      login(data.token, data.user);

      const role = data.user.role;
      if (role === "student") navigate("/student/dashboard");
      else if (role === "visitor") navigate("/visitor/dashboard");
      else if (role === "manager") navigate("/manager/dashboard");
      else if (role === "admin") navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-foreground">Email Address</label>
        <input type="email" name="email" placeholder="Enter your email" value={formData.email} onChange={handleChange}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" required />
      </div>
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="text-right mb-4">
        <Link to="/forgot-password" className="text-sm text-muted-foreground transition hover:text-foreground">Forgot Password?</Link>
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50">
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}

export default LoginForm;
