import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import { Button } from "../components/ui/button";

function SignupPage() {
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/signup", { orgName, name, email, password });
      login(res.data.accessToken, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await api.post("/api/auth/google", { credential: credentialResponse.credential });
      login(res.data.accessToken, res.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-lg font-semibold text-foreground mb-6">Create your account</h1>

      {error && (
        <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Organization name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full border border-border bg-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          required
        />
        <input
          type="text"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border bg-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border bg-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border bg-card rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <input
          type={showPassword ? "text" : "password"}
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full border border-border bg-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          required
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-mono">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex justify-center">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google sign-in failed.")} />
      </div>

      <p className="text-sm text-muted-foreground mt-6 text-center">
        Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}

export default SignupPage;