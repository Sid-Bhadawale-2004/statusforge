import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";

function ServicesPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state for adding a new service
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  // Fetch services once, when this page first loads
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get("/api/services", authHeader);
        setServices(res.data.services);
      } catch (err) {
        setError("Failed to load services.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []); // empty array = run once, when the component first appears

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/services", { name, description }, authHeader);
      setServices((prev) => [res.data.service, ...prev]); // add new service to the top instantly
      setName("");
      setDescription("");
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service? This cannot be undone.")) return;
    try {
      await api.delete(`/api/services/${id}`, authHeader);
      setServices((prev) => prev.filter((s) => s._id !== id)); // remove it from the list instantly
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete service.");
    }
  };

  if (isLoading) return <div className="p-8">Loading services...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Services</h1>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      {isAdmin && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg shadow mb-6 space-y-3">
          <h2 className="font-semibold text-slate-700">Add a new service</h2>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <input
            type="text"
            placeholder="Service name (e.g. Payments API)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-slate-800 text-white px-4 py-2 rounded disabled:bg-slate-400"
          >
            {isSubmitting ? "Adding..." : "Add Service"}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow divide-y">
        {services.length === 0 ? (
          <p className="p-4 text-slate-500 text-sm">No services yet.</p>
        ) : (
          services.map((service) => (
            <div key={service._id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-slate-500">{service.description}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={service.currentStatus} />
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(service._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ServicesPage;