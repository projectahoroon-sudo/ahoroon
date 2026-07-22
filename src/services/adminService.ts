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
  if (errorMessage.includes('resource-exhausted') || errorMessage.includes('Quota limit exceeded')) {
    safeSetItem('firestoreDisabled', 'true');
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
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
    if (checkFirestoreDisabled()) {
      const cached = safeGetItem('products');
      return cached ? JSON.parse(cached) : [];
    }
    const path = 'products';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      safeSetItem('products', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
  },

  async addProduct(product: Omit<Product, 'id'>) {
    const path = 'products';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...product,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      safeRemoveItem('products');
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const path = `products/${id}`;
    try {
      await updateDoc(doc(db, 'products', id), {
        ...product,
        updatedAt: serverTimestamp(),
      });
      safeRemoveItem('products');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  },

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
      safeRemoveItem('products');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // Categories
  async getCategories() {
    if (checkFirestoreDisabled()) {
      const cached = safeGetItem('categories');
      return cached ? JSON.parse(cached) : [];
    }
    const path = 'categories';
    try {
      const snapshot = await getDocs(collection(db, path));
      const data = snapshot.docs.map(doc => {
        const { id, ...rest } = doc.data() as Category;
        return { id: doc.id, ...rest };
      });
      safeSetItem('categories', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
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
    if (checkFirestoreDisabled()) {
        const cached = safeGetItem('orders');
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
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
    }
  },

  async getUsers() {
    if (checkFirestoreDisabled()) {
        const cached = safeGetItem('users');
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
    if (checkFirestoreDisabled()) {
        const cached = safeGetItem('manualInvoices');
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
    const cached = safeGetItem('sliders');
    if (cached) return JSON.parse(cached) as any[];

    const path = 'sliders';
    try {
      const q = query(collection(db, path), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      safeSetItem('sliders', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
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
    if (checkFirestoreDisabled()) {
      const cached = safeGetItem('sliders');
      if (cached) {
        const sliders = JSON.parse(cached);
        const filtered = sliders.filter((s: any) => s.id !== id);
        safeSetItem('sliders', JSON.stringify(filtered));
      }
      return;
    }
    const path = `sliders/${id}`;
    try {
      await deleteDoc(doc(db, 'sliders', id));
      safeRemoveItem('sliders');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, path);
    }
  },

  // Producers
  async getProducers() {
    const cached = safeGetItem('producers');
    if (cached) return JSON.parse(cached) as any[];

    const path = 'producers';
    try {
      const q = query(collection(db, path), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      safeSetItem('producers', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
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
    const cached = safeGetItem('press');
    if (cached) return JSON.parse(cached) as any[];

    const path = 'press';
    try {
      const q = query(collection(db, path), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      safeSetItem('press', JSON.stringify(data));
      return data;
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
    }
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
      const snap = await getDoc(docRef);
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
