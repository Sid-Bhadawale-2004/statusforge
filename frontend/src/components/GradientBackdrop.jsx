function GradientBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div
        className="absolute -top-40 -left-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "linear-gradient(135deg, #4F46E5, #7C3AED)" }}
      />
      <div
        className="absolute -bottom-32 -right-24 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: "linear-gradient(135deg, #EC4899, #4F46E5)" }}
      />
    </div>
  );
}

export default GradientBackdrop;