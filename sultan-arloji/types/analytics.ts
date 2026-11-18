export interface AnalyticsVisitDocument {
  date: string; // YYYY-MM-DD
  pageviews: number;
  last_updated?: any;
}

export interface AnalyticsStats {
  today: number;
  last_7_days: number;
  last_30_days: number;
  all_time: number;
}
