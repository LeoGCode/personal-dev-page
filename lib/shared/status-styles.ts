export type ProjectStatus = "active" | "in_progress" | "planned";

export const statusStyles: Record<ProjectStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  in_progress: "border-yellow-500/30 bg-yellow-500/10 text-yellow-500",
  planned: "border-blue-500/30 bg-blue-500/10 text-blue-500",
};
