export function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  return new Date(parseInt(dateString)).toLocaleDateString();
}

export function getStatusColor(statusType: string): "default" | "secondary" | "outline" {
  switch (statusType) {
    case "open":
      return "default";
    case "closed":
      return "secondary";
    default:
      return "outline";
  }
}
