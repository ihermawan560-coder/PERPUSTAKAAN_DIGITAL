import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AnggotaItem, BukuItem, KelasItem, PengaturanSekolah, TransaksiItem } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.warn('Firestore sync notice:', JSON.stringify(errInfo));
}

// Test initial connection as required by Firebase SKILL
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or network unavailable.");
    }
    return false;
  }
}

// Collection Names in Firestore
export const FS_COLLECTIONS = {
  BUKU: 'buku',
  ANGGOTA: 'anggota',
  KELAS: 'kelas',
  TRANSAKSI: 'transaksi',
  PENGATURAN: 'pengaturan',
  SYNC_META: 'sync_metadata',
} as const;

export interface RemoteLibraryData {
  buku?: BukuItem[];
  anggota?: AnggotaItem[];
  kelas?: KelasItem[];
  transaksi?: TransaksiItem[];
  pengaturan?: PengaturanSekolah;
  lastSyncedAt?: string;
}

// Pull all library datasets from Cloud Firestore
export async function fetchAllDataFromFirestore(): Promise<RemoteLibraryData | null> {
  try {
    const [bukuSnap, anggotaSnap, kelasSnap, trxSnap, settingDoc] = await Promise.all([
      getDocs(collection(db, FS_COLLECTIONS.BUKU)),
      getDocs(collection(db, FS_COLLECTIONS.ANGGOTA)),
      getDocs(collection(db, FS_COLLECTIONS.KELAS)),
      getDocs(collection(db, FS_COLLECTIONS.TRANSAKSI)),
      getDoc(doc(db, FS_COLLECTIONS.PENGATURAN, 'sekolah_default'))
    ]);

    const remoteBuku = bukuSnap.docs.map((d) => d.data() as BukuItem);
    const remoteAnggota = anggotaSnap.docs.map((d) => d.data() as AnggotaItem);
    const remoteKelas = kelasSnap.docs.map((d) => d.data() as KelasItem);
    const remoteTrx = trxSnap.docs.map((d) => d.data() as TransaksiItem);
    const remoteSetting = settingDoc.exists() ? (settingDoc.data() as PengaturanSekolah) : undefined;

    return {
      buku: remoteBuku,
      anggota: remoteAnggota,
      kelas: remoteKelas,
      transaksi: remoteTrx,
      pengaturan: remoteSetting,
      lastSyncedAt: new Date().toISOString()
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'all_collections');
    return null;
  }
}

// Save single document to Firestore
export async function saveDocToFirestore(collectionName: string, id: string, data: any) {
  try {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    // Lightly ping sync metadata so all active devices get instant update
    notifySyncMetadata();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${collectionName}/${id}`);
  }
}

// Delete single document from Firestore
export async function deleteDocFromFirestore(collectionName: string, id: string) {
  try {
    await deleteDoc(doc(db, collectionName, id));
    notifySyncMetadata();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
  }
}

// Notify other connected devices / tabs that data was updated
export async function notifySyncMetadata() {
  try {
    await setDoc(doc(db, FS_COLLECTIONS.SYNC_META, 'current_state'), {
      lastSyncedAt: new Date().toISOString()
    }, { merge: true });
  } catch {
    // Non-blocking
  }
}

// Batch upload full data (used on initial seed or bulk cloud sync)
export async function syncAllDataToFirestore(data: {
  buku: BukuItem[];
  anggota: AnggotaItem[];
  kelas: KelasItem[];
  transaksi: TransaksiItem[];
  pengaturan: PengaturanSekolah;
}) {
  try {
    const batch = writeBatch(db);

    // Save school settings
    const settingRef = doc(db, FS_COLLECTIONS.PENGATURAN, 'sekolah_default');
    batch.set(settingRef, {
      ...data.pengaturan,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Save sync metadata
    const metaRef = doc(db, FS_COLLECTIONS.SYNC_META, 'current_state');
    batch.set(metaRef, {
      lastSyncedAt: new Date().toISOString(),
      version: Date.now(),
      totalBuku: data.buku.length,
      totalAnggota: data.anggota.length,
      totalTransaksi: data.transaksi.length,
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'web'
    }, { merge: true });

    // Save classes
    for (const k of data.kelas) {
      const kRef = doc(db, FS_COLLECTIONS.KELAS, k.id);
      batch.set(kRef, { ...k, updatedAt: new Date().toISOString() }, { merge: true });
    }

    // Save books (first 250 in batch if large)
    for (const b of data.buku.slice(0, 200)) {
      const bRef = doc(db, FS_COLLECTIONS.BUKU, b.id);
      batch.set(bRef, { ...b, updatedAt: new Date().toISOString() }, { merge: true });
    }

    // Save members
    for (const a of data.anggota.slice(0, 200)) {
      const aRef = doc(db, FS_COLLECTIONS.ANGGOTA, a.id);
      batch.set(aRef, { ...a, updatedAt: new Date().toISOString() }, { merge: true });
    }

    // Save transactions
    for (const t of data.transaksi.slice(0, 200)) {
      const tRef = doc(db, FS_COLLECTIONS.TRANSAKSI, t.id);
      batch.set(tRef, { ...t, updatedAt: new Date().toISOString() }, { merge: true });
    }

    await batch.commit();
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'batch_sync');
    return false;
  }
}

// Subscribe to real-time updates across multiple open devices/platforms
export function subscribeToFirestoreSync(onUpdate: (data: Partial<RemoteLibraryData>) => void) {
  try {
    // Listen to sync metadata for fast cross-platform notifications
    const unsubMeta = onSnapshot(doc(db, FS_COLLECTIONS.SYNC_META, 'current_state'), async (snap) => {
      if (snap.exists()) {
        const meta = snap.data();
        if (meta?.lastSyncedAt) {
          onUpdate({ lastSyncedAt: meta.lastSyncedAt });
        }
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, FS_COLLECTIONS.SYNC_META);
    });

    return () => {
      unsubMeta();
    };
  } catch (err) {
    return () => {};
  }
}
