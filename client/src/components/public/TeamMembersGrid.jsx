import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import api from "../../services/api";
import { imageUrl } from "../../config/api";

function TeamMembersGrid() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const response = await api.get("/public/team");
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
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (team.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card py-12 text-center">
        <p className="text-sm text-muted-foreground">No team members to display yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {team.map((member) => {
        const social = member.social_media && typeof member.social_media === "object" ? member.social_media : {};
        const hasSocial = social.linkedin || social.github || social.twitter;

        return (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-border bg-card p-6 text-center transition-shadow duration-300 hover:shadow-sm"
          >
            <img
              src={imageUrl(member.photo_url) || "https://placehold.co/300x300"}
              alt={member.name}
              className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-primary/10"
            />
            <h3 className="mt-5 text-lg font-semibold text-foreground">{member.name}</h3>
            <p className="mt-1 text-sm font-medium text-primary">{member.role}</p>
            {member.qualification && (
              <p className="mt-3 text-sm text-muted-foreground">{member.qualification}</p>
            )}
            {member.email && (
              <p className="mt-2 text-sm text-muted-foreground">{member.email}</p>
            )}
            {member.phone && (
              <p className="mt-2 text-sm text-muted-foreground">{member.phone}</p>
            )}
            {hasSocial && (
              <div className="mt-4 flex items-center justify-center gap-3">
                {social.linkedin && (
                  <a href={social.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:bg-accent">
                    <Globe size={14} />
                  </a>
                )}
                {social.github && (
                  <a href={social.github} target="_blank" rel="noopener noreferrer" title="GitHub" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:bg-accent">
                    <Globe size={14} />
                  </a>
                )}
                {social.twitter && (
                  <a href={social.twitter} target="_blank" rel="noopener noreferrer" title="Twitter / X" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:bg-accent">
                    <Globe size={14} />
                  </a>
                )}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

export default TeamMembersGrid;
