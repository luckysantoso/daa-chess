/* ======================================================================
 * utils.js
 * ----------------------------------------------------------------------
 * Kumpulan fungsi utilitas umum untuk proyek catur modular.
 * ==================================================================== */

export const BOARD_SIZE = 8;          // lebar papan (8×8)

/* ----------------------------- shuffle ------------------------------ */
/**
 * Fisher-Yates shuffle mengacak array **in-place**.
 * @param {Array<any>} array  Array yang ingin diacak.
 * @returns {Array<any>}      Array yang sama, sudah teracak.
 */
export function shuffle(array) {
  let i = array.length;
  while (i) {
    const j = (Math.random() * i--) | 0;   // indeks acak 0‥i
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/* ------------------------------ abs --------------------------------- */
/**
 * Nilai absolut ringan (tanpa Math.abs).
 * @param {number} n
 * @returns {number} |n|
 */
export const abs = n => (n < 0 ? -n : n);

/* ----------------------------- hash --------------------------------- */
/**
 * Mengubah koordinat (x,y) → bilangan tunggal 0‥63.
 * Berguna sebagai key struktur Map/Objek penyimpan keadaan papan.
 * @param {number} x  Baris   (0‥7)
 * @param {number} y  Kolom   (0‥7)
 */
export const hash = (x, y) => x * BOARD_SIZE + y;

/* ---------------------------- decode -------------------------------- */
/**
 * Kebalikan dari `hash` – mengubah hash → [x,y].
 * @param {number} h  Bilangan hash dari square.
 * @returns {[number, number]}  Koordinat [x,y].
 */
export const decode = h => [Math.floor(h / BOARD_SIZE), h % BOARD_SIZE];
