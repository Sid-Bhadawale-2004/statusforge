import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

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

  const roleBadgeVariant = { admin: "error", responder: "secondary", viewer: "outline" };

  return (
    <AppLayout title="Team">
      <div className="max-w-2xl space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Invite a teammate</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite}>
                {error && (
                  <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2 mb-3">{error}</p>
                )}
                {message && (
                  <p className="text-sm text-success bg-success-bg rounded-lg px-3 py-2 mb-3">{message}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex-1 border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="responder">Responder</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button type="submit" disabled={isSubmitting} className="whitespace-nowrap">
                    <UserPlus size={16} />
                    {isSubmitting ? "Sending..." : "Send invite"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading team...</p>
            ) : (
              members.map((m) => (
                <div key={m._id || m.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-sm text-muted-foreground font-mono">{m.email}</p>
                  </div>
                  <Badge variant={roleBadgeVariant[m.role]}>{m.role}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

export default TeamPage;