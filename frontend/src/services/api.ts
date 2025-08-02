import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000", // Update if deployed
});

export const fetchProjects = () => API.get("/projects");

export const getProjects = () => {
  return axios.get('http://127.0.0.1:8000/projects');
};
export const submitProject = (data: {
  student_name: string;
  title: string;
  description: string;
}) => API.post("/submit", data);

export const getSuggestion = (title: string) =>
  API.get(`/suggestion?title=${encodeURIComponent(title)}`);
