import { Badge } from "./ui/badge";

const variantMap = {
  operational: "success",
  degraded: "warning",
  outage: "error",
};

function StatusBadge({ status }) {
  return (
    <Badge variant={variantMap[status]}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </Badge>
  );
}

export default StatusBadge;