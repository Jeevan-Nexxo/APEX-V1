import { useEffect, useState } from "react";
import api from "../../services/api";
import Loader from "../../components/ui/Loader";
import EmptyState from "../../components/ui/EmptyState";

function Team() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/manager/team")
      .then((response) => setTeam(response.data.team || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Team</h1>
        <p className="mt-2 text-sm text-muted-foreground">Students currently associated with projects.</p>
      </div>

      {team.length === 0 ? (
        <EmptyState icon="👥" title="No team members" description="No students are currently associated with projects." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {team.map((member) => (
            <div key={`${member.id}-${member.project_title}`} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground">{member.full_name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>
              <p className="mt-4 text-xs text-muted-foreground">Project: {member.project_title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Team;
