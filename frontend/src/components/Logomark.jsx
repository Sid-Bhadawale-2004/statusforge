function Logomark({ size = 32 }) {
  return (
    <div
      aria-label="StatusForge logo"
      role="img"
      style={{ width: size, height: size }}
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.16)]"
    >
      <span
        aria-hidden="true"
        style={{ width: size * 0.42, height: size * 0.42 }}
        className="absolute rotate-45 rounded-[4px] bg-gradient-to-br from-cyan-300 via-violet-400 to-fuchsia-500 shadow-[0_0_14px_rgba(129,140,248,0.7)]"
      />
      <span
        aria-hidden="true"
        style={{ width: size * 0.25, height: size * 0.25 }}
        className="relative rounded-[2px] bg-slate-950"
      />
    </div>
  );
}

export default Logomark;
