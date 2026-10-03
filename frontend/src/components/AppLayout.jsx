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
    <div className="px-4 pt-4">
      <Badge variant={variant} className="w-full justify-center rounded-md py-1.5 text-[11px] font-medium">
        <span className="mr-1.5 size-1.5 rounded-full bg-current" aria-hidden="true" />
        {text}
      </Badge>
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
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-border bg-card md:min-h-screen md:w-60 md:border-b-0 md:border-r lg:w-64">
        <div className="brand-gradient relative overflow-hidden px-5 py-5">
          <div className="absolute -right-8 -top-10 size-28 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Logomark size={30} />
              <div>
                <p className="font-display text-base font-bold leading-tight tracking-tight text-white">StatusForge</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/65">Command center</p>
              </div>
            </div>
            <Badge className="border-white/20 bg-white/15 px-2 text-[10px] text-white">Free</Badge>
          </div>
        </div>

        <OrgStatusStrip />

        <nav aria-label="Primary navigation" className="flex flex-1 gap-1 overflow-x-auto px-3 py-5 md:flex-col md:overflow-visible">
          <p className="hidden px-3 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 md:block">Workspace</p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex min-w-fit items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isActive
                    ? "brand-gradient font-semibold text-white shadow-[0_8px_20px_-12px_#7c3aed]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-border p-3 md:block">
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">Account</p>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="size-9 border border-border">
                <AvatarFallback className="bg-secondary font-display text-xs font-bold text-primary">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">{user?.name}</span>
                <span className="block truncate font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{user?.role}</span>
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium text-foreground">{user?.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{user?.role}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut size={16} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:block">StatusForge / Workspace</p>
              <h1 className="truncate font-display text-lg font-semibold tracking-tight text-foreground">{title}</h1>
            </div>
            <div className="flex items-center gap-2 md:hidden">
              <Avatar className="size-8 border border-border">
                <AvatarFallback className="bg-secondary font-display text-xs font-bold text-primary">{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;
