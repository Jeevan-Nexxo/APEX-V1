import { motion } from "framer-motion";
import HeroSearch from "./HeroSearch";
import HeroTitle from "./HeroTitle";

function Hero() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto flex min-h-[78vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full text-center"
        >
          <HeroTitle />
          <HeroSearch />
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
