import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

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

  // Form state
  const [rotationMembers, setRotationMembers] = useState([]); // ordered array of user IDs
  const [rotationType, setRotationType] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load services + team members once, on page load
  useEffect(() => {
    api.get("/api/services", authHeader).then((res) => setServices(res.data.services));
    api.get("/api/team", authHeader).then((res) => setTeamMembers(res.data.members));
  }, []);

  // Whenever the selected service changes, fetch ITS schedule (or find there isn't one)
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
        setStartDate(res.data.schedule.startDate.slice(0, 10)); // YYYY-MM-DD for the date input
      })
      .catch(() => {
        // No schedule yet for this service — that's fine, just means we're creating one
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
      // Re-fetch to get the freshly computed currentOnCall
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
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">On-Call Schedule</h1>

      <select
        value={selectedServiceId}
        onChange={(e) => setSelectedServiceId(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-6"
      >
        <option value="">Select a service...</option>
        {services.map((s) => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>

      {selectedServiceId && isLoadingSchedule && <p className="text-slate-500">Loading schedule...</p>}

      {selectedServiceId && !isLoadingSchedule && (
        <>
          {currentOnCall && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">Currently on-call</p>
              <p className="text-lg font-semibold text-blue-900">{currentOnCall.name}</p>
              <p className="text-sm text-blue-600">{currentOnCall.email}</p>
            </div>
          )}

          {isAdmin && (
            <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg shadow space-y-4">
              <h2 className="font-semibold text-slate-700">
                {schedule ? "Edit rotation" : "Create rotation"}
              </h2>
              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Team members (click to add/remove)</p>
                <div className="flex flex-wrap gap-2">
                  {teamMembers.map((m) => (
                    <button
                      type="button"
                      key={m._id}
                      onClick={() => toggleMember(m._id)}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        rotationMembers.includes(m._id)
                          ? "bg-slate-800 text-white border-slate-800"
                          : "bg-white text-slate-600 border-slate-300"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {rotationMembers.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Rotation order</p>
                  <ol className="space-y-1">
                    {rotationMembers.map((id, index) => (
                      <li key={id} className="flex items-center justify-between bg-slate-50 rounded px-3 py-2">
                        <span className="text-sm">{index + 1}. {getMemberName(id)}</span>
                        <div className="flex gap-1">
                          <button type="button" onClick={() => moveMember(index, -1)} className="text-slate-500 hover:text-slate-800 text-sm">↑</button>
                          <button type="button" onClick={() => moveMember(index, 1)} className="text-slate-500 hover:text-slate-800 text-sm">↓</button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="flex gap-4">
                <select value={rotationType} onChange={(e) => setRotationType(e.target.value)} className="border rounded px-3 py-2">
                  <option value="daily">Daily rotation</option>
                  <option value="weekly">Weekly rotation</option>
                </select>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border rounded px-3 py-2"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-slate-800 text-white px-4 py-2 rounded disabled:bg-slate-400"
              >
                {isSubmitting ? "Saving..." : schedule ? "Update Schedule" : "Create Schedule"}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default ScheduleBuilderPage;