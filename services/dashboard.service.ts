import { getOrders } from "./order.service";
import { getBeats } from "./beat.service";
import { getUsers } from "./user.service";
import { getArtists } from "./artist.service";
import { localActivities } from "./db";
import { DashboardMetrics } from "../types/admin";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  const [orders, beats, users, artists] = await Promise.all([
    getOrders(),
    getBeats(),
    getUsers(),
    getArtists()
  ]);

  // Derive total revenue from completed orders
  const totalRevenue = orders
    .filter(order => order.status === "COMPLETED")
    .reduce((acc, order) => acc + order.totalAmount, 0);

  const revenueOverview = [
    { name: "Jan", total: 1800 },
    { name: "Feb", total: 2400 },
    { name: "Mar", total: 3100 },
    { name: "Apr", total: 2900 },
    { name: "May", total: 4200 },
    { name: "Jun", total: totalRevenue || 1200 }, // Fallback to avoid visual emptiness
  ];

  const recentOrders = orders.map(order => {
    const user = users.find(u => u.id === order.customerId);
    return {
      ...order,
      customerName: user ? user.name : "Unknown Customer"
    };
  });

  const topArtists = artists
    .filter(a => a.status === "active")
    .map(artist => ({
      id: artist.id,
      stageName: artist.stageName,
      totalSales: artist.totalSales,
      totalBeats: artist.totalBeats
    }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 3);

  // Return dynamic KPIs, recent beats and the activity log feed
  return {
    totalRevenue,
    totalOrders: orders.length,
    totalUsers: users.length,
    totalArtists: artists.filter(a => a.status === "active").length,
    totalBeats: beats.filter(b => b.status === "AVAILABLE").length, // Count only available beats as active
    revenueOverview,
    recentOrders,
    topArtists,
    recentBeats: beats.slice(0, 3),
    recentActivities: localActivities.slice(0, 8)
  };
}
