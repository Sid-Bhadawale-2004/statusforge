import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import AuthLayout from "../components/AuthLayout";
import { Button } from "../components/ui/button";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      setMessage(res.data.message);
      setSubmitted(true);
    } catch (err) {
      setMessage("Something went wrong. Please try again.");
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-lg font-semibold text-foreground mb-2">Forgot your password?</h1>
      <p className="text-sm text-muted-foreground mb-6">Enter your email and we'll send you a link to reset it.</p>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border bg-card rounded-lg px-3 py-2 text-sm disabled:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            required
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-success bg-success-bg rounded-lg p-3">{message}</p>
      )}

      <p className="text-sm text-muted-foreground mt-6 text-center">
        <Link to="/login" className="text-primary hover:underline">Back to login</Link>
      </p>
    </AuthLayout>
  );
}

export default ForgotPasswordPage;