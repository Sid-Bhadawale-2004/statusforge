import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import api from "../services/api";
import Logomark from "../components/Logomark";
import { Badge } from "../components/ui/badge";
import GradientBackdrop from "../components/GradientBackdrop";
const statusConfig = {
  operational: { label: "Operational", icon: CheckCircle2, dotClass: "bg-success" },
  degraded: { label: "Degraded", icon: AlertTriangle, dotClass: "bg-warning" },
  outage: { label: "Outage", icon: XCircle, dotClass: "bg-error" },
};

const overallConfig = {
  operational: {
    heading: "All systems operational",
    sub: "Everything is running smoothly.",
    classes: "bg-success-bg border-success/20 text-success",
    Icon: CheckCircle2,
  },
  degraded: {
    heading: "Partial service disruption",
    sub: "Some services are experiencing issues.",
    classes: "bg-warning-bg border-warning/20 text-warning",
    Icon: AlertTriangle,
  },
  outage: {
    heading: "Active outage",
    sub: "We're aware of the issue and working on it.",
    classes: "bg-error-bg border-error/20 text-error",
    Icon: XCircle,
  },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function PublicStatusPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = () => {
      api
        .get(`/api/public/status/${slug}`)
        .then((res) => {
          setData(res.data);
          setError("");
        })
        .catch(() => setError("This status page doesn't exist."))
        .finally(() => setIsLoading(false));
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [slug]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const { organization, services, recentIncidents } = data;

  const outageCount = services.filter((s) => s.currentStatus === "outage").length;
  const degradedCount = services.filter((s) => s.currentStatus === "degraded").length;
  const overallStatus = outageCount > 0 ? "outage" : degradedCount > 0 ? "degraded" : "operational";
  const { heading, sub, classes, Icon } = overallConfig[overallStatus];

  return (
      <div className="min-h-screen bg-background relative">
        <GradientBackdrop />
        <div className="max-w-2xl mx-auto px-6 py-16">
            <div className="flex items-center gap-3 mb-10">
               <Logomark size={44} />
            <div>
             <p className="font-display text-2xl font-bold text-foreground">{organization.name}</p>
             <p className="text-xs text-muted-foreground font-mono">Status</p>
            </div>
        </div>

        <div className={`rounded-xl border p-6 mb-10 flex items-start gap-4 ${classes}`}>
          <Icon size={28} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-xl font-semibold">{heading}</p>
            <p className="text-sm opacity-80 mt-1">{sub}</p>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="font-display text-sm font-semibold text-foreground mb-3">Services</h2>
          <div className="border border-border rounded-xl divide-y divide-border bg-card">
            {services.map((service) => {
              const { label, icon: StatusIcon, dotClass } = statusConfig[service.currentStatus];
              return (
                <div key={service._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                    <span className="text-sm text-muted-foreground">{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="font-display text-sm font-semibold text-foreground mb-3">
            Incident history (last 14 days)
          </h2>
          {recentIncidents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No incidents reported in this period.</p>
          ) : (
            <div className="space-y-3">
              {recentIncidents.map((incident) => (
                <div key={incident._id} className="border border-border rounded-xl p-4 bg-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{incident.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {incident.serviceId?.name}
                      </p>
                    </div>
                    <Badge variant={incident.status === "resolved" ? "success" : "error"}>
                      {incident.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                    <Clock size={12} />
                    {formatDate(incident.createdAt)}
                    {incident.resolvedAt && ` · resolved ${formatDate(incident.resolvedAt)}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground font-mono mt-16">
          Powered by StatusForge
        </p>
      </div>
    </div>
  );
}

export default PublicStatusPage;