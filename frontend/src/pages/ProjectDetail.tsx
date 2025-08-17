import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { PieChart, Pie, Cell } from "recharts";
import ReactMarkdown from "react-markdown";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

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

      if (error) console.error("❌ Failed to fetch project:", error);
      setProject(data ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <p className="text-center mt-20 text-gray-500">Loading project...</p>;
  }

  if (!project) {
    return <p className="text-center mt-20 text-red-500">Project not found.</p>;
  }

  // Safe values
  const safeScore = project.ai_score ?? 0;
  const safeGrade = project.grade ?? 0;

  // Chart data
  const aiScoreData = [
    { name: "Score", value: safeScore },
    { name: "Remaining", value: Math.max(0, 10 - safeScore) },
  ];

  const gradeData = [
    { name: "Grade", value: safeGrade },
    { name: "Remaining", value: Math.max(0, 100 - safeGrade) },
  ];

  // Description logic
  const description = project.description ?? "";
  const descriptionTooLong = description.length > 150;
  const displayedDescription =
    descriptionTooLong && !showFullDescription
      ? `${description.slice(0, 150)}...`
      : description;

  // File preview check
  const isImage = (url?: string) => {
    if (!url) return false;
    const ext = url.split(".").pop()?.toLowerCase();
    return ext ? IMAGE_EXTENSIONS.includes(ext) : false;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-3xl w-full space-y-10">
        {/* Title */}
        <h1 className="text-3xl font-extrabold text-center text-gray-800">
          {project.title}
        </h1>

        {/* File Preview */}
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
                alt="Project preview"
                className="w-full h-72 object-cover"
              />
            </SwiperSlide>
          </Swiper>
        )}

        {/* AI Score & Grade side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* AI Score */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold text-gray-700">🤖 AI Score</h2>
            <div className="relative">
              <PieChart width={180} height={180}>
                <Pie
                  data={aiScoreData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                >
                  {aiScoreData.map((_, i) => (
                    <Cell key={i} fill={AI_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center text-green-600 text-lg font-bold">
                {safeScore.toFixed(1)} / 10
              </div>
            </div>
          </div>

          {/* Grade */}
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-semibold text-gray-700">📊 Grade</h2>
            <div className="relative">
              <PieChart width={180} height={180}>
                <Pie
                  data={gradeData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                >
                  {gradeData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.name === "Grade" ? "#3B82F6" : "#E5E7EB"}
                    />
                  ))}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex items-center justify-center text-blue-600 text-lg font-bold">
                {safeGrade} / 100
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">
            📄 Project Description
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {displayedDescription}
            {descriptionTooLong && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="ml-2 text-blue-600 underline"
              >
                {showFullDescription ? "Show less" : "Read more"}
              </button>
            )}
          </p>
        </section>

        {/* AI Suggestions */}
        <section>
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
        </section>
      </div>
    </div>
  );
}
