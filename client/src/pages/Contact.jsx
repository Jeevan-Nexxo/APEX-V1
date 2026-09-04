import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import api from "../services/api";

function Contact() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsRes, teamRes] = await Promise.all([
          api.get("/public/platform-settings"),
          api.get("/public/team"),
        ]);
        setSettings(settingsRes.data.settings || {});
        setTeam(teamRes.data.team || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const email = settings.contact_email || "";
  const phone = settings.contact_phone || "";
  const location = settings.contact_location || "";

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Contact</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Reach out to the APEX platform or get to know the people behind it.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-8"
      >
        <h2 className="text-xl font-semibold text-foreground">Platform Contact</h2>
        <p className="mt-2 text-sm text-muted-foreground">Reach us through any of the following channels.</p>

        {loading ? (
          <div className="mt-6 text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:gap-8">
            {email && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <Mail size={18} className="shrink-0 text-primary" />
                <span>{email}</span>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <Phone size={18} className="shrink-0 text-primary" />
                <span>{phone}</span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <MapPin size={18} className="shrink-0 text-primary" />
                <span>{location}</span>
              </div>
            )}
            {!email && !phone && !location && (
              <p className="text-sm text-muted-foreground">No platform contact information available.</p>
            )}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-foreground">Minds Behind APEX</h2>
        <p className="mt-2 mb-6 text-sm text-muted-foreground">The team driving the platform forward.</p>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : team.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">No team members to display yet.</p>
          </div>
        ) : (
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
                    src={member.photo_url || "https://placehold.co/300x300"}
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
        )}
      </motion.div>
    </div>
  );
}

export default Contact;
