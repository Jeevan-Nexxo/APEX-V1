import { motion } from "framer-motion";

function StatsCards({ stats }) {
  const cards = [
    { title: "Projects", value: stats.projects, icon: "📂" },
    { title: "Approved", value: stats.approvedProjects, icon: "✅" },
    { title: "Bookmarks", value: stats.bookmarks, icon: "🔖" },
    { title: "Unread", value: stats.unreadNotifications, icon: "🔔" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.1 }}
          whileHover={{ y: -4, scale: 1.02 }}
          className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/50"
        >
          <div className="text-4xl">{card.icon}</div>
          <h2 className="mt-5 text-sm text-muted-foreground">{card.title}</h2>
          <p className="mt-2 text-3xl font-semibold text-foreground">{card.value ?? 0}</p>
        </motion.div>
      ))}
    </div>
  );
}

export default StatsCards;
