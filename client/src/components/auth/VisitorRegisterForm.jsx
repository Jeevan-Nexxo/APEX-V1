import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import API_URL from "../../config/api";
import { motion } from "framer-motion";
import { Eye, EyeOff, Upload, Check, ChevronLeft } from "lucide-react";

function VisitorRegisterForm({ onBack }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    mobile: "",
    organization: "",
    purpose: "",
    role: "visitor",
    identity_proof: null,
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 350 * 1024) {
      toast.error("Identity proof must be less than 350 KB.");
      e.target.value = "";
      return;
    }
    if (!["pdf", "jpg", "jpeg", "png"].includes(file.name.split(".").pop().toLowerCase())) {
      toast.error("Only PDF, JPG, or PNG files are accepted.");
      e.target.value = "";
      return;
    }
    setFormData({ ...formData, identity_proof: file });
  };

  const validateStep1 = () => {
    if (!formData.full_name.trim()) { toast.error("Full name is required."); return false; }
    if (!formData.mobile.trim()) { toast.error("Mobile number is required."); return false; }
    if (formData.mobile.replace(/\D/g, "").length < 10) { toast.error("Enter a valid mobile number."); return false; }
    if (!formData.purpose) { toast.error("Purpose of joining is required."); return false; }
    if (!formData.identity_proof) { toast.error("Identity proof is required."); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.email.trim()) { toast.error("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { toast.error("Enter a valid email address."); return false; }
    if (!formData.password) { toast.error("Password is required."); return false; }
    if (formData.password.length < 8) { toast.error("Password must be at least 8 characters."); return false; }
    if (!/[A-Z]/.test(formData.password)) { toast.error("Password must include an uppercase letter."); return false; }
    if (!/[a-z]/.test(formData.password)) { toast.error("Password must include a lowercase letter."); return false; }
    if (!/[0-9]/.test(formData.password)) { toast.error("Password must include a number."); return false; }
    if (formData.password !== formData.confirmPassword) { toast.error("Passwords do not match."); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) { setStep(2); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const handleBack = () => {
    if (step === 1) onBack();
    else { setStep(step - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) { handleNext(); return; }
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append("full_name", formData.full_name);
      form.append("email", formData.email.toLowerCase().trim());
      form.append("password", formData.password);
      form.append("role", formData.role);
      form.append("phone", formData.mobile);
      form.append("mobile", formData.mobile);
      form.append("organization", formData.organization);
      form.append("purpose", formData.purpose);
      if (formData.identity_proof) form.append("identity_proof", formData.identity_proof);

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (response.ok) {
        navigate(`/verify-email?email=${encodeURIComponent(formData.email.toLowerCase().trim())}`, { replace: true });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/30";
  const passwordWrap = "relative";
  const passwordInputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 text-foreground outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl border border-border bg-card p-8"
    >
      <button onClick={handleBack} className="text-primary hover:opacity-80 mb-6 text-sm font-medium inline-flex items-center gap-1">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <h2 className="text-3xl font-bold text-foreground text-center">Visitor <span className="text-primary">Registration</span></h2>

      {step === 1 && (
        <p className="mt-2 text-center text-sm text-muted-foreground">Step 1 of 3 — General Details</p>
      )}
      {step === 2 && (
        <p className="mt-2 text-center text-sm text-muted-foreground">Step 2 of 3 — Login Credentials</p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {step === 1 && (
          <>
            <input type="text" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={handleChange} className={inputClass} required />
            <input type="tel" name="mobile" placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className={inputClass} required />
            <input type="text" name="organization" placeholder="Organization (Optional)" value={formData.organization} onChange={handleChange} className={inputClass} />
            <select name="purpose" value={formData.purpose} onChange={handleChange} className={inputClass} required>
              <option value="">Purpose of Joining</option>
              <option value="Research">Research</option>
              <option value="Investment">Investment</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Industry">Industry</option>
              <option value="Other">Other</option>
            </select>
            <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-5 text-center">
              <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Identity Proof</p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, or PNG — max 350 KB</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFile}
                className="mt-3 w-full cursor-pointer rounded-xl border border-border bg-background px-4 py-2 text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              />
              {formData.identity_proof && (
                <p className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  <Check className="h-4 w-4" /> {formData.identity_proof.name}
                </p>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className={inputClass} required />
            <div className={passwordWrap}>
              <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className={passwordInputClass} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className={passwordWrap}>
              <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className={passwordInputClass} required />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle confirm password visibility">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Password must be at least 8 characters with uppercase, lowercase, and a number. You will verify your email with a one-time code in the next step.</p>
          </>
        )}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
          {loading ? "Creating account..." : step === 1 ? "Continue" : "Create Account"}
        </button>
      </form>
    </motion.div>
  );
}

export default VisitorRegisterForm;
