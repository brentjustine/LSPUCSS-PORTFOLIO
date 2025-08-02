import { FaUserCircle } from 'react-icons/fa';

interface Props {
  title: string;
  description: string;
  student_name: string;
}

const ProjectCard: React.FC<Props> = ({ title, description, student_name }) => (
  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-all transform hover:scale-[1.02] duration-300">
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <div className="flex items-center text-indigo-600 font-medium gap-2 text-sm">
      <FaUserCircle className="text-lg" />
      By: {student_name}
    </div>
  </div>
);

export default ProjectCard;
