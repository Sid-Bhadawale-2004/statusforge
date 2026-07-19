import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function SetPasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const { accessToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(
        "/api/auth/set-password",
        { newPassword },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to set password.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-3 mt-6">
      <h2 className="font-semibold text-slate-700">Set a password (optional)</h2>
      <input
        type="password"
        placeholder="New password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full border rounded px-3 py-2"
      />
      <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded">
        Set Password
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </form>
  );
}

export default SetPasswordForm;