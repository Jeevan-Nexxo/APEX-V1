import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import TeamCard from "../components/home/TeamCard";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: "easeOut" },
  }),
};

function About() {
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeUp}
        className="space-y-4 rounded-2xl border border-border bg-card p-8"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">About APEX</h1>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          APEX is a student innovation platform for building, submitting, reviewing, and sharing projects with clear roles for students, visitors, managers, and admins.
        </p>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">
          The V1 focus is a coherent local product: real authentication, real approvals, reusable UI, and a database that can scale.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeUp}
        custom={1}
        className="rounded-2xl border border-border bg-card p-8"
      >
        <h2 className="text-lg font-semibold text-foreground">Product goals</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">&bull;</span>
            Publish approved innovation projects
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">&bull;</span>
            Support student teams and ownership
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">&bull;</span>
            Give admins real moderation tools
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-primary">&bull;</span>
            Keep the UI simple and consistent
          </li>
        </ul>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeUp}
        custom={2}
        className="rounded-2xl border border-border bg-card p-8"
      >
        <h2 className="text-lg font-semibold text-foreground">How it works</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">1</div>
            <h3 className="text-sm font-medium text-foreground">Create &amp; Submit</h3>
            <p className="text-xs leading-6 text-muted-foreground">Students build profiles, submit projects with categories, technologies, and team members.</p>
          </div>
          <div className="space-y-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">2</div>
            <h3 className="text-sm font-medium text-foreground">Review &amp; Approve</h3>
            <p className="text-xs leading-6 text-muted-foreground">Admins review submissions, provide feedback, and approve qualified projects for public listing.</p>
          </div>
          <div className="space-y-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">3</div>
            <h3 className="text-sm font-medium text-foreground">Discover &amp; Connect</h3>
            <p className="text-xs leading-6 text-muted-foreground">Visitors browse approved innovations and reach out to student teams through contact requests.</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={fadeUp}
        custom={3}
        className="rounded-2xl border border-border bg-card p-8"
      >
        <h2 className="text-lg font-semibold text-foreground">Technology</h2>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          APEX V1 is built with React, Node.js, Express, and PostgreSQL &mdash; a modern, maintainable stack designed for clarity and long-term growth.
        </p>
      </motion.div>

      {!loading && team.length > 0 && (
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={fadeUp}
          custom={4}
          className="space-y-6"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">The people behind <span className="text-primary">APEX</span></h2>
          <p className="text-sm text-muted-foreground sm:text-base">Our full team driving the platform forward.</p>
          <div className="flex flex-wrap gap-6">
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
          </div>
        </motion.section>
      )}
    </div>
  );
}

export default About;
