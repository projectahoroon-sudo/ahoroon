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
  if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota limit exceeded')) {
    safeSetItem('firestoreDisabled', 'true');
  }
  const errInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function checkFirestoreDisabled() {
  return safeGetItem('firestoreDisabled') === 'true';
}

export const storeService = {
  async getProducts(categoryId?: string) {
    if (checkFirestoreDisabled()) {
      const cached = safeGetItem(`products_${categoryId || 'all'}`);
      return cached ? JSON.parse(cached) : [];
    }
    const cacheKey = `products_${categoryId || 'all'}`;
    const cached = safeGetItem(cacheKey);
    if (cached) return JSON.parse(cached) as Product[];

    const productsRef = collection(db, 'products');
    let q = query(productsRef, orderBy('createdAt', 'desc'));
    
    if (categoryId && categoryId !== 'all') {
      q = query(productsRef, where('category', '==', categoryId), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    safeSetItem(cacheKey, JSON.stringify(data));
    return data;
  },

  async getCategories() {
    if (checkFirestoreDisabled()) {
      const cached = safeGetItem('categories');
      return cached ? JSON.parse(cached) : [];
    }
    const cached = safeGetItem('categories');
    if (cached) return JSON.parse(cached) as Category[];

    const snapshot = await getDocs(collection(db, 'categories'));
    const data = snapshot.docs.map(doc => {
      const { id, ...rest } = doc.data() as Category;
      return { id: doc.id, ...rest };
    });
    safeSetItem('categories', JSON.stringify(data));
    return data;
  },

  async getProduct(id: string) {
    if (checkFirestoreDisabled()) {
      return null;
    }
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  },

  async getFlashSaleProducts() {
    if (checkFirestoreDisabled()) {
      const cached = safeGetItem('flashSaleProducts');
      return cached ? JSON.parse(cached) : [];
    }
    const cached = safeGetItem('flashSaleProducts');
    if (cached) return JSON.parse(cached) as Product[];

    const q = query(
      collection(db, 'products'), 
      where('isFlashSale', '==', true),
      limit(4)
    );
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    safeSetItem('flashSaleProducts', JSON.stringify(data));
    return data;
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
    }
  }
};
