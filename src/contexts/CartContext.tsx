import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, FishData } from '../types';

// Declare global window property for fish data
declare global {
  interface Window {
    __FISH_DATA__?: FishData[];
  }
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (uniqueId: string) => void;
  updateQuantity: (uniqueId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0
});

// Store only essential cart data to reduce storage size
interface MinimalCartItem {
  uniqueId: string;
  quantity: number;
}

function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export { useCart };

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      if (!saved) return [];

      // Parse the minimal cart data
      const minimalItems: MinimalCartItem[] = JSON.parse(saved);
      
      // Reconstruct full cart items from minimal data
      return minimalItems.map(item => {
        const fish = window.__FISH_DATA__?.find((f: FishData) => f.uniqueId === item.uniqueId);
        if (!fish) return null;
        return {
          fish,
          quantity: item.quantity
        };
      }).filter(Boolean) as CartItem[];
    } catch (error) {
      console.error('Error loading cart:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      // Store only essential data (uniqueId and quantity)
      const minimalItems: MinimalCartItem[] = items.map(item => ({
        uniqueId: item.fish.uniqueId,
        quantity: item.quantity
      }));
      
      localStorage.setItem('cart', JSON.stringify(minimalItems));
    } catch (error) {
      // If storage fails, keep the cart in memory only
      console.error('Error saving cart:', error);
    }
  }, [items]);

  const total = items.reduce((sum, item) => {
    const price = item.fish.saleCost || 0;
    return sum + (price * item.quantity);
  }, 0);

  const addItem = (newItem: CartItem) => {
    setItems(prev => {
      const existingItem = prev.find(item => item.fish.uniqueId === newItem.fish.uniqueId);
      if (existingItem) {
        return prev.map(item =>
          item.fish.uniqueId === newItem.fish.uniqueId
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (uniqueId: string) => {
    setItems(prev => prev.filter(item => item.fish.uniqueId !== uniqueId));
  };

  const updateQuantity = (uniqueId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(uniqueId);
      return;
    }
    setItems(prev => prev.map(item =>
      item.fish.uniqueId === uniqueId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem('cart');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
};