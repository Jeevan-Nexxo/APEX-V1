import { motion } from "framer-motion";
import { usePlatformSettings } from "../../context/PlatformSettingsContext";

const FALLBACK = "To become the leading innovation platform where students, researchers, organizations, and industries collaborate to transform innovative ideas into meaningful real-world impact.";

function Vision() {
  const { settings } = usePlatformSettings();
  const text = settings.our_vision || FALLBACK;

  return (
    <section className="border-y border-border bg-card/40 px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl text-center"
      >
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Our <span className="text-primary">vision</span>
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
          {text}
        </p>
      </motion.div>
    </section>
  );
}

export default Vision;
