/* ======================================================================
 * engine/evaluator.js
 * ----------------------------------------------------------------------
 * Penilaian posisi (material + piece-square table).
 * – Material:  100 = 1 pion.
 * – PST (piece-square table): bonusPos di constants.js.
 * – Orientasi PST mengikuti perspektif PUTIH (rank 0 = sisi putih).
 *   → Untuk bidak HITAM, koordinat X dicerminkan (7-x) agar tabel sama.
 * ==================================================================== */

import { bonusPos, PieceValue, WHITE, BLACK } from "../constants.js";
import { decode }                             from "../utils.js";

/**
 * Hitung skor posisi saat ini.
 *
 * @param {Board} board  Objek Board — WAJIB menyediakan:
 *    • board.stateEntries()       → iterable [hash, pieceContainer]
 *    • board.human                → warna pemain manusia (WHITE/BLACK)
 *    • board.pc                   → warna AI (WHITE/BLACK)
 * @returns {number}  Skor dalam centipawn ( >0 = AI unggul ).
 */
export function evaluate(board) {
  let score = 0;

  for (const [hash, pc] of board.stateEntries()) {
    if (pc.type === PieceValue.Empty) continue;

    /* ---------- material ---------- */
    let s = pc.type; // material dasar

    /* -------- piece-square -------- */
    const pst = bonusPos[pc.type];
    if (pst) {
      const [x, y] = decode(hash);           // koordinat 0‥7
      const row = pc.color === WHITE ? x : 7 - x; // cermin utk hitam
      s += pst[row][y];
    }

    /* ---------------- akumulasi ---------------- */
    if (pc.color === board.human) score -= s; // poin utk manusia -> minus
    else                           score += s; // poin utk AI       -> plus
  }

  return score;
}
