/* ======================================================================
 * engine/generator/bishop.js
 * ----------------------------------------------------------------------
 * Generator langkah Gajah (Bishop).
 * Bergerak diagonal sejauh mungkin hingga papan habis, bertemu bidak
 * lawan (yang dapat ditangkap), atau terhalang bidak sendiri.
 * ==================================================================== */

import { Move }                      from "../../model/move.js";
import { PieceType }                 from "../../model/piece.js";
import { BOARD_SIZE }                from "../../utils.js";

/* ------------------------ helper internal ------------------------ */
const inside = (x, y) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

/**  Bangun objek Move sesuai keadaan papan saat ini. */
function makeMoveObj(board, fx, fy, tx, ty) {
  const from = { x: fx, y: fy, container: board.get(fx, fy) };
  const to   = { x: tx, y: ty, container: board.get(tx, ty) };
  return new Move(from, to);
}

/**  True bila petak target valid & bukan bidak sendiri. */
function isPseudoLegal(board, fx, fy, tx, ty) {
  if (!inside(tx, ty)) return false;
  const src = board.get(fx, fy);
  const dst = board.get(tx, ty);
  return dst.type === PieceType.Empty || dst.color !== src.color;
}

/* --------------------------- API utama -------------------------- */
/**
 * Menghasilkan array langkah pseudo-legal untuk bishop.
 *
 * @param {Board}  board  Papan permainan
 * @param {number} x      Baris (0‥7)
 * @param {number} y      Kolom (0‥7)
 * @returns {Move[]}      Daftar langkah pseudo-legal
 */
export function bishopMoves(board, x, y) {
  const res = [];

  /* Empat arah diagonal */
  const DIR = [
    [-1, -1],  // ↖
    [-1,  1],  // ↗
    [ 1, -1],  // ↙
    [ 1,  1]   // ↘
  ];

  DIR.forEach(([dx, dy]) => {
    let tx = x, ty = y;
    while (true) {
      tx += dx;
      ty += dy;
      if (!isPseudoLegal(board, x, y, tx, ty)) break;

      const move = makeMoveObj(board, x, y, tx, ty);
      res.push(move);

      /* Berhenti setelah menangkap bidak lawan. */
      if (move.to.container.type !== PieceType.Empty) break;
    }
  });

  return res;
}
