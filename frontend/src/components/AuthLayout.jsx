import Logomark from "./Logomark";

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logomark size={40} />
          <p className="font-display text-2xl font-semibold text-foreground mt-3">StatusForge</p>
          <p className="text-sm text-muted-foreground font-mono mt-1">incident response, handled</p>
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;