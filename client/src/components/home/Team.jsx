import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import api from "../../services/api";
import TeamCard from "./TeamCard";

function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await api.get("/public/team-home");
        setTeam(response.data.team || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, []);

  if (loading) {
    return (
      <section className="bg-background px-6 py-24">
        <div className="mx-auto max-w-7xl text-center">
          <div className="text-sm text-muted-foreground">Loading team...</div>
        </div>
      </section>
    );
  }

  if (team.length === 0) {
    return null;
  }

  return (
    <section className="bg-background px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          The people behind <span className="text-primary">APEX</span>
        </motion.h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">A small team focused on building a serious product for student innovation.</p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-wrap justify-center gap-6"
        >
          {team.map((member) => (
            <TeamCard
              key={member.id}
              image={member.photo_url || "https://placehold.co/300x300"}
              name={member.name}
              role={member.role}
              qualification={member.qualification}
              email={member.email}
              phone={member.phone}
              socialMedia={member.social_media}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Team;
