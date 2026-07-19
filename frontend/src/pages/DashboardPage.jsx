import { useAuth } from "../context/AuthContext";
import SetPasswordForm from "../components/SetPasswordForm";

function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold">Welcome, {user?.name}</h1>
      <button onClick={logout} className="mt-2 text-sm text-blue-600">Log out</button>
      <SetPasswordForm />
    </div>
  );
}

export default DashboardPage;