function Logomark({ size = 32 }) {
  return (
    <div
      style={{ width: size, height: size, background: "linear-gradient(135deg, #5B4FE9 0%, #22D3EE 100%)" }}
      className="rounded-lg flex items-center justify-center shrink-0"
    >
      <span className="font-display font-bold text-white" style={{ fontSize: size * 0.5 }}>S</span>
    </div>
  );
}

export default Logomark;