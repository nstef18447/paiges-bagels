'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  size: string | null;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  drawerOpen: boolean;
  addToCart: (item: CartItem) => void;
  removeCartItem: (index: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export default function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.findIndex(
        c => c.productId === item.productId && c.size === item.size
      );
      if (existing >= 0) {
        return prev.map((c, i) =>
          i === existing ? { ...c, quantity: c.quantity + item.quantity } : c
        );
      }
      return [...prev, item];
    });
    setDrawerOpen(true);
  }, []);

  const removeCartItem = useCallback((index: number) => {
    setCart(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setDrawerOpen(false);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setDrawerOpen(false);
  }, []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <CartContext.Provider
      value={{
        cart, cartCount, cartTotal,
        drawerOpen, addToCart, removeCartItem, clearCart,
        openDrawer, closeDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
