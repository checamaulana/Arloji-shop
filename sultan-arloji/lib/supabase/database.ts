import type { OrderItem } from "../../types/order";

type StockStatus = "in_stock" | "out_of_stock";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  photos: string[];
  stock_status: StockStatus;
  whatsapp_clicks: number;
  created_at: string | null;
  updated_at: string | null;
};

type Order = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item: OrderItem;
  total_price: number;
  status: "active" | "completed";
  created_at: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

type Store = {
  id: string;
  name: string;
  logo_url: string;
  whatsapp_number: string;
  bio: string;
  updated_at: string | null;
};

type Visit = { date: string; pageviews: number; last_updated: string | null };

type Table<Row, RequiredOnInsert extends keyof Row> = {
  Row: Row;
  Insert: Pick<Row, RequiredOnInsert> & Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      products: Table<Product, "name" | "price">;
      orders: Table<Order, "customer_name" | "customer_phone" | "delivery_address" | "item" | "total_price">;
      stores: Table<Store, "id">;
      analytics_visits: Table<Visit, "date">;
    };
    Views: Record<never, never>;
    Functions: {
      place_order: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_delivery_address: string;
          p_item: OrderItem;
          p_total_price: number;
        };
        Returns: string;
      };
      record_visit: { Args: { p_date: string }; Returns: undefined };
      count_visits: { Args: { p_start: string | null; p_end: string | null }; Returns: number };
    };
  };
};
