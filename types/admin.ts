export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "customer";
  avatar?: string;
  createdAt: string;
  status: "ACTIVE" | "BLOCKED";
  mobile?: string;
  address?: string;
  lastLogin?: string;
}

export interface Artist {
  id: string;
  userId: string;
  stageName: string;
  phone?: string;
  email?: string;
  image?: string;
  bio?: string;
  totalBeats: number;
  totalSales: number;
  joinedAt: string;
  status: "active" | "pending" | "suspended";
}

export interface BeatAnalytics {
  plays: number;
  downloads: number;
  salesCount: number;
  revenue: number;
}

export interface BeatAssetUrls {
  coverImage?: string;
  bannerImage?: string;
  previewAudio?: string;
  wavFile?: string;
  stemsFile?: string;
}

export interface Beat {
  id: string;
  artistId: string;
  title: string;
  description?: string;
  relatedArtistName?: string;
  relatedArtistImage?: string;
  isTrending?: boolean;
  playCount?: number;
  genre: string;
  bpm: number;
  key: string;
  mood: string;
  type: "beat" | "song" | "vocals";
  trackType: "exclusive" | "non-exclusive";
  tags: string[];
  price: number;
  status: "DRAFT" | "AVAILABLE" | "SOLD";
  createdAt: string;
  duration?: number;
  assets: BeatAssetUrls;
  analytics: BeatAnalytics;
  ownershipsCount: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  beatIds: string[];
  beatTitles?: string[];
  totalAmount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt: string;
  paymentMethod: string;
}

export interface Activity {
  id: string;
  description: string;
  timestamp: string;
  type: "order" | "ownership" | "beat" | "system";
}

export interface Ownership {
  id: string;
  beatId: string;
  beatPublicId?: string;
  beatTitle?: string;
  beatGenre?: string;
  beatMood?: string;
  beatBpm?: number;
  beatKey?: string;
  beatDescription?: string;
  beatDuration?: number;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerMobile?: string;
  customerAddress?: string;
  artistName?: string;
  artistPublicId?: string;
  artistEmail?: string;
  artistPhone?: string;
  licenseType: "exclusive" | "non-exclusive" | "basic" | "premium";
  purchasedAt: string;
  pricePaid: number;
  currencyCode?: string;
  transactionId: string;
  paymentTransactionId?: string;
  orderId?: string;
  orderPublicId?: string;
  orderTotalAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentGateway?: string;
  orderStatus?: string;
  fulfillmentStatus?: string;
  status?: string;
  downloadCount?: number;
  maxDownloads?: number | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalArtists: number;
  totalBeats: number;
  revenueOverview: { name: string; total: number }[];
  recentOrders: (Order & { customerName: string })[];
  topArtists: {
    id: string;
    stageName: string;
    totalSales: number;
    totalBeats: number;
  }[];
  recentBeats: Beat[];
  recentActivities: Activity[];
}
