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
  grade: number | null;
  ai_suggestions: string | null;
  file_url?: string;
}

const AI_COLORS = ["#10B981", "#E5E7EB"];   // Green for AI Score
const GRADE_COLORS = ["#3B82F6", "#E5E7EB"]; // Blue for Grade
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp"];

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, description, ai_score, grade, ai_suggestions, file_url")
        .eq("id", id)
        .single();

      if (error) console.error("Failed to fetch project:", error);
      setProject(data ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-20 text-gray-600">Loading project...</div>;
  }
  if (!project) {
    return <div className="text-center mt-20 text-red-500">Project not found.</div>;
  }

  // AI Score data (out of 10)
  const safeScore = project.ai_score ?? 0;
  const aiScoreData = [
    { name: "Score", value: safeScore },
    { name: "Remaining", value: Math.max(0, 10 - safeScore) },
  ];

  // Grade data (out of 100)
  const safeGrade = project.grade ?? 0;
  const gradeData = [
    { name: "Grade", value: safeGrade },
    { name: "Remaining", value: Math.max(0, 100 - safeGrade) },
  ];

  // Description handling
  const descriptionText = project.description ?? "";
  const descriptionTooLong = descriptionText.length > 150;
  const displayedDescription =
    descriptionTooLong && !showFullDescription
      ? `${descriptionText.slice(0, 150)}...`
      : descriptionText;

  // Check if uploaded file is an image
  const isImage = (url?: string) => {
    if (!url) return false;
    const ext = url.split(".").pop()?.toLowerCase();
    return ext ? IMAGE_EXTENSIONS.includes(ext) : false;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-3xl w-full space-y-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-gray-800">
          {project.title}
        </h1>

        {/* Image preview */}
        {project.file_url && isImage(project.file_url) && (
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            loop
            className="rounded-xl overflow-hidden shadow-md"
          >
            <SwiperSlide>
              <img
                src={project.file_url}
                alt="Project"
                className="w-full h-64 object-cover"
              />
            </SwiperSlide>
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
                  <Cell key={index} fill={AI_COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center text-green-600 text-xl font-bold">
              {safeScore.toFixed(1)} / 10
            </div>
          </div>
        </div>

        {/* Grade */}
        <div className="flex flex-col items-center space-y-2">
          <h2 className="text-lg font-semibold text-gray-700">Grade</h2>
          <div className="relative">
            <PieChart width={200} height={200}>
              <Pie
                data={gradeData}
                dataKey="value"
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
              >
                {gradeData.map((_, index) => (
                  <Cell key={index} fill={GRADE_COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
            <div className="absolute inset-0 flex items-center justify-center text-blue-600 text-xl font-bold">
              {safeGrade} / 100
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            📄 Project Description
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {displayedDescription}
            {descriptionTooLong && (
              <span
                onClick={() => setShowFullDescription((prev) => !prev)}
                className="text-blue-600 ml-2 cursor-pointer underline"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </span>
            )}
          </p>
        </div>

        {/* AI Suggestions */}
        <div>
          <h2 className="text-lg font-semibold text-green-700 mb-3">
            🌟 AI Suggestions
          </h2>
          {project.ai_suggestions ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 shadow-sm prose prose-sm max-w-none">
              <ReactMarkdown>{project.ai_suggestions}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No AI suggestions available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
