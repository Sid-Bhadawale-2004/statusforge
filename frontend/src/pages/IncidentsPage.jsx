import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

const severityVariant = { P1: "error", P2: "warning", P3: "secondary", P4: "secondary" };
const statusVariant = { triggered: "error", acknowledged: "warning", resolved: "success" };

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function IncidentsPage() {
  const { accessToken } = useAuth();
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchIncidents = () => {
    api.get("/api/incidents", authHeader)
      .then((res) => setIncidents(res.data.incidents))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 15000);
    return () => clearInterval(interval);
  }, []);

  const openIncidents = incidents.filter((i) => i.status !== "resolved");
  const resolvedIncidents = incidents.filter((i) => i.status === "resolved");

  const IncidentRow = ({ incident }) => (
    <Link
      to={`/incidents/${incident._id}`}
      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
    >
      <div>
        <p className="text-sm font-medium text-foreground">{incident.title}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          {incident.serviceId?.name} · {timeAgo(incident.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
        <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
      </div>
    </Link>
  );

  return (
    <AppLayout title="Incidents">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-2">
            Active ({openIncidents.length})
          </h2>
          <Card className="divide-y divide-border">
            {isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading incidents...</p>
            ) : openIncidents.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No active incidents. All clear.</p>
            ) : (
              openIncidents.map((i) => <IncidentRow key={i._id} incident={i} />)
            )}
          </Card>
        </div>

        {resolvedIncidents.length > 0 && (
          <div>
            <h2 className="font-display text-sm font-semibold text-foreground mb-2">Recently resolved</h2>
            <Card className="divide-y divide-border">
              {resolvedIncidents.slice(0, 10).map((i) => <IncidentRow key={i._id} incident={i} />)}
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default IncidentsPage;