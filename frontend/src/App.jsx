import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    api.get("/health")
      .then((res) => setStatus(res.data.status))
      .catch(() => setStatus("backend not reachable"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="p-6 bg-white rounded-xl shadow">
        <h1 className="text-2xl font-bold text-slate-800">StatusForge</h1>
        <p className="mt-2 text-slate-600">Backend status: <span className="font-mono">{status}</span></p>
      </div>
    </div>
  );
}

export default App;