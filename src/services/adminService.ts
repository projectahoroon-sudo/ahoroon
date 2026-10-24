import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Product, Category, AppUser, ManualInvoice } from '../types';
import { safeSetItem, safeGetItem, safeRemoveItem } from '../lib/safeStorage';
import { 
  STATIC_SLIDERS, 
  PRODUCTS as STATIC_PRODUCTS, 
  CATEGORIES as STATIC_CATEGORIES, 
  PRODUCERS as STATIC_PRODUCERS, 
  PRESS_COVERAGES as STATIC_PRESS 
} from '../data';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
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

export const adminService = {
  async isAdmin() {
    if (!auth.currentUser) return false;
    if (auth.currentUser.email === 'reocleanproperties@gmail.com' || auth.currentUser.email === 'ahorooon@gmail.com') return true;
    
    try {
      const adminDoc = await getDoc(doc(db, 'admins', auth.currentUser.uid));
      return adminDoc.exists();
    } catch (e) {
      return false;
    }
  },

  // Products
  async getProducts() {
    const path = 'products';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      if (data.length > 0) {
        safeSetItem('products', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    const cached = safeGetItem('products');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) return parsed;
    }
    return STATIC_PRODUCTS;
  },

  async addProduct(product: Omit<Product, 'id'>) {
    const path = 'products';
    let docId = '';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      docId = docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
      docId = 'prod_' + Date.now();
    }
    // Synchronize local cached products
    const cached = safeGetItem('products');
    const existing: Product[] = cached ? JSON.parse(cached) : STATIC_PRODUCTS;
    const newProd: Product = { id: docId, ...product } as Product;
    const updatedList = [newProd, ...existing.filter(p => p.id !== docId)];
    safeSetItem('products', JSON.stringify(updatedList));
    return docId;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, 'products', id), {
        ...product,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
    // Synchronize local cached products
    const cached = safeGetItem('products');
    const existing: Product[] = cached ? JSON.parse(cached) : STATIC_PRODUCTS;
    const updatedList = existing.map(p => p.id === id ? { ...p, ...product } : p);
    safeSetItem('products', JSON.stringify(updatedList));
  },

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
    // Synchronize local cached products
    const cached = safeGetItem('products');
    if (cached) {
      const existing: Product[] = JSON.parse(cached);
      const updatedList = existing.filter(p => p.id !== id);
      safeSetItem('products', JSON.stringify(updatedList));
    }
  },

  async generateMissingProductImages(onProgress?: (current: number, total: number) => void) {
    const products = await this.getProducts();
    const missing = products.filter(p => !p.image || p.image.includes('placehold') || p.image.trim() === '');
    let updatedCount = 0;
    
    for (let i = 0; i < missing.length; i++) {
      const p = missing[i];
      if (onProgress) onProgress(i + 1, missing.length);
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: p.name }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.image) {
            await this.updateProduct(p.id, { image: data.image });
            updatedCount++;
          }
        }
      } catch (err) {
        console.error('Failed to generate image for product:', p.name, err);
      }
    }
    return { total: missing.length, updated: updatedCount };
  },

  // Categories
  async getCategories() {
    const path = 'categories';
    try {
      const snapshot = await getDocs(collection(db, path));
      const data = snapshot.docs.map(doc => {
        const { id, ...rest } = doc.data() as Category;
        return { id: doc.id, ...rest };
      });
      if (data.length > 0) {
        safeSetItem('categories', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    const cached = safeGetItem('categories');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) return parsed;
    }
    return STATIC_CATEGORIES;
  },

  async addCategory(category: Omit<Category, 'id'>) {
    const path = 'categories';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...category,
        createdAt: serverTimestamp(),
      });
      safeRemoveItem('categories');
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateCategory(id: string, category: Partial<Category>) {
    const path = `categories/${id}`;
    try {
      await updateDoc(doc(db, 'categories', id), {
        ...category,
        updatedAt: serverTimestamp(),
      });
      safeRemoveItem('categories');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteCategory(id: string) {
    const path = `categories/${id}`;
    try {
      await deleteDoc(doc(db, 'categories', id));
      safeRemoveItem('categories');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async wipeCategories() {
    const path = 'categories';
    try {
      const snapshot = await getDocs(collection(db, path));
      const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, path, docSnap.id)));
      await Promise.all(deletePromises);
      safeRemoveItem('categories');
      return true;
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
      return false;
    }
  },

  // Orders
  async getOrders() {
    const cached = safeGetItem('orders');
    if (checkFirestoreDisabled()) {
      return cached ? JSON.parse(cached) : [];
    }
    const path = 'orders';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      safeSetItem('orders', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async updateOrderStatus(id: string, status: string) {
    const path = `orders/${id}`;
    try {
      await updateDoc(doc(db, 'orders', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async resendOrderInvoice(orderId: string) {
    try {
      const response = await fetch('/api/orders/send-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          force: true, // Bypass duplicate prevention for explicit admin retry
        }),
      });
      const data = await response.json();
      // Clear cached orders so fresh status is reflected
      safeRemoveItem('orders');
      return data;
    } catch (error: any) {
      console.error("Failed to resend invoice:", error);
      return { success: false, error: error.message || error };
    }
  },

  // Users Management
  async createAdminSession(uid: string, username: string, passwordVal: string) {
    const path = `admins/${uid}`;
    try {
      await setDoc(doc(db, 'admins', uid), {
        username,
        password: passwordVal,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async getUserProfile(usernameDocId: string) {
    const path = `users/${usernameDocId}`;
    try {
      const uDoc = await getDoc(doc(db, 'users', usernameDocId));
      if (uDoc.exists()) {
        return { id: uDoc.id, ...uDoc.data() } as AppUser;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
    
    // Fallback: search all users by email, name, or ID matching usernameDocId
    try {
      const allUsers = await this.getUsers();
      const searchKey = usernameDocId.toLowerCase().trim();
      const match = allUsers.find(u => 
        (u.id && u.id.toLowerCase() === searchKey) ||
        (u.email && u.email.toLowerCase() === searchKey) ||
        (u.name && u.name.toLowerCase().replace(/\s+/g, '') === searchKey) ||
        (u.email && u.email.toLowerCase().split('@')[0] === searchKey)
      );
      if (match) return match;
    } catch (err) {
      console.warn('Fallback getUserProfile search error:', err);
    }
    return null;
  },

  async getUsers() {
    const cached = safeGetItem('users');
    if (checkFirestoreDisabled()) {
      return cached ? JSON.parse(cached) : [];
    }
    const path = 'users';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
      safeSetItem('users', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addUser(userData: Omit<AppUser, 'id'>) {
    const path = 'users';
    const docId = userData.name ? userData.name.trim().toLowerCase().replace(/\s+/g, '') : Math.random().toString(36).substring(2);
    try {
      await setDoc(doc(db, 'users', docId), {
        ...userData,
        createdAt: serverTimestamp(),
      });
      return docId;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateUser(id: string, userData: Partial<AppUser>) {
    const path = `users/${id}`;
    try {
      await updateDoc(doc(db, 'users', id), {
        ...userData,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteUser(id: string) {
    const path = `users/${id}`;
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // Manual Invoices
  async getManualInvoices() {
    const cached = safeGetItem('manualInvoices');
    if (checkFirestoreDisabled()) {
      return cached ? JSON.parse(cached) : [];
    }
    const path = 'manualInvoices';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManualInvoice));
      safeSetItem('manualInvoices', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      return cached ? JSON.parse(cached) : [];
    }
  },

  async addManualInvoice(invoice: Omit<ManualInvoice, 'id'>) {
    const path = 'manualInvoices';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...invoice,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateManualInvoice(id: string, invoice: Partial<ManualInvoice>) {
    const path = `manualInvoices/${id}`;
    try {
      await updateDoc(doc(db, 'manualInvoices', id), {
        ...invoice,
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteManualInvoice(id: string) {
    const path = `manualInvoices/${id}`;
    try {
      await deleteDoc(doc(db, 'manualInvoices', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // Sliders
  async getSliders() {
    const path = 'sliders';
    try {
      const q = query(collection(db, path), orderBy('order', 'asc'));
      const snapshot = await fetchWithTimeout(getDocs(q), 1500);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (data.length > 0) {
        safeSetItem('sliders', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    const cached = safeGetItem('sliders');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) return parsed;
    }
    return STATIC_SLIDERS;
  },

  async addSlider(slider: { imageUrl: string; title: string; description: string; link: string; order: number }) {
    const path = 'sliders';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...slider,
        createdAt: serverTimestamp(),
      });
      safeRemoveItem('sliders');
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateSlider(id: string, slider: Partial<{ imageUrl: string; title: string; description: string; link: string; order: number }>) {
    const path = `sliders/${id}`;
    try {
      await updateDoc(doc(db, 'sliders', id), {
        ...slider,
        updatedAt: serverTimestamp(),
      });
      safeRemoveItem('sliders');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteSlider(id: string) {
    const path = `sliders/${id}`;
    try {
      await deleteDoc(doc(db, 'sliders', id));
      safeRemoveItem('sliders');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
      const cached = safeGetItem('sliders');
      if (cached) {
        const sliders = JSON.parse(cached);
        const filtered = sliders.filter((s: any) => s.id !== id);
        safeSetItem('sliders', JSON.stringify(filtered));
      }
    }
  },

  // Producers
  async getProducers() {
    const path = 'producers';
    try {
      const q = query(collection(db, path), orderBy('order', 'asc'));
      const snapshot = await fetchWithTimeout(getDocs(q), 1500);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (data.length > 0) {
        safeSetItem('producers', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    const cached = safeGetItem('producers');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) return parsed;
    }
    return STATIC_PRODUCERS;
  },

  async addProducer(producer: { name: string; role: string; img: string; story: string; order: number }) {
    const path = 'producers';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...producer,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateProducer(id: string, producer: Partial<{ name: string; role: string; img: string; story: string; order: number }>) {
    const path = `producers/${id}`;
    try {
      await updateDoc(doc(db, 'producers', id), {
        ...producer,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteProducer(id: string) {
    const path = `producers/${id}`;
    try {
      await deleteDoc(doc(db, 'producers', id));
      safeRemoveItem('producers');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // Press / News Coverages
  async getPress() {
    const path = 'press';
    try {
      const q = query(collection(db, path), orderBy('order', 'asc'));
      const snapshot = await fetchWithTimeout(getDocs(q), 1500);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (data.length > 0) {
        safeSetItem('press', JSON.stringify(data));
        return data;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
    const cached = safeGetItem('press');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.length > 0) return parsed;
    }
    return STATIC_PRESS;
  },

  async addPress(press: { source: string; title: string; excerpt: string; img: string; link: string; date: string; order: number }) {
    const path = 'press';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...press,
        createdAt: serverTimestamp(),
      });
      safeRemoveItem('press');
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updatePress(id: string, press: Partial<{ source: string; title: string; excerpt: string; img: string; link: string; date: string; order: number }>) {
    const path = `press/${id}`;
    try {
      await updateDoc(doc(db, 'press', id), {
        ...press,
        updatedAt: serverTimestamp(),
      });
      safeRemoveItem('press');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deletePress(id: string) {
    const path = `press/${id}`;
    try {
      await deleteDoc(doc(db, 'press', id));
      safeRemoveItem('press');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  async getSettings() {
    const path = 'settings/general';
    try {
      const docRef = doc(db, 'settings', 'general');
      const snap = await fetchWithTimeout(getDoc(docRef), 1500);
      if (snap.exists()) {
        const data = snap.data() as { logoUrl?: string; footerLogoUrl?: string };
        if (data && data.logoUrl) {
          safeSetItem('siteLogo', data.logoUrl);
        }
        if (data && data.footerLogoUrl) {
          safeSetItem('siteFooterLogo', data.footerLogoUrl);
        }
        return data;
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  async updateSettings(settings: { logoUrl?: string; footerLogoUrl?: string }) {
    const path = 'settings/general';
    try {
      const docRef = doc(db, 'settings', 'general');
      // Merge with existing so we don't accidentally overwrite if only one is updated
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      if (settings.logoUrl) {
        safeSetItem('siteLogo', settings.logoUrl);
        window.dispatchEvent(new Event('siteLogoUpdated'));
      }
      if (settings.footerLogoUrl) {
        safeSetItem('siteFooterLogo', settings.footerLogoUrl);
        window.dispatchEvent(new Event('siteFooterLogoUpdated'));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  },

  // Courier Automation (Steadfast / Pathao / RedX)
  async bookCourier(bookingData: {
    orderId: string;
    courierProvider: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    codAmount: number;
    note?: string;
    apiKey?: string;
    secretKey?: string;
  }) {
    try {
      const response = await fetch('/api/courier/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Courier booking failed');
      }
      safeRemoveItem('orders');
      return data;
    } catch (e: any) {
      console.error('bookCourier error:', e);
      throw e;
    }
  },

  async getCourierSettings() {
    try {
      const docRef = doc(db, 'settings', 'courier');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        safeSetItem('courierSettings', JSON.stringify(data));
        return data;
      }
      const local = safeGetItem('courierSettings');
      return local ? JSON.parse(local) : null;
    } catch (e) {
      const local = safeGetItem('courierSettings');
      return local ? JSON.parse(local) : null;
    }
  },

  async updateCourierSettings(settings: any) {
    try {
      const docRef = doc(db, 'settings', 'courier');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      safeSetItem('courierSettings', JSON.stringify(settings));
    } catch (e) {
      safeSetItem('courierSettings', JSON.stringify(settings));
    }
  },

  async factoryReset() {
    const collectionsToClear = [
      'products',
      'categories',
      'orders',
      'manualInvoices',
      'sliders',
      'producers',
      'press'
    ];
    
    try {
      for (const collName of collectionsToClear) {
        const snapshot = await getDocs(collection(db, collName));
        const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, collName, docSnap.id)));
        await Promise.all(deletePromises);
      }
      return true;
    } catch (error) {
      console.error('Factory reset failed:', error);
      handleFirestoreError(error, OperationType.DELETE, 'multiple-collections');
      return false;
    }
  }
};
