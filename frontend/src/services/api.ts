import axios from "axios";

// ✅ Use environment variable for production/deployment
const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// 🔁 Fetch all projects
export const fetchProjects = () => API.get("/projects");

// 🧹 Redundant call removed — this uses the same endpoint as above
// You can use fetchProjects instead, but keeping it for compatibility
export const getProjects = () => API.get("/projects");

// 🚀 Submit a new project
export const submitProject = (data: {
  student_name: string;
  title: string;
  description: string;
}) => API.post("/submit", data);

// 💡 Get AI suggestions for a given project title
export const getSuggestion = (title: string) =>
  API.get(`/suggestion?title=${encodeURIComponent(title)}`);
