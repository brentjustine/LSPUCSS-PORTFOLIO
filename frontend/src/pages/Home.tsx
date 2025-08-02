import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Link, useNavigate } from "react-router-dom";
import ProjectCard from "./Projects";
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
} from "recharts";
import {
  AiOutlineAppstore, AiOutlineRobot, AiOutlinePlus,
} from "react-icons/ai";
import toast from "react-hot-toast";

const TABS = [
  { name: "Projects", icon: <AiOutlineAppstore className="text-xl" /> },
  { name: "AI Overview", icon: <AiOutlineRobot className="text-xl" /> },
];

const COLORS = ["#3b82f6", "#e5e7eb"];

const toastConfirm = (message: string) =>
  new Promise<boolean>((resolve) => {
    const id = toast.custom((t) => (
      <div className="bg-white shadow-lg rounded p-4 flex flex-col items-start gap-3 w-72">
        <span className="text-sm text-gray-800">{message}</span>
        <div className="flex gap-2 self-end">
          <button onClick={() => { toast.dismiss(id); resolve(true); }} className="px-3 py-1 text-sm text-white bg-red-600 rounded">Yes</button>
          <button onClick={() => { toast.dismiss(id); resolve(false); }} className="px-3 py-1 text-sm text-gray-600 border rounded">Cancel</button>
        </div>
      </div>
    ));
  });

export default function Home() {
  const [activeTab, setActiveTab] = useState("Projects");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());

  const navigate = useNavigate();

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user;
  };

  const fetchProjects = async (refreshAISummary = false) => {
    const user = await getUser();
    if (!user) return toast.error("Authentication failed.");

    const { data, error } = await supabase.from("projects").select("*").eq("user_id", user.id);
    if (error) return toast.error("Failed to fetch projects.");

    setProjects(data || []);
    if (refreshAISummary) fetchAISummary(user.id, data?.length || 0);
    setLoading(false);
  };

  const fetchAISummary = async (userId: string, projectCount: number) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/summary?user_id=${userId}`);
      const json = await res.json();
      const summary = json.summary || "No summary available.";

      setAiSummary(summary);
      localStorage.setItem(`aiSummary:${userId}`, summary);
      localStorage.setItem(`projectsCount:${userId}`, projectCount.toString());
    } catch {
      setAiSummary("Failed to fetch summary.");
    }
  };

  useEffect(() => {
    const init = async () => {
      const user = await getUser();
      if (!user) return;
      const cached = localStorage.getItem(`aiSummary:${user.id}`);
      if (cached) setAiSummary(cached);
      await fetchProjects();
    };

    init();

    const subscription = supabase
      .channel("public:projects")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => fetchProjects())
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  useEffect(() => {
    const refresh = async () => {
      const user = await getUser();
      if (!user) return;
      if (localStorage.getItem("ai_refresh_needed") === "true") {
        await fetchAISummary(user.id, projects.length);
        localStorage.setItem("ai_refresh_needed", "false");
      }
    };
    refresh();
  }, [projects]);

  const toggleSelectProject = (id: number) => {
    setSelectedProjects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (selectedProjects.size === 0) return toast("No projects selected.");
    const confirmed = await toastConfirm(`Delete ${selectedProjects.size} project(s)?`);
    if (!confirmed) return;

    setLoading(true);
    const ids = Array.from(selectedProjects);

    // Delete storage files
    const { data: filesToDelete } = await supabase.from("projects").select("file_paths").in("id", ids);
    const paths = (filesToDelete || []).flatMap(p => {
      try {
        return p.file_paths.map((f: string) => JSON.parse(f).path);
      } catch {
        return [];
      }
    });
    if (paths.length > 0) {
      const { error } = await supabase.storage.from("projects").remove(paths);
      if (error) return toast.error("Storage delete failed: " + error.message);
    }

    // Delete projects
    const { error: deleteError } = await supabase.from("projects").delete().in("id", ids);
    if (deleteError) {
      toast.error("Delete failed: " + deleteError.message);
      setLoading(false);
      return;
    }

    toast.success("Deleted successfully.");
    setSelectedProjects(new Set());

    // Wait a little before refetching to allow Supabase to sync
    setTimeout(async () => {
      const user = await getUser();
      if (user) {
        localStorage.removeItem(`aiSummary:${user.id}`);
        localStorage.removeItem(`projectsCount:${user.id}`);
        localStorage.setItem("ai_refresh_needed", "true");
        await fetchProjects(true); // This will call fetchAISummary inside
      }
      setLoading(false);
    }, 1000); // 🕒 Wait 1 second to avoid stale results
  };


  const averageScore = projects.length > 0
    ? projects.reduce((acc, p) => acc + (p.ai_score || 0), 0) / projects.length
    : 0;

  const pieData = [
    { name: "Score", value: averageScore },
    { name: "Remaining", value: 10 - averageScore },
  ];

  const barData = projects.map(p => ({
    name: p.title,
    score: p.ai_score ?? 0,
  }));

  return (
    <div className="max-w-5xl mx-auto mt-6 px-4 pb-20 relative">
      <div className="flex gap-2 border-b pb-2 mb-4 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t font-semibold transition-all text-sm md:text-base ${
              activeTab === tab.name ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
            }`}
          >
            <span className="md:hidden">{tab.icon}</span>
            <span className="hidden md:inline">{tab.name}</span>
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-10 text-gray-500 animate-pulse">⏳ Loading projects...</div>}

      {!loading && activeTab === "Projects" && (
        <>
          {selectedProjects.size > 0 && (
            <button
              onClick={handleDelete}
              className="mb-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete Selected ({selectedProjects.size})
            </button>
          )}

          <div className="space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-20 text-gray-500 space-y-4">
                <div className="text-6xl">📁</div>
                <p className="text-lg font-medium">No projects yet</p>
                <p className="text-sm text-gray-400">Click the <AiOutlinePlus className="inline text-base" /> button to add one!</p>
              </div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedProjects.has(project.id)}
                    onChange={() => toggleSelectProject(project.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-3 w-5 h-5 accent-blue-600"
                  />
                  <Link to={`/project/${project.id}`} className="flex-1 block no-underline">
                    <ProjectCard
                      title={project.title}
                      description={project.description}
                      ai_score={project.ai_score}
                    />
                  </Link>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!loading && activeTab === "AI Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded shadow p-4 flex flex-col items-center">
              <h3 className="text-base md:text-lg font-bold mb-4 text-center">Overall AI Score</h3>
              <PieChart width={250} height={250}>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>

            <div className="bg-white p-4 md:p-6 rounded shadow flex justify-center items-center min-h-[300px]">
              {projects.length === 0 ? (
                <p className="text-gray-500 text-center">No performance data available yet.</p>
              ) : (
                <ResponsiveContainer width="95%" height={300}>
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h3 className="text-base md:text-lg font-bold mb-2">AI Learning Path</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {aiSummary ?? "Loading AI summary..."}
            </p>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/submit")}
        className="fixed bottom-5 right-5 md:bottom-6 md:right-10 z-50 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition"
      >
        <AiOutlinePlus className="text-2xl" />
      </button>
    </div>
  );
}
