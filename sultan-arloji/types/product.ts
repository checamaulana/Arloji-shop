export interface ProductDocument {
  id: string;
  name: string;
  price: number;
  description?: string;
  photos: string[];
  stock_status: "in_stock" | "out_of_stock";
  whatsapp_clicks: number;
  created_at?: string | null;
  updated_at?: string | null;
}
