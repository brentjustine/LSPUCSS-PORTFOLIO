import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate("/");
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);

    if (!email) {
      setError("Enter your email first to reset password.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_SITE_URL}/update-password`,
    });

    if (error) setError(error.message);
    else setInfo("Password reset link sent to your email.");
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen overflow-auto bg-gradient-to-br from-blue-600 to-green-500 text-white">
      {/* Left Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-10 text-center">
        <img src="/logo.png" alt="Logo" className="w-32 mb-4" />
        <h1 className="text-3xl font-bold leading-tight">
          SIGN-IN TO YOUR<br />LSPU ACCOUNT
        </h1>
        <p className="mt-4 text-sm">LSPU Student Portfolio</p>
        <div className="flex space-x-4 mt-6 text-xl">
          <a href="#"><i className="fab fa-facebook-f" /></a>
          <a href="#"><i className="fab fa-youtube" /></a>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 overflow-auto">
        <div className="bg-black/90 text-white p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-center mb-6">🔐 Login</h2>

          {error && <div className="text-sm text-red-500 bg-red-100 text-red-900 p-3 rounded mb-3">{error}</div>}
          {info && <div className="text-sm text-green-500 bg-green-100 text-green-900 p-3 rounded mb-3">{info}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-700"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full p-3 pr-10 rounded bg-gray-800 text-white border border-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 transform -translate-y-1/2 text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-semibold"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-sm text-center space-y-2 text-gray-400">
            <p>
              Not yet registered?{" "}
              <Link to="/register" className="text-blue-400 hover:underline">
                Register here
              </Link>
            </p>
            <p>
              Forgot your password?{" "}
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-400 hover:underline"
              >
                Reset it
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
