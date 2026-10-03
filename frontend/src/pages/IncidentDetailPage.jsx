import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Zap, MessageSquare } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

const severityVariant = { P1: "error", P2: "warning", P3: "secondary", P4: "secondary" };
const statusVariant = { triggered: "error", acknowledged: "warning", resolved: "success" };

const eventIcons = {
  created: Zap,
  escalated: Zap,
  acknowledged: CheckCircle,
  resolved: CheckCircle,
  comment: MessageSquare,
};

function IncidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [incident, setIncident] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [loadError, setLoadError] = useState("");

  const fetchIncident = () => {
    setIsLoading(true);
    api.get(`/api/incidents/${id}`)
        .then((res) => {
        setIncident(res.data.incident);
        setEvents(res.data.events);
        setLoadError("");
    })
        .catch((err) => {
            console.error(err);
            setLoadError(err.response?.data?.message || "Failed to load this incident.");
    })
        .finally(() => setIsLoading(false));
    };

  const handleAcknowledge = async () => {
    setIsActing(true);
    try {
      await api.post(`/api/incidents/${id}/acknowledge`, {}, authHeader);
      fetchIncident();
    } finally {
      setIsActing(false);
    }
  };

  const handleResolve = async () => {
    setIsActing(true);
    try {
      await api.post(`/api/incidents/${id}/resolve`, {}, authHeader);
      fetchIncident();
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Incident">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppLayout>
    );
  }

  if (!incident) {
    return (
        <AppLayout title="Incident">
        <p className="text-sm text-destructive">{loadError || "Incident not found."}</p>
        </AppLayout>
    );
   }

  return (
    <AppLayout title="Incident">
      <div className="max-w-2xl space-y-6">
        <Link to="/incidents" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} />
          Back to incidents
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{incident.title}</CardTitle>
                <p className="text-sm text-muted-foreground font-mono mt-1">{incident.serviceId?.name}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
                <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {incident.status !== "resolved" && (
              <div className="flex gap-2">
                {incident.status === "triggered" && (
                  <Button variant="outline" onClick={handleAcknowledge} disabled={isActing}>
                    <CheckCircle size={16} />
                    Acknowledge
                  </Button>
                )}
                <Button variant="destructive" onClick={handleResolve} disabled={isActing}>
                  <XCircle size={16} />
                  Resolve
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {events.map((event) => {
                const Icon = eventIcons[event.type] || MessageSquare;
                return (
                  <li key={event._id} className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <Icon size={14} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{event.message}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {event.actorUserId ? event.actorUserId.name : "System"} ·{" "}
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default IncidentDetailPage;