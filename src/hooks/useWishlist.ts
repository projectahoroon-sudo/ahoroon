import { useState, useEffect } from 'react';
import { Product } from '../types';
import { safeSetItem, safeGetItem } from '../lib/safeStorage';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<Product[]>([]);

  useEffect(() => {
    const savedWishlist = safeGetItem('wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (e) {}
    }
  }, []);

  const addToWishlist = (product: Product) => {
    const newWishlist = [...wishlist, product];
    setWishlist(newWishlist);
    safeSetItem('wishlist', JSON.stringify(newWishlist));
  };

  const removeFromWishlist = (id: string) => {
    const newWishlist = wishlist.filter(item => item.id !== id);
    setWishlist(newWishlist);
    safeSetItem('wishlist', JSON.stringify(newWishlist));
  };

  const isInWishlist = (id: string) => {
    return wishlist.some(item => item.id === id);
  };

  return { wishlist, addToWishlist, removeFromWishlist, isInWishlist };
}
