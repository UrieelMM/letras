// Doble del transporte: las pruebas ejercitan los repositorios y stores reales.
// No sustituye a las pruebas de permisos del emulador de Firebase.
export const documents = new Map<string, any>();
const subscriptions = new Set<() => void>();
export let serverReads = 0;
let transactionQueue = Promise.resolve();
type Reference = { path: string; kind: 'doc' | 'collection' };
export function collection(_db: unknown, path: string): Reference { return { path, kind: 'collection' }; }
export function doc(base: any, ...parts: string[]): Reference {
  return { path: [base.path, ...parts].filter(Boolean).join('/'), kind: 'doc' };
}
function documentSnapshot(path: string) {
  const value = documents.get(path);
  return { id: path.split('/').pop(), exists: () => value !== undefined, data: () => structuredClone(value) };
}
function snapshot(reference: Reference) {
  if (reference.kind === 'doc') return documentSnapshot(reference.path);
  const prefix = `${reference.path}/`;
  return { docs: [...documents.keys()].filter((path) => path.startsWith(prefix) && !path.slice(prefix.length).includes('/')).map(documentSnapshot) };
}
export async function getDoc(reference: Reference) { return snapshot(reference); }
export async function getDocs(reference: Reference) { return snapshot(reference); }
export async function getDocFromServer(reference: Reference) { serverReads++; return snapshot(reference); }
export async function getDocsFromServer(reference: Reference) { serverReads++; return snapshot(reference); }
export async function setDoc(reference: Reference, value: unknown) {
  documents.set(reference.path, structuredClone(value));
  subscriptions.forEach((listener) => listener());
}
export async function deleteDoc(reference: Reference) {
  documents.delete(reference.path);
  subscriptions.forEach((listener) => listener());
}
export function onSnapshot(reference: Reference, listener: (value: any) => void) {
  const emit = () => listener(snapshot(reference));
  subscriptions.add(emit);
  emit();
  return () => { subscriptions.delete(emit); };
}
export function runTransaction(_db: unknown, callback: (transaction: any) => Promise<void>) {
  const result = transactionQueue.then(async () => {
    const writes: [Reference, unknown][] = [];
    await callback({ get: getDoc, set: (reference: Reference, value: unknown) => writes.push([reference, value]) });
    for (const [reference, value] of writes) await setDoc(reference, value);
  });
  transactionQueue = result.catch(() => {});
  return result;
}
export const query = (reference: Reference) => reference;
export const where = () => {};
export const updateDoc = setDoc;
export function writeBatch() { return { update() {}, async commit() {} }; }
