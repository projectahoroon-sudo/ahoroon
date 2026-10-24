import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Product, Category } from '../types';
import { safeSetItem, safeGetItem } from '../lib/safeStorage';
import { PRODUCTS as STATIC_PRODUCTS, CATEGORIES as STATIC_CATEGORIES } from '../data';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  if (
    errorMessage.includes('resource-exhausted') || 
    errorMessage.includes('Quota limit exceeded') ||
    errorMessage.includes('quota') ||
    errorMessage.includes('Quota') ||
    errorMessage.includes('EXCEEDED')
  ) {
    safeSetItem('firestoreDisabled', 'true');
  }
  console.warn(`[Firestore Notice] (${operationType} on ${path}): ${errorMessage}`);
  return null;
}

function checkFirestoreDisabled() {
  return safeGetItem('firestoreDisabled') === 'true';
}

function fetchWithTimeout<T>(promise: Promise<T>, ms = 1500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);
    promise
      .then(res => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export const storeService = {
  async getProducts(categoryId?: string) {
    const cacheKey = `products_${categoryId || 'all'}`;
    const cached = safeGetItem(cacheKey) || safeGetItem('products');

    try {
      const productsRef = collection(db, 'products');
      let q = query(productsRef, orderBy('createdAt', 'desc'));
      
      if (categoryId && categoryId !== 'all') {
        q = query(productsRef, where('category', '==', categoryId), orderBy('createdAt', 'desc'));
      }
      
      const snapshot = await fetchWithTimeout(getDocs(q), 1500);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      if (data.length > 0) {
        safeSetItem(cacheKey, JSON.stringify(data));
        safeSetItem('products', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'products');
    }

    if (cached) {
      const parsed = JSON.parse(cached) as Product[];
      if (parsed && parsed.length > 0) {
        if (categoryId && categoryId !== 'all') {
          return parsed.filter(p => p.category === categoryId);
        }
        return parsed;
      }
    }

    if (categoryId && categoryId !== 'all') {
      return STATIC_PRODUCTS.filter(p => p.category === categoryId);
    }
    return STATIC_PRODUCTS;
  },

  async getCategories() {
    const cached = safeGetItem('categories');

    try {
      const snapshot = await fetchWithTimeout(getDocs(collection(db, 'categories')), 1500);
      const data = snapshot.docs.map(doc => {
        const { id, ...rest } = doc.data() as Category;
        return { id: doc.id, ...rest };
      });
      if (data.length > 0) {
        safeSetItem('categories', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'categories');
    }

    if (cached) {
      const parsed = JSON.parse(cached) as Category[];
      if (parsed && parsed.length > 0) return parsed;
    }
    return STATIC_CATEGORIES;
  },

  async getProduct(id: string) {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await fetchWithTimeout(getDoc(docRef), 1500);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Product;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `products/${id}`);
    }
    const cached = safeGetItem('products');
    const products = cached ? JSON.parse(cached) : STATIC_PRODUCTS;
    return products.find((p: Product) => p.id === id) || STATIC_PRODUCTS.find(p => p.id === id) || null;
  },

  async getFlashSaleProducts() {
    const cached = safeGetItem('flashSaleProducts');

    try {
      const q = query(
        collection(db, 'products'), 
        where('isFlashSale', '==', true),
        limit(4)
      );
      const snapshot = await fetchWithTimeout(getDocs(q), 1500);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      if (data.length > 0) {
        safeSetItem('flashSaleProducts', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'products_flash');
    }

    if (cached) {
      const parsed = JSON.parse(cached) as Product[];
      if (parsed && parsed.length > 0) return parsed;
    }
    return STATIC_PRODUCTS.filter(p => p.isFlashSale);
  },

  async createOrder(orderData: any) {
    const path = 'orders';
    try {
      return await addDoc(collection(db, path), {
        ...orderData,
        userId: auth.currentUser?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
      // Fallback: save order locally so user order succeeds
      const existingOrders = JSON.parse(safeGetItem('orders') || '[]');
      const newOrder = {
        id: 'ord_' + Date.now(),
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      existingOrders.unshift(newOrder);
      safeSetItem('orders', JSON.stringify(existingOrders));
      return { id: newOrder.id };
    }
  }
};
