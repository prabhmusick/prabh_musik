import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "../services/dashboard.service";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["admin", "dashboardMetrics"],
    queryFn: getDashboardMetrics,
  });
};
