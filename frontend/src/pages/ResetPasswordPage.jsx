import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import { Button } from "../components/ui/button";

function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/api/auth/reset-password/${token}`, { newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-lg font-semibold text-foreground mb-6">Set a new password</h1>

      {success ? (
        <p className="text-sm text-success bg-success-bg rounded-lg p-3">
          Password reset! Redirecting you to login...
        </p>
      ) : (
        <>
          {error && (
            <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2 mb-4">{error}</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-border bg-card rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              required
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </>
      )}

      <p className="text-sm text-muted-foreground mt-6 text-center">
        <Link to="/login" className="text-primary hover:underline">Back to login</Link>
      </p>
    </AuthLayout>
  );
}

export default ResetPasswordPage;