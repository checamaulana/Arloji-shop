import { StoreDocument } from "@/types/store";
import { ProductDocument } from "@/types/product";

export const initialStoreData: StoreDocument = {
  name: "Sultan Arloji",
  logo_url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=80",
  whatsapp_number: "6281234567890",
  bio: "Spesialis jam tangan mewah & berkelas. Original & garansi terpercaya. Pengiriman ke seluruh Indonesia.",
};

export const initialProducts: Omit<ProductDocument, "id">[] = [
  {
    name: "Rolex Submariner Date 41mm Oystersteel Dial Hitam",
    price: 245000000,
    description: "Kondisi sangat mulus 99%, Fullset Box & Paper. Bezel keramik Cerachrom hitam tahan gores, otomatis cal. 3235.",
    photos: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1547996160-71dfabbce5ed?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"
    ],
    stock_status: "in_stock",
    whatsapp_clicks: 34,
  },
  {
    name: "Rolex GMT-Master II 'Batgirl' Jubilee Bezel Biru Hitam",
    price: 285000000,
    description: "Jubilee bracelet, dial hitam dengan aksen jarum biru GMT. Mesin Calibre 3285 power reserve 70 jam. Mint condition.",
    photos: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80"
    ],
    stock_status: "in_stock",
    whatsapp_clicks: 58,
  },
  {
    name: "Patek Philippe Nautilus 5711/1A-010 Blue Dial",
    price: 1350000000,
    description: "Ikon horologi dunia. Dial biru horizontal embossing yang legendaris, stainless steel case, ultra-thin self-winding movement.",
    photos: [
      "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80"
    ],
    stock_status: "in_stock",
    whatsapp_clicks: 42,
  },
  {
    name: "Audemars Piguet Royal Oak Selfwinding 41mm Dial Hitam",
    price: 620000000,
    description: "Pola dial 'Grande Tapisserie' hitam khas Royal Oak. Bezel oktagonal dengan 8 baut heksagonal emas putih. Fullset 2023.",
    photos: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80"
    ],
    stock_status: "in_stock",
    whatsapp_clicks: 19,
  },
  {
    name: "Hublot Big Bang Unico Titanium Ceramic 42mm",
    price: 210000000,
    description: "Skeleton dial memperlihatkan mekanisme kronograf flyback buatan in-house Unico. Bezel keramik satin-finished hitam.",
    photos: [
      "https://images.unsplash.com/photo-1547996160-71dfabbce5ed?w=800&auto=format&fit=crop&q=80"
    ],
    stock_status: "in_stock",
    whatsapp_clicks: 15,
  }
];
