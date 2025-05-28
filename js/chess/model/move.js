/* ======================================================================
 * model/move.js
 * ----------------------------------------------------------------------
 * Representasi satu langkah (move) dan helper untuk membuat string
 * manusia-baca.  Dipakai oleh board, search, dan UI.
 * ==================================================================== */

import { nameOf } from "./piece.js";

/* ------------------------------- Move ------------------------------- */
/**
 * @typedef {Object} Square
 * @property {number} x           Baris (0‥7)
 * @property {number} y           Kolom (0‥7)
 * @property {{type:number,color:number}} container  Bidak pada square
 */

/**
 * Representasi langkah catur, termasuk kondisi khusus (rokade, promosi).
 */
export class Move {
  /**
   * @param {Square} from
   * @param {Square} to
   * @param {{name:string, secondMove?:Move}=} specialCondition
   */
  constructor(from, to, specialCondition = undefined) {
    this.from = from;
    this.to   = to;
    if (specialCondition) this.specialCondition = specialCondition;
  }
}

/* --------------------------- moveToString --------------------------- */
/**
 * Mengubah objek `Move` menjadi string singkat yang mudah dibaca —
 * cocok untuk log konsol atau tooltip UI.
 *
 * Contoh keluaran:
 * ```
 * Queen(0,3) → Empty(4,7)
 * King(7,4) → Empty(7,6) - CASTLING
 * Pawn(6,0) → Empty(7,0) - PAWN UPGRADED
 * ```
 * @param {Move} m
 * @returns {string}
 */
export function moveToString(m) {
  const src = m.from;
  const dst = m.to;
  let out = `${nameOf(src.container.type)}(${src.x},${src.y}) → `
          + `${nameOf(dst.container.type)}(${dst.x},${dst.y})`;

  if (m.specialCondition) {
    switch (m.specialCondition.name) {
      case "castling":
        out += " - CASTLING";
        break;
      case "upgradePawn":
        out += " - PAWN UPGRADED";
        break;
      default:
        out += ` - ${m.specialCondition.name.toUpperCase()}`;
    }
  }
  return out;
}
