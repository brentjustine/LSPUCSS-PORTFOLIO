import React from "react";

interface Props {
  title: string;
  description: string;
  ai_score?: number;
}

const ProjectCard: React.FC<Props> = ({ title, description, ai_score }) => (
  <div className="bg-white rounded-2xl shadow-md p-4 hover:shadow-xl transition flex justify-between items-start border border-transparent hover:border-blue-300">
    <div className="flex-1 pr-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{description}</p>
    </div>
    <div className="flex-shrink-0">
      <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
        AI Score: {ai_score?.toFixed(1) ?? "N/A"}/10
      </span>
    </div>
  </div>
);

export default ProjectCard;
