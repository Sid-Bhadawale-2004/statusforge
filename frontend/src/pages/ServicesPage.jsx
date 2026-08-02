import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import AppLayout from "../components/AppLayout";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

function ServicesPage() {
  const { accessToken, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    api.get("/api/services", authHeader)
      .then((res) => setServices(res.data.services))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/services", { name, description }, authHeader);
      setServices((prev) => [res.data.service, ...prev]);
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
      setServices((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete service.");
    }
  };

  return (
    <AppLayout title="Services">
      <div className="max-w-3xl space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Add a service</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate}>
                {formError && (
                  <p className="text-sm text-error bg-error-bg rounded-lg px-3 py-2 mb-3">{formError}</p>
                )}
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Service name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="flex-1 border border-border bg-background rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <Button type="submit" disabled={isSubmitting} className="whitespace-nowrap">
                    <Plus size={16} />
                    {isSubmitting ? "Adding..." : "Add"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <div className="divide-y divide-border">
            {isLoading ? (
              <p className="p-5 text-sm text-muted-foreground">Loading services...</p>
            ) : services.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No services yet.</p>
            ) : (
              services.map((service) => (
                <div key={service._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{service.name}</p>
                    {service.description && (
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={service.currentStatus} />
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(service._id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete service"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

export default ServicesPage;