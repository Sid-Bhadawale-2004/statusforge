import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Server, Users, CalendarClock, ArrowRight, Copy, Check, Globe } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import SetPasswordForm from "../components/SetPasswordForm";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

function StatCard({ icon: Icon, label, value, to, colorClass, eyebrow }) {
  return (
    <Link to={to} className="group block">
      <Card className="stat-card h-full overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
        <CardContent className="relative flex min-h-36 flex-col justify-between gap-6 p-5">
          <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground">{value}</p></div><div className={`flex size-10 items-center justify-center rounded-xl ${colorClass}`}><Icon size={19} /></div></div>
          <p className="text-xs text-muted-foreground">{eyebrow}</p>
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
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="relative overflow-hidden rounded-2xl border border-primary/15 bg-card px-6 py-7 shadow-sm sm:px-8">
          <div className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
          <div className="relative"><p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-primary">Operations overview</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Welcome back, {user?.name?.split(" ")[0]}.</h2><p className="mt-2 max-w-xl text-sm text-muted-foreground">Your infrastructure at a glance. Monitor services, team health, and public status from one command center.</p></div>
        </div>

        {!isLoading && (
          <div className={`rounded-xl border p-5 ${bannerStyles[healthCopy[overallHealth].variant]}`}>
            <div className="flex items-start gap-3"><span className="mt-1.5 size-2 rounded-full bg-current" aria-hidden="true" /><div><p className="font-display text-lg font-semibold">{healthCopy[overallHealth].text}</p><p className="mt-0.5 text-sm opacity-80">{healthCopy[overallHealth].sub}</p></div></div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Server} label="Services" value={isLoading ? "—" : services.length} eyebrow="Registered in workspace" to="/services" colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300" />
          <StatCard icon={CalendarClock} label="Operational" value={isLoading ? "—" : operationalCount} eyebrow="Currently healthy" to="/services" colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300" />
          <StatCard icon={Users} label="Team members" value={isLoading ? "—" : teamCount} eyebrow="With workspace access" to="/team" colorClass="bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300" />
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
