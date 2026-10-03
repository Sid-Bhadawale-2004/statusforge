import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Server, Users, CalendarClock, AlertTriangle, LogOut, ChevronDown,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Logomark from "./Logomark";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "./ui/dropdown-menu";

const navItems = [
  { to: "/incidents", label: "Incidents", icon: AlertTriangle },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/services", label: "Services", icon: Server },
  { to: "/schedules", label: "Schedules", icon: CalendarClock },
  { to: "/team", label: "Team", icon: Users },
];

function OrgStatusStrip() {
  const [worstStatus, setWorstStatus] = useState(null);

  useEffect(() => {
    api
      .get("/api/services")
      .then((res) => {
        const statuses = res.data.services.map((s) => s.currentStatus);
        if (statuses.includes("outage")) setWorstStatus("outage");
        else if (statuses.includes("degraded")) setWorstStatus("degraded");
        else setWorstStatus("operational");
      })
      .catch(() => setWorstStatus(null));
  }, []);

  const config = {
    operational: { text: "All systems operational", variant: "success" },
    degraded: { text: "Degraded service detected", variant: "warning" },
    outage: { text: "Active outage", variant: "error" },
  };

  if (!worstStatus) return null;
  const { text, variant } = config[worstStatus];

  return (
    <div className="px-3 pt-3">
      <Badge variant={variant} className="w-full justify-center">{text}</Badge>
    </div>
  );
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function AppLayout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="brand-gradient p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logomark size={28} />
            <p className="font-display text-base font-bold text-white leading-tight">StatusForge</p>
          </div>
          <Badge className="bg-white/20 text-white border-white/20">Free</Badge>
        </div>

        <OrgStatusStrip />

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "brand-gradient text-white font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between px-6 py-3.5">
            <h1 className="font-display text-lg font-semibold text-foreground">{title}</h1>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
                <Avatar>
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
                <ChevronDown size={14} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <p className="font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{user?.role}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut size={16} />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="p-6 flex-1">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;