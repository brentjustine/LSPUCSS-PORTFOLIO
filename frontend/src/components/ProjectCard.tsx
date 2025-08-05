import { FaUserCircle } from 'react-icons/fa';

interface Props {
  title: string;
  description: string;
  student_name?: string; // still optional, since it's not always passed
  ai_score?: number;     // ✅ added ai_score
}

const ProjectCard: React.FC<Props> = ({ title, description, student_name, ai_score }) => (
  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-all transform hover:scale-[1.02] duration-300">
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 mb-2">{description}</p>
    
    {typeof ai_score === "number" && (
      <p className="text-sm text-blue-600 font-medium mb-2">AI Score: {ai_score.toFixed(1)} / 10</p>
    )}

    {student_name && (
      <div className="flex items-center text-indigo-600 font-medium gap-2 text-sm">
        <FaUserCircle className="text-lg" />
        By: {student_name}
      </div>
    )}
  </div>
);

export default ProjectCard;
