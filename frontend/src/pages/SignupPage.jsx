import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function SignupPage() {
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      const res = await api.post("/api/auth/signup", { orgName, name, email, password });
      login(res.data.accessToken, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/api/auth/google", {
        credential: credentialResponse.credential,
      });
      login(res.data.accessToken, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Create your StatusForge account</h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Organization name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700">
            Create Account
          </button>
        </form>

        <div className="my-4 text-center text-slate-400 text-sm">or</div>

        <div className="flex justify-center">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in failed.")} />
        </div>

        <p className="text-sm text-slate-500 mt-6 text-center">
          Already have an account? <Link to="/login" className="text-blue-600">Log in</Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;