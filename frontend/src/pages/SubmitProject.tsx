import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

export default function SubmitProject() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [files, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await toast.promise(
      (async () => {
        // 🔐 Get user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) throw new Error("User not authenticated.");
        const user = userData.user;

        // 📤 Upload files to Supabase Storage
        const uploadedFiles: { path: string; url: string }[] = [];

        for (const file of files) {
          const filePath = `${user.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("projects")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicUrlData } = supabase.storage
            .from("projects")
            .getPublicUrl(filePath);

          if (!publicUrlData?.publicUrl) throw new Error("Failed to get file URL.");

          uploadedFiles.push({ path: filePath, url: publicUrlData.publicUrl });
        }

        // 🤖 Send to backend AI service
        const aiRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_name: user.email,
            title: form.title,
            description: form.description,
            file_url: uploadedFiles[0]?.url || null, // Just the first file for analysis
          }),
        });

        if (!aiRes.ok) throw new Error("AI processing failed.");
        const ai = await aiRes.json();

        // 💾 Save to Supabase DB
        const { error: dbError } = await supabase.from("projects").insert({
          user_id: user.id,
          student_name: user.email,
          title: form.title,
          description: form.description,
          file_url: uploadedFiles[0]?.url || null,
          file_paths: uploadedFiles,
          ai_score: ai.ai_score ?? null,
          ai_suggestions: ai.ai_suggestions ?? null,
          ai_learning_path: ai.ai_learning_path ?? null,
        });

        if (dbError) throw dbError;

        localStorage.setItem("ai_refresh_needed", "true");
        navigate("/");
      })(),
      {
        loading: "Submitting your project...",
        success: "✅ Project submitted!",
        error: (err) => err.message || "Submission failed"}`,
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto mt-10 bg-white p-6 rounded-xl shadow-md space-y-5"
    >
      <h1 className="text-2xl font-bold text-center">📤 Submit Your Project</h1>

      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Project Title"
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />

      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Project Description"
        className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
        required
      />

      <div className="w-full">
        <label className="block font-semibold mb-1">📁 Upload Files (optional)</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
          <input
            type="file"
            id="fileUpload"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="fileUpload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <span className="text-3xl">📎</span>
            <span className="text-gray-600">
              Click or drag files here to upload
            </span>
            <span className="text-sm text-gray-400">
              (ZIP, code, docs, images, etc.)
            </span>
          </label>
        </div>

        {files.length > 0 && (
          <ul className="mt-3 text-sm text-gray-700 space-y-1">
            {files.map((file, i) => (
              <li key={i}>• {file.name}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-semibold"
      >
        🚀 Submit Project
      </button>
    </form>
  );
}
