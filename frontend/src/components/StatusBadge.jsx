const styles = {
  operational: "bg-green-100 text-green-700",
  degraded: "bg-yellow-100 text-yellow-700",
  outage: "bg-red-100 text-red-700",
};

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export default StatusBadge;