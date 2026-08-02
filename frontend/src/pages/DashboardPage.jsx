import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Server, Users, CalendarClock, ArrowRight } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import SetPasswordForm from "../components/SetPasswordForm";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to}>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="pt-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">{label}</p>
            <p className="font-display text-2xl font-semibold text-foreground">{value}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
            <Icon size={18} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function DashboardPage() {
  const { user, accessToken } = useAuth();
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [services, setServices] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/services", authHeader),
      api.get("/api/team", authHeader),
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

  return (
    <AppLayout title="Dashboard">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Welcome back, {user?.name?.split(" ")[0]}</h2>
          <p className="text-sm text-muted-foreground mt-1">Here's what's happening across your organization.</p>
        </div>

        {!isLoading && (
          <div className={`rounded-xl border p-5 ${bannerStyles[healthCopy[overallHealth].variant]}`}>
            <p className="font-display text-lg font-semibold">{healthCopy[overallHealth].text}</p>
            <p className="text-sm opacity-80 mt-0.5">{healthCopy[overallHealth].sub}</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={Server} label="Services" value={isLoading ? "—" : services.length} to="/services" />
          <StatCard icon={CalendarClock} label="Operational" value={isLoading ? "—" : operationalCount} to="/services" />
          <StatCard icon={Users} label="Team members" value={isLoading ? "—" : teamCount} to="/team" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border -mt-1">
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