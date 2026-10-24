import { db, auth } from './lib/firebase';
import { collection, addDoc, getDocs, query, limit, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { CATEGORIES, PRODUCTS } from './data';

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
    try {
      localStorage.setItem('firestoreDisabled', 'true');
    } catch (e) {}
  }
  console.warn(`[Firestore Seed Notice] (${operationType} on ${path}): ${errorMessage}`);
}

export const seedDatabase = async () => {
  try {
    const categoriesSnap = await getDocs(query(collection(db, 'categories'), limit(1)));
    if (categoriesSnap.empty) {
      console.log('Seeding categories...');
      for (const cat of CATEGORIES) {
        await setDoc(doc(db, 'categories', cat.id), {
          name: cat.name,
          icon: cat.icon,
          createdAt: serverTimestamp()
        });
      }
    }

    const productsSnap = await getDocs(query(collection(db, 'products'), limit(1)));
    if (productsSnap.empty) {
      console.log('Seeding products...');
      for (const prod of PRODUCTS) {
        const { id, ...prodData } = prod;
        await addDoc(collection(db, 'products'), {
          ...prodData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'seed');
  }
};
