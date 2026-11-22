export interface OrderItem {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  photo_url?: string;
}

export interface OrderDocument {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  item: OrderItem;
  total_price: number;
  status: "active" | "completed";
  created_at?: string | null;
  completed_at?: string | null;
}
