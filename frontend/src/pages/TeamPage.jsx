import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function TeamPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("responder");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get("/api/team", authHeader)
      .then((res) => setMembers(res.data.members))
      .finally(() => setIsLoading(false));
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/team/invite", { name, email, role }, authHeader);
      setMessage(res.data.message);
      setMembers((prev) => [...prev, res.data.user]);
      setName("");
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send invite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8">Loading team...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Team</h1>

      {isAdmin && (
        <form onSubmit={handleInvite} className="bg-white p-4 rounded-lg shadow mb-6 space-y-3">
          <h2 className="font-semibold text-slate-700">Invite a teammate</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {message && <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded p-2">{message}</p>}
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border rounded px-3 py-2" required />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="admin">Admin</option>
            <option value="responder">Responder</option>
            <option value="viewer">Viewer</option>
          </select>
          <button type="submit" disabled={isSubmitting} className="bg-slate-800 text-white px-4 py-2 rounded disabled:bg-slate-400">
            {isSubmitting ? "Sending..." : "Send Invite"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow divide-y">
        {members.map((m) => (
          <div key={m._id || m.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{m.name}</p>
              <p className="text-sm text-slate-500">{m.email}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">{m.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamPage;