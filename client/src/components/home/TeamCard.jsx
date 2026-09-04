import { motion } from "framer-motion";
import { Globe } from "lucide-react";

function SocialIcon({ href, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
    >
      <Globe size={14} />
    </a>
  );
}

function TeamCard({ image, name, role, qualification, email, phone, socialMedia }) {
  const social = socialMedia && typeof socialMedia === "object" ? socialMedia : {};
  const hasSocial = social.linkedin || social.github || social.twitter;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="max-w-sm rounded-2xl border border-border bg-card p-6 text-center transition-shadow duration-300 hover:shadow-sm"
    >
      <img src={image} alt={name} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-primary/10" />
      <h3 className="mt-5 text-lg font-semibold text-foreground">{name}</h3>
      <p className="mt-1 text-sm font-medium text-primary">{role}</p>
      {qualification && <p className="mt-4 text-sm text-muted-foreground">{qualification}</p>}
      {email && <p className="mt-2 text-sm text-muted-foreground">{email}</p>}
      {phone && <p className="mt-2 text-sm text-muted-foreground">{phone}</p>}
      {hasSocial && (
        <div className="mt-4 flex items-center justify-center gap-3">
          {social.linkedin && <SocialIcon href={social.linkedin} label="LinkedIn" />}
          {social.github && <SocialIcon href={social.github} label="GitHub" />}
          {social.twitter && <SocialIcon href={social.twitter} label="Twitter / X" />}
        </div>
      )}
    </motion.div>
  );
}

export default TeamCard;
