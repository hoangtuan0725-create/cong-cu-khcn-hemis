// Lưu dữ liệu trên máy người dùng: IndexedDB cho dữ liệu lớn, localStorage cho tuỳ chọn nhỏ (thu gọn khối...).
const DB = 'cong-cu-khcn-hemis', ST = 'kv';
let dbp = null;
const open = () => dbp || (dbp = new Promise((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore(ST);
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
}));
const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((res, rej) => { const t = db.transaction(ST, mode); const r = fn(t.objectStore(ST)); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
};
export const get = async k => { try { return await tx('readonly', s => s.get(k)); } catch (e) { return undefined; } };
export const set = async (k, v) => { try { await tx('readwrite', s => s.put(v, k)); } catch (e) { console.warn('Không lưu được', k, e); } };
export const del = async k => { try { await tx('readwrite', s => s.delete(k)); } catch (e) {} };

export const pref = (k, d) => { try { const v = localStorage.getItem('t2h.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
export const setPref = (k, v) => { try { localStorage.setItem('t2h.' + k, JSON.stringify(v)); } catch (e) {} };
