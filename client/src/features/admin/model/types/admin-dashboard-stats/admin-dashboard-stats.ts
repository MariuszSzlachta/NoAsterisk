export interface AdminDashboardStats {
  readonly totalUsers: number;
  readonly activeToday: number;
  readonly blockedCount: number;
  readonly availableCodes: number;
  readonly usedCodes: number;
}
