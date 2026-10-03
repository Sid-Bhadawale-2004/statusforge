import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Server, Users, CalendarClock, ArrowRight, Copy, Check, Globe } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import SetPasswordForm from "../components/SetPasswordForm";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

function StatCard({ icon: Icon, label, value, to, colorClass }) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="pt-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
            <p className="font-display text-2xl font-bold text-foreground">{value}</p>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon size={20} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardPage() {
  const { user } = useAuth();

  const [services, setServices] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("/api/services"),
      api.get("/api/team"),
    ]).then(([servicesRes, teamRes]) => {
      setServices(servicesRes.data.services);
      setTeamCount(teamRes.data.members.length);
    }).finally(() => setIsLoading(false));
  }, []);

  const outageCount = services.filter((s) => s.currentStatus === "outage").length;
  const degradedCount = services.filter((s) => s.currentStatus === "degraded").length;
  const operationalCount = services.filter((s) => s.currentStatus === "operational").length;

  const overallHealth = outageCount > 0 ? "outage" : degradedCount > 0 ? "degraded" : "operational";

  const healthCopy = {
    operational: { text: "All systems operational", sub: "Everything is running smoothly.", variant: "success" },
    degraded: { text: `${degradedCount} service${degradedCount > 1 ? "s" : ""} degraded`, sub: "Some services need attention.", variant: "warning" },
    outage: { text: `${outageCount} active outage${outageCount > 1 ? "s" : ""}`, sub: "Immediate attention required.", variant: "error" },
  };

  const bannerStyles = {
    success: "bg-success-bg border-success/20 text-success",
    warning: "bg-warning-bg border-warning/20 text-warning",
    error: "bg-error-bg border-error/20 text-error",
  };

  const statusPageUrl = user?.orgSlug ? `${window.location.origin}/status/${user.orgSlug}` : null;

  const handleCopy = () => {
    if (!statusPageUrl) return;
    navigator.clipboard.writeText(statusPageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="font-display text-3xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your organization.</p>
        </div>

        {!isLoading && (
          <div className={`rounded-xl border p-5 ${bannerStyles[healthCopy[overallHealth].variant]}`}>
            <p className="font-display text-lg font-semibold">{healthCopy[overallHealth].text}</p>
            <p className="text-sm opacity-80 mt-0.5">{healthCopy[overallHealth].sub}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Server} label="Services" value={isLoading ? "—" : services.length} to="/services" colorClass="bg-indigo-100 text-indigo-600" />
          <StatCard icon={CalendarClock} label="Operational" value={isLoading ? "—" : operationalCount} to="/services" colorClass="bg-emerald-100 text-emerald-600" />
          <StatCard icon={Users} label="Team members" value={isLoading ? "—" : teamCount} to="/team" colorClass="bg-pink-100 text-pink-600" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={16} />
              Public status page
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusPageUrl ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg text-foreground truncate">
                  {statusPageUrl}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <a href={statusPageUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">View</Button>
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No status page link yet — log out and back in to refresh your account details.
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Share this link with customers — no login required to view it.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border -mt-1">
              <Link to="/incidents" className="flex items-center justify-between py-3 text-sm text-foreground hover:text-primary transition-colors group">
                View incidents
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link to="/services" className="flex items-center justify-between py-3 text-sm text-foreground hover:text-primary transition-colors group">
                Manage services
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link to="/schedules" className="flex items-center justify-between py-3 text-sm text-foreground hover:text-primary transition-colors group">
                On-call schedules
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link to="/team" className="flex items-center justify-between py-3 text-sm text-foreground hover:text-primary transition-colors group">
                Manage team
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <SetPasswordForm />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default DashboardPage;