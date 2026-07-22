import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // NEW: tracks the "waiting" moment

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // NEW: show feedback the instant the button is clicked
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      setSubmitted(true);
    } finally {
      setIsLoading(false); // NEW: always runs, whether success or failure
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Forgot your password?</h1>
        <p className="text-sm text-slate-500 mb-6">Enter your email and we'll send you a link to reset it.</p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 disabled:bg-slate-100"
              required
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        ) : (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">{message}</p>
        )}

        <p className="text-sm text-slate-500 mt-6 text-center">
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;