import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

import SetPasswordForm from "../components/SetPasswordForm";

function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
      <button onClick={logout} className="mt-2 text-sm text-blue-600">Log out</button>
      <SetPasswordForm />
      <Link to="/services" className="text-blue-600 text-sm">Manage Services →</Link>
      <br></br>
      <Link to="/team" className="text-blue-600 text-sm">Manage Team →</Link>
      <Link to="/schedules" className="text-blue-600 text-sm">On-Call Schedules →</Link>
    </div>
  );
}

export default DashboardPage;