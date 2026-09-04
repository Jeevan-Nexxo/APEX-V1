import { motion } from "framer-motion";

function AccountTypeCard({ icon, title, description1, description2, description3, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/50 hover:shadow-sm"
    >
      <div className="text-center text-5xl">{icon}</div>
      <h2 className="mt-6 text-center text-2xl font-semibold text-foreground">{title}</h2>
      <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
        <p>{description1}</p>
        <p>{description2}</p>
        <p>{description3}</p>
      </div>
      <button className="mt-8 w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground transition-colors hover:opacity-90">
        Continue →
      </button>
    </motion.div>
  );
}

export default AccountTypeCard;
