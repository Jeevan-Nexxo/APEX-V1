import { useState } from "react";
import { motion } from "framer-motion";
import AccountTypeCard from "../components/auth/AccountTypeCard";
import StudentRegisterForm from "../components/auth/StudentRegisterForm";
import VisitorRegisterForm from "../components/auth/VisitorRegisterForm";

function Register() {
  const [accountType, setAccountType] = useState("");

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      {accountType === "" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-6xl">
          <h1 className="text-center text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Create your <span className="text-primary">account</span>
          </h1>
          <p className="mt-4 text-center text-sm text-muted-foreground sm:text-base">Choose the account type that best describes you.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <AccountTypeCard icon="🎓" title="Student" description1="Share innovative projects" description2="Collaborate with students" description3="Build your portfolio" onClick={() => setAccountType("student")} />
            <AccountTypeCard icon="👀" title="Visitor" description1="Explore student innovations" description2="Request project contacts" description3="Discover new ideas" onClick={() => setAccountType("visitor")} />
          </div>
        </motion.div>
      )}
      {accountType === "student" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto w-full max-w-xl">
          <StudentRegisterForm onBack={() => setAccountType("")} />
        </motion.div>
      )}
      {accountType === "visitor" && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto w-full max-w-xl">
          <VisitorRegisterForm onBack={() => setAccountType("")} />
        </motion.div>
      )}
    </div>
  );
}

export default Register;
