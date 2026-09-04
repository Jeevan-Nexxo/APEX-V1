import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createProject, updateProject } from "../../services/projectService";
import api from "../../services/api";

function ProjectForm({ editMode = false, projectData = null }) {
  const [project, setProject] = useState({
    title: "", categories: [], problem_statement: "", solution: "",
    description: "", abstract: "", technologies: "", github_link: "", demo_link: "", tags: "", team_members: "",
  });
  const [categoryList, setCategoryList] = useState([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategoryList((response.data.categories || []).map((c) => c.name));
      } catch (error) {
        console.error(error);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (editMode && projectData) {
      setProject({
        title: projectData.title || "",
        categories: Array.isArray(projectData.categories) ? projectData.categories.map((item) => item.name) : [],
        problem_statement: projectData.problem_statement || "",
        solution: projectData.solution || "",
        description: projectData.description || "",
        abstract: projectData.abstract || "",
        technologies: Array.isArray(projectData.technologies) ? projectData.technologies.join(", ") : projectData.technologies || "",
        github_link: projectData.github_link || "",
        demo_link: projectData.demo_link || "",
        tags: Array.isArray(projectData.tags) ? projectData.tags.join(", ") : projectData.tags || "",
        team_members: Array.isArray(projectData.members)
          ? projectData.members.filter((member) => !member.is_primary).map((member) => member.email).join(", ")
          : "",
      });
    }
  }, [editMode, projectData]);

  const handleChange = (e) => setProject({ ...project, [e.target.name]: e.target.value });

  const toggleCategory = (category) => {
    if (project.categories.includes(category)) {
      setProject({ ...project, categories: project.categories.filter((c) => c !== category) });
    } else {
      setProject({ ...project, categories: [...project.categories, category] });
    }
  };

  const handleSaveDraft = async () => {
    if (!project.title.trim()) { toast.error("Project Title is required for a draft."); return; }
    try {
      const payload = {
        title: project.title,
        categories: project.categories.length > 0 ? project.categories : ["General"],
        problem_statement: project.problem_statement || null,
        solution: project.solution || null,
        description: project.description || null,
        abstract: project.abstract || null,
        technologies: project.technologies ? project.technologies.split(",").map((t) => t.trim()).filter(Boolean) : [],
        github_link: project.github_link || null,
        demo_link: project.demo_link || null,
        tags: project.tags ? project.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        team_members: project.team_members ? project.team_members.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: "draft",
      };

      const data = editMode ? await updateProject(projectData.id, payload) : await createProject(payload);

      if (data.success) {
        toast.success("Draft saved successfully.");
        if (!editMode && data.project) {
          setProject({
            title: project.title, categories: project.categories,
            problem_statement: project.problem_statement, solution: project.solution,
            description: project.description, abstract: project.abstract,
            technologies: project.technologies, github_link: project.github_link,
            demo_link: project.demo_link, tags: project.tags, team_members: project.team_members,
          });
        }
      } else {
        toast.error(data.message || "Unable to save draft.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  const handleSubmit = async () => {
    if (!project.title.trim()) { toast.error("Project Title is required."); return; }
    if (project.categories.length === 0) { toast.error("Select at least one category."); return; }

    try {
      const payload = {
        title: project.title,
        categories: project.categories,
        problem_statement: project.problem_statement || null,
        solution: project.solution || null,
        description: project.description || null,
        abstract: project.abstract || null,
        technologies: project.technologies ? project.technologies.split(",").map((t) => t.trim()).filter(Boolean) : [],
        github_link: project.github_link || null,
        demo_link: project.demo_link || null,
        tags: project.tags ? project.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        team_members: project.team_members ? project.team_members.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      const data = editMode ? await updateProject(projectData.id, payload) : await createProject(payload);

      if (data.success) {
        toast.success(editMode ? "✅ Project Updated Successfully!" : "🎉 Project Submitted Successfully!");
        if (!editMode) {
          setProject({
            title: "", categories: [], problem_statement: "", solution: "", description: "",
            abstract: "", technologies: "", github_link: "", demo_link: "", tags: "", team_members: "",
          });
        }
      } else {
        toast.error(data.message || "Unable to save project.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to connect to server.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-8 shadow-sm"
    >
      <h2 className="mb-8 text-2xl font-semibold text-foreground">Project details</h2>

      <div className="mb-8">
        <label className="mb-2 block font-medium text-foreground">Project title <span className="text-destructive">*</span></label>
        <input type="text" name="title" value={project.title} onChange={handleChange} placeholder="Enter your project title"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="mb-8">
        <label className="mb-3 block font-medium text-foreground">Categories <span className="text-destructive">*</span></label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categoryList.map((category) => {
            const selected = project.categories.includes(category);
            return (
              <button key={category} type="button" onClick={() => toggleCategory(category)}
                className={`rounded-xl px-4 py-3 border transition-all duration-200 ${
                  selected ? "bg-primary text-primary-foreground border-primary font-semibold" : "bg-background text-foreground border-border hover:border-primary/50"
                }`}>{category}</button>
            );
          })}
        </div>
      </div>

      {["problem_statement", "solution", "abstract"].map((field) => (
        <div key={field} className="mb-8">
          <label className="mb-2 block font-medium capitalize text-foreground">{field.replace("_", " ")}</label>
          <textarea rows="4" name={field} value={project[field]} onChange={handleChange}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
      ))}

      <div className="mb-8">
        <label className="mb-2 block font-medium text-foreground">Team members</label>
        <input type="text" name="team_members" value={project.team_members} onChange={handleChange}
          placeholder="student1@example.com, student2@example.com"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
        <p className="mt-2 text-xs text-muted-foreground">Optional, up to 5 students total including you.</p>
      </div>

      <div className="mb-8">
        <label className="mb-2 block font-medium text-foreground">Technologies</label>
        <input type="text" name="technologies" value={project.technologies} onChange={handleChange}
          placeholder="React, Node.js, Python..."
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="mb-8">
        <label className="mb-2 block font-medium text-foreground">GitHub repository</label>
        <input type="url" name="github_link" value={project.github_link} onChange={handleChange}
          placeholder="https://github.com/username/project"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="mb-8">
        <label className="mb-2 block font-medium text-foreground">Demo link</label>
        <input type="url" name="demo_link" value={project.demo_link} onChange={handleChange}
          placeholder="https://your-demo.com"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="mb-10">
        <label className="mb-2 block font-medium text-foreground">Tags</label>
        <input type="text" name="tags" value={project.tags} onChange={handleChange}
          placeholder="AI, ML, Smart Farming"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button type="button" onClick={handleSaveDraft}
          className="flex-1 rounded-xl border border-border bg-background py-4 font-medium text-foreground transition-colors hover:bg-accent">
          {editMode ? "Save changes" : "Save draft"}
        </button>
        <button type="button" onClick={handleSubmit}
          className="flex-1 rounded-xl bg-primary py-4 font-medium text-primary-foreground transition-colors hover:opacity-90">
          {editMode
            ? (projectData?.status === "draft" ? "Submit for review" : projectData?.status === "needs_changes" ? "Resubmit for review" : "Update project")
            : "Submit for review"}
        </button>
      </div>
    </motion.div>
  );
}

export default ProjectForm;
