import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";

function PlatformContact() {
  const { settings, loading } = usePlatformSettings();

  if (loading) return null;

  const email = settings.contact_email || "";
  const phone = settings.contact_phone || "";
  const location = settings.contact_location || "";

  if (!email && !phone && !location) return null;

  return (
    <section className="border-y border-border bg-card/40 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
        >
          Get in <span className="text-primary">touch</span>
        </motion.h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-muted-foreground sm:text-base">
          Reach out to the APEX platform for inquiries and collaboration.
        </p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12"
        >
          {email && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail size={18} className="text-primary" />
              <span>{email}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone size={18} className="text-primary" />
              <span>{phone}</span>
            </div>
          )}
          {location && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin size={18} className="text-primary" />
              <span>{location}</span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default PlatformContact;
