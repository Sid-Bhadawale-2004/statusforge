import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

function ScheduleBuilderPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [services, setServices] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const [schedule, setSchedule] = useState(null);
  const [currentOnCall, setCurrentOnCall] = useState(null);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

  const [rotationMembers, setRotationMembers] = useState([]);
  const [rotationType, setRotationType] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    api.get("/api/services", authHeader).then((res) => setServices(res.data.services));
    api.get("/api/team", authHeader).then((res) => setTeamMembers(res.data.members));
  }, []);

  useEffect(() => {
    if (!selectedServiceId) return;

    setIsLoadingSchedule(true);
    setSchedule(null);
    setCurrentOnCall(null);
    setError("");

    api
      .get(`/api/schedules/service/${selectedServiceId}`, authHeader)
      .then((res) => {
        setSchedule(res.data.schedule);
        setCurrentOnCall(res.data.currentOnCall);
        setRotationMembers(res.data.schedule.rotationMembers.map((m) => m._id));
        setRotationType(res.data.schedule.rotationType);
        setStartDate(res.data.schedule.startDate.slice(0, 10));
      })
      .catch(() => {
        setSchedule(null);
        setRotationMembers([]);
        setRotationType("weekly");
        setStartDate("");
      })
      .finally(() => setIsLoadingSchedule(false));
  }, [selectedServiceId]);

  const toggleMember = (userId) => {
    setRotationMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const moveMember = (index, direction) => {
    setRotationMembers((prev) => {
      const updated = [...prev];
      const swapWith = index + direction;
      if (swapWith < 0 || swapWith >= updated.length) return prev;
      [updated[index], updated[swapWith]] = [updated[swapWith], updated[index]];
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (rotationMembers.length === 0) {
      setError("Select at least one rotation member.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { rotationMembers, rotationType, startDate };
      let res;
      if (schedule) {
        res = await api.put(`/api/schedules/${schedule._id}`, payload, authHeader);
      } else {
        res = await api.post("/api/schedules", { serviceId: selectedServiceId, ...payload }, authHeader);
      }
      setSchedule(res.data.schedule);
      const refreshed = await api.get(`/api/schedules/service/${selectedServiceId}`, authHeader);
      setCurrentOnCall(refreshed.data.currentOnCall);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMemberName = (id) => teamMembers.find((m) => m._id === id)?.name || "Unknown";

  return (
    <AppLayout title="On-call schedules">
      <div className="max-w-2xl space-y-6">
        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Select a service...</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        {selectedServiceId && isLoadingSchedule && (
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        )}

        {selectedServiceId && !isLoadingSchedule && (
          <>
            {currentOnCall && (
              <Card className="bg-accent border-accent">
                <CardContent className="pt-5">
                  <p className="text-xs text-accent-foreground font-mono mb-1">Currently on-call</p>
                  <p className="font-display text-lg font-semibold text-foreground">{currentOnCall.name}</p>
                  <p className="text-sm text-muted-foreground font-mono">{currentOnCall.email}</p>
                </CardContent>
              </Card>
            )}

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle>{schedule ? "Edit rotation" : "Create rotation"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div>
                      <p className="text-xs text-muted-foreground font-mono mb-2">Team members</p>
                      <div className="flex flex-wrap gap-2">
                        {teamMembers.map((m) => (
                          <button
                            type="button"
                            key={m._id}
                            onClick={() => toggleMember(m._id)}
                            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                              rotationMembers.includes(m._id)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card text-muted-foreground border-border hover:border-primary/30"
                            }`}
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {rotationMembers.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground font-mono mb-2">Rotation order</p>
                        <ol className="space-y-1.5">
                          {rotationMembers.map((id, index) => (
                            <li
                              key={id}
                              className="flex items-center justify-between bg-muted rounded-lg px-3 py-2"
                            >
                              <span className="text-sm text-foreground font-mono">
                                {index + 1}. {getMemberName(id)}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveMember(index, -1)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Move up"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveMember(index, 1)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                  aria-label="Move down"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <select
                        value={rotationType}
                        onChange={(e) => setRotationType(e.target.value)}
                        className="h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="daily">Daily rotation</option>
                        <option value="weekly">Weekly rotation</option>
                      </select>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 rounded-lg border border-border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving..." : schedule ? "Update schedule" : "Create schedule"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

export default ScheduleBuilderPage;