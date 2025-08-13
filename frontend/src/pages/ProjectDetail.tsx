import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { PieChart, Pie, Cell } from "recharts";
import ReactMarkdown from "react-markdown";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";

interface Project {
  id: number;
  title: string;
  description: string;
  ai_score: number | null;
  ai_suggestions: string | string[] | null;
  file_paths?: { path: string; url: string }[];
}

const COLORS = ["#10B981", "#E5E7EB"];
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, ai_score, ai_suggestions, file_paths")
        .eq("id", id)
        .single();

      if (!error && data) {
        setProject(data);
      }
      setLoading(false);
    };

    fetchProject();
  }, [id]);

  if (loading) return <div className="text-center mt-20 text-gray-600">Loading project...</div>;
  if (!project) return <div className="text-center mt-20 text-red-500">Project not found.</div>;

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

  // Extract images from file_paths
  const images =
    project.file_paths?.filter((file) => {
      const ext = file.path.split(".").pop()?.toLowerCase();
      return ext && IMAGE_EXTENSIONS.includes(ext);
    }) || [];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl w-full space-y-8">
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800">{project.title}</h1>

        {/* Sliding Image Gallery */}
        {images.length > 0 && (
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            loop
            className="rounded-xl overflow-hidden shadow-md"
          >
            {images.map((file, idx) => (
              <SwiperSlide key={idx}>
                <img
                  src={file.url}
                  alt={`Project image ${idx + 1}`}
                  className="w-full h-64 object-cover"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* AI Score */}
        <div className="flex flex-col items-center space-y-2">
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
                {aiScoreData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
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
          <h2 className="text-lg font-semibold text-gray-700 mb-2">📄 Project Description</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {truncatedDescription}
            {project.description.length > 150 && (
              <span
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-blue-600 ml-2 cursor-pointer underline"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </span>
            )}
          </p>
        </div>

        {/* AI Suggestions */}
        <div>
          <h2 className="text-lg font-semibold text-green-700 mb-3">🌟 AI Suggestions</h2>
          {project.ai_suggestions ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm prose prose-sm max-w-none">
              <ReactMarkdown>
                {typeof project.ai_suggestions === "string"
                  ? project.ai_suggestions
                  : project.ai_suggestions.join("\n")}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No AI suggestions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
