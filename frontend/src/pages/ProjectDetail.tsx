import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { PieChart, Pie, Cell } from "recharts";

interface Project {
  id: number;
  title: string;
  description: string;
  ai_score: number | null;
  ai_suggestions: string | string[] | null;
}

const COLORS = ["#10B981", "#E5E7EB"];

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, ai_score, ai_suggestions")
        .eq("id", id)
        .single();

      if (!error && data) setProject(data);
      setLoading(false);
    };

    fetchProject();
  }, [id]);

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!project) return <div className="text-center mt-10 text-red-500">Project not found.</div>;

  const safeScore = project.ai_score ?? 0;

  const aiScoreData = [
    { name: "Score", value: safeScore },
    { name: "Remaining", value: 10 - safeScore },
  ];

  const suggestions = Array.isArray(project.ai_suggestions)
    ? project.ai_suggestions
    : typeof project.ai_suggestions === "string"
    ? project.ai_suggestions.split(/\d+\.\s+/).filter(Boolean)
    : [];

  const truncatedDescription =
    project.description.length > 150 && !showFullDescription
      ? project.description.slice(0, 150) + "..."
      : project.description;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-xl shadow-md p-6 space-y-10">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800">{project.title}</h1>

        {/* AI Score */}
        <div className="flex justify-center items-center flex-col space-y-2">
          <h2 className="text-lg font-semibold text-gray-700">AI Score</h2>
          <div className="relative">
            <PieChart width={200} height={200}>
              <Pie
                data={aiScoreData}
                dataKey="value"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
              >
                {aiScoreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center text-green-600 text-xl font-bold">
              {safeScore.toFixed(1)} / 10
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Project Description</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {truncatedDescription}
            {project.description.length > 150 && (
              <span
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-500 ml-1 cursor-pointer underline"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </span>
            )}
          </p>
        </div>

        {/* AI Suggestions */}
        <div>
          <h2 className="text-lg font-semibold text-green-700 mb-4">🌟 AI Suggestions</h2>
          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((s, index) => {
                const [titleMatch, ...rest] = s.split(":");
                const title = titleMatch?.trim() || `Suggestion ${index + 1}`;
                const content = rest.join(":").trim();

                return (
                  <div
                    key={index}
                    className="bg-gray-50 border-l-4 border-green-500 p-4 rounded shadow-sm"
                  >
                    <h3 className="text-md font-semibold text-gray-800 mb-1">✅ {title}</h3>
                    <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                      {content}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No AI suggestions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
