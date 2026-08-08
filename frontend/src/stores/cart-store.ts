"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Voucher } from "@/lib/mocks/vouchers";
export type CartItem = Pick<Voucher, "id" | "brand" | "title" | "price" | "originalPrice" | "imageTone"> & { quantity: number };
type CartState = { items: CartItem[]; add: (voucher: Voucher) => void; updateQuantity: (id: string, quantity: number) => void; remove: (id: string) => void; clear: () => void };
export const useCartStore = create<CartState>()(persist((set) => ({ items: [], add: (voucher) => set((state) => { const found = state.items.find((item) => item.id === voucher.id); return { items: found ? state.items.map((item) => item.id === voucher.id ? { ...item, quantity: item.quantity + 1 } : item) : [...state.items, { id: voucher.id, brand: voucher.brand, title: voucher.title, price: voucher.price, originalPrice: voucher.originalPrice, imageTone: voucher.imageTone, quantity: 1 }] }; }), updateQuantity: (id, quantity) => set((state) => ({ items: quantity <= 0 ? state.items.filter((item) => item.id !== id) : state.items.map((item) => item.id === id ? { ...item, quantity } : item) })), remove: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })), clear: () => set({ items: [] }) }), { name: "ec-voucher-cart" }));
