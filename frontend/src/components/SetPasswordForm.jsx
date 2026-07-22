import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function SetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

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
      const res = await api.post(
        "/api/auth/set-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setMessage(res.data.message);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-3 mt-6">
      <h2 className="font-semibold text-slate-700">Set a password (optional)</h2>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">{message}</p>}

      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border rounded px-3 py-2 pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
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
        className="w-full border rounded px-3 py-2"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="bg-slate-800 text-white px-4 py-2 rounded disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Setting...
          </>
        ) : (
          "Set Password"
        )}
      </button>
    </form>
  );
}

export default SetPasswordForm;