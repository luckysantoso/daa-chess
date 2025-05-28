/* ======================================================================
 * engine/generator/knight.js
 * ----------------------------------------------------------------------
 * Generator langkah Kuda (Knight).
 * – Delapan lompatan “L” (±1,±2) atau (±2,±1).
 * – Tidak memeriksa apakah lompatan menempatkan raja sendiri dalam skak;
 *   pemeriksaan legalitas penuh ditangani di modul Board / validator.
 * ==================================================================== */

import { Move }                      from "../../model/move.js";
import { PieceType }                 from "../../model/piece.js";
import { BOARD_SIZE }                from "../../utils.js";

/* ------------------------ helper internal ------------------------ */
const inside = (x, y) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

/**  Buat objek Move sesuai keadaan papan. */
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
 * Menghasilkan array langkah pseudo-legal untuk Knight.
 *
 * @param {Board}  board  Papan permainan
 * @param {number} x      Baris (0‥7)
 * @param {number} y      Kolom (0‥7)
 * @returns {Move[]}      Daftar langkah pseudo-legal
 */
export function knightMoves(board, x, y) {
  const res = [];

  /* Delapan lompatan “L” */
  const MOVES = [
    [ 1,  2], [ 2,  1], [-1,  2], [-2,  1],
    [ 1, -2], [ 2, -1], [-1, -2], [-2, -1]
  ];

  MOVES.forEach(([dx, dy]) => {
    const tx = x + dx;
    const ty = y + dy;
    if (!isPseudoLegal(board, x, y, tx, ty)) return;

    res.push(makeMoveObj(board, x, y, tx, ty));
  });

  return res;
}
