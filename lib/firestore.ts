import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, WeightEntry, BodyMeasurement, ProgressMedia } from '@/types';

// ==================== User Profile Operations ====================

/**
 * Get user profile document
 */
export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid, ...userDoc.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Create user profile document
 */
export const createUserProfile = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', uid), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Update user profile document
 */
export const updateUserProfile = async (
  uid: string,
  data: Partial<User>
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// ==================== Weight Entries Operations ====================

/**
 * Get all weight entries for a user
 */
export const getWeightEntries = async (
  uid: string,
  limitCount: number = 100
): Promise<WeightEntry[]> => {
  try {
    const q = query(
      collection(db, `users/${uid}/weightEntries`),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as WeightEntry)
    );
  } catch (error) {
    console.error('Error getting weight entries:', error);
    throw error;
  }
};

/**
 * Get latest weight entry
 */
export const getLatestWeight = async (
  uid: string
): Promise<WeightEntry | null> => {
  try {
    const q = query(
      collection(db, `users/${uid}/weightEntries`),
      orderBy('date', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as WeightEntry;
  } catch (error) {
    console.error('Error getting latest weight:', error);
    throw error;
  }
};

/**
 * Get today's and yesterday's weight for comparison
 */
export const getTodayAndYesterdayWeight = async (
  uid: string
): Promise<{ today: WeightEntry | null; yesterday: WeightEntry | null }> => {
  try {
    const entries = await getWeightEntries(uid, 2);
    return {
      today: entries[0] || null,
      yesterday: entries[1] || null,
    };
  } catch (error) {
    console.error('Error getting weight comparison:', error);
    throw error;
  }
};

/**
 * Add new weight entry
 */
export const addWeightEntry = async (
  uid: string,
  data: { date: Date; weight: number }
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, `users/${uid}/weightEntries`), {
      date: Timestamp.fromDate(data.date),
      weight: data.weight,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding weight entry:', error);
    throw error;
  }
};

/**
 * Update weight entry
 */
export const updateWeightEntry = async (
  uid: string,
  entryId: string,
  data: { date?: Date; weight?: number }
): Promise<void> => {
  try {
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    if (data.date) updateData.date = Timestamp.fromDate(data.date);
    if (data.weight) updateData.weight = data.weight;

    await updateDoc(doc(db, `users/${uid}/weightEntries`, entryId), updateData);
  } catch (error) {
    console.error('Error updating weight entry:', error);
    throw error;
  }
};

/**
 * Delete weight entry
 */
export const deleteWeightEntry = async (
  uid: string,
  entryId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, `users/${uid}/weightEntries`, entryId));
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    throw error;
  }
};

// ==================== Body Measurements Operations ====================

/**
 * Get all body measurements for a user
 */
export const getBodyMeasurements = async (
  uid: string,
  limitCount: number = 100
): Promise<BodyMeasurement[]> => {
  try {
    const q = query(
      collection(db, `users/${uid}/bodyMeasurements`),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as BodyMeasurement)
    );
  } catch (error) {
    console.error('Error getting body measurements:', error);
    throw error;
  }
};

/**
 * Get latest body measurement
 */
export const getLatestMeasurement = async (
  uid: string
): Promise<BodyMeasurement | null> => {
  try {
    const q = query(
      collection(db, `users/${uid}/bodyMeasurements`),
      orderBy('date', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as BodyMeasurement;
  } catch (error) {
    console.error('Error getting latest measurement:', error);
    throw error;
  }
};

/**
 * Add new body measurement
 */
export const addBodyMeasurement = async (
  uid: string,
  data: { date: Date; waist: number; bicep: number; thigh: number }
): Promise<string> => {
  try {
    const docRef = await addDoc(
      collection(db, `users/${uid}/bodyMeasurements`),
      {
        date: Timestamp.fromDate(data.date),
        waist: data.waist,
        bicep: data.bicep,
        thigh: data.thigh,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
    );
    return docRef.id;
  } catch (error) {
    console.error('Error adding body measurement:', error);
    throw error;
  }
};

/**
 * Update body measurement
 */
export const updateBodyMeasurement = async (
  uid: string,
  measurementId: string,
  data: {
    date?: Date;
    waist?: number;
    bicep?: number;
    thigh?: number;
  }
): Promise<void> => {
  try {
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    if (data.date) updateData.date = Timestamp.fromDate(data.date);
    if (data.waist !== undefined) updateData.waist = data.waist;
    if (data.bicep !== undefined) updateData.bicep = data.bicep;
    if (data.thigh !== undefined) updateData.thigh = data.thigh;

    await updateDoc(
      doc(db, `users/${uid}/bodyMeasurements`, measurementId),
      updateData
    );
  } catch (error) {
    console.error('Error updating body measurement:', error);
    throw error;
  }
};

/**
 * Delete body measurement
 */
export const deleteBodyMeasurement = async (
  uid: string,
  measurementId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, `users/${uid}/bodyMeasurements`, measurementId));
  } catch (error) {
    console.error('Error deleting body measurement:', error);
    throw error;
  }
};

// ==================== Progress Media Operations ====================

/**
 * Get all progress media for a user
 */
export const getProgressMedia = async (
  uid: string,
  type?: 'photo' | 'video',
  limitCount: number = 100
): Promise<ProgressMedia[]> => {
  try {
    let q;
    if (type) {
      q = query(
        collection(db, `users/${uid}/progressMedia`),
        where('type', '==', type),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    } else {
      q = query(
        collection(db, `users/${uid}/progressMedia`),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as ProgressMedia)
    );
  } catch (error) {
    console.error('Error getting progress media:', error);
    throw error;
  }
};

/**
 * Add new progress media
 */
export const addProgressMedia = async (
  uid: string,
  data: {
    date: Date;
    type: 'photo' | 'video';
    mediaUrl: string;
    thumbnailUrl: string;
    storagePath: string;
    thumbnailPath?: string;
    duration?: number;
    fileSize: number;
    weight?: number;
    notes?: string;
  }
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, `users/${uid}/progressMedia`), {
      date: Timestamp.fromDate(data.date),
      type: data.type,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl,
      storagePath: data.storagePath,
      thumbnailPath: data.thumbnailPath || null,
      duration: data.duration || null,
      fileSize: data.fileSize,
      weight: data.weight || null,
      notes: data.notes || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding progress media:', error);
    throw error;
  }
};

/**
 * Delete progress media
 */
export const deleteProgressMedia = async (
  uid: string,
  mediaId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, `users/${uid}/progressMedia`, mediaId));
  } catch (error) {
    console.error('Error deleting progress media:', error);
    throw error;
  }
};
