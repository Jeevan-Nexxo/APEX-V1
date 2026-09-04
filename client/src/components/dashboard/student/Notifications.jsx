import { motion } from "framer-motion";

function Notifications({ notifications }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-2xl border border-border bg-card p-6"
    >
      <h2 className="mb-5 text-lg font-semibold text-foreground">Notifications</h2>
      <div className="space-y-4">
        {notifications.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
            className="rounded-xl border border-border bg-background px-4 py-3"
          >
            <p className="font-medium text-foreground">{item.title || item}</p>
            {item.message ? <p className="mt-1 text-sm text-muted-foreground">{item.message}</p> : null}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default Notifications;
