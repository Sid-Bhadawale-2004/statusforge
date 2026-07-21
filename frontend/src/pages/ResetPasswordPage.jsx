import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function ResetPasswordPage() {
  const { token } = useParams(); // reads the :token part of the URL
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      await api.post(`/api/auth/reset-password/${token}`, { newPassword });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Set a new password</h1>

        {success ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
            Password reset! Redirecting you to login...
          </p>
        ) : (
          <>
            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
              <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700">
                Reset Password
              </button>
            </form>
          </>
        )}

        <p className="text-sm text-slate-500 mt-6 text-center">
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPasswordPage;