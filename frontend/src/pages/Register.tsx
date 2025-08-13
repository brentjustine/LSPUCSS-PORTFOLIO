import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const image = e.target.files?.[0];
    if (image) {
      setFile(image);
      setPreviewUrl(URL.createObjectURL(image));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profilePicUrl = "";

      // Upload profile picture if provided
      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `avatars/${form.email}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        profilePicUrl = data.publicUrl;
      }

      // Sign up user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            profile_picture_url: profilePicUrl || null, // match your `profiles` table
          },
        },
      });

      if (signUpError) throw new Error(signUpError.message);

      const userId = signUpData?.user?.id;
      if (!userId) throw new Error("Failed to retrieve user ID after signup");

      // Save profile in `profiles` table
      const { error: dbError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.full_name,
        profile_picture_url: profilePicUrl || null,
        is_public: true,
      });

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      toast.success("📬 Check your email to confirm your registration");
      navigate("/login");
    } catch (err: any) {
      toast.error(`⚠️ Registration failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-600 to-green-500 justify-center items-center px-4">
      <div className="bg-black p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-white mb-6">📝 Create Account</h2>

        <form onSubmit={handleRegister} className="space-y-5">
          <input
            type="text"
            name="full_name"
            value={form.full_name}
            onChange={handleChange}
            placeholder="Full Name"
            required
            className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-black"
          />

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full p-3 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-black"
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full p-3 pr-10 border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-black"
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute top-1/2 right-3 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="text-sm font-semibold text-gray-300">Optional Profile Picture</div>
          <label className="cursor-pointer border-dashed border-2 border-gray-600 rounded-xl flex flex-col items-center justify-center p-4 hover:border-blue-400 transition">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover shadow"
              />
            ) : (
              <div className="text-gray-400 text-center">
                <span className="text-4xl">📁</span>
                <p className="mt-1">Click to upload</p>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold text-white transition ${
              loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Registering..." : "🚀 Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
