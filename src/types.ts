export interface FishData {
  id?: string;          // Database ID
  uniqueId: string;     // Unique identifier for React keys
  name: string;         // Full original name for display
  searchName: string;   // Clean name for search
  cost?: string;        // Display cost
  originalCost?: number; // Original cost before markup
  saleCost?: number;    // Cost after markup
  size?: string;
  description?: string;
  category?: string;
  searchUrl?: string;
  isCategory?: boolean;  // Indicates if this is a category header (used in client)
  is_category?: boolean; // Database column name for category flag
  imageUrl?: string;     // URL of the fish image
  quantity?: number;     // Quantity in cart
  disabled?: boolean;    // Whether the item is disabled
  archived?: boolean;    // Whether the item is archived
  qtyoh?: number;       // Quantity on hand (lowercase to match DB column)
  ebay_listing_id?: string;  // eBay listing ID
  ebay_listing_status?: string;  // eBay listing status
  sold_out?: boolean;   // Whether the item is sold out (out of stock)
}

export interface CartItem {
  fish: FishData;
  quantity: number;
}

export interface BulkAction {
  type: 'disable' | 'enable' | 'markup' | 'cost';
  value?: number;
}

export interface CategoryStats {
  name: string;
  total: number;
  active: number;
  disabled: number;
  status: 'active' | 'disabled';
}

export interface Stats {
  items: {
    total: number;
    active: number;
    disabled: number;
  };
  categories: {
    total: number;
    active: number;
    disabled: number;
    list: CategoryStats[];
  };
}