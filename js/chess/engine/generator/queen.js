/* ======================================================================
 * engine/generator/queen.js
 * ----------------------------------------------------------------------
 * Generator langkah Ratu (Queen).
 * Mengembalikan array objek `Move` untuk semua arah diagonal dan orthogonal
 * sejauh petak masih kosong atau berisi bidak lawan.
 * ==================================================================== */

import { Move }                      from "../../model/move.js";
import { PieceType }                 from "../../model/piece.js";
import { BOARD_SIZE }                from "../../utils.js";

/* ----------------------- helper internal ------------------------ */
const inside = (x, y) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

/**  Bangun objek `Move` berdasar posisi papan saat ini. */
function makeMoveObj(board, fx, fy, tx, ty) {
  const from = { x: fx, y: fy, container: board.get(fx, fy) };
  const to   = { x: tx, y: ty, container: board.get(tx, ty) };
  return new Move(from, to);
}

/**  True bila petak target di papan & tidak ditempati bidak sendiri. */
function isPseudoLegal(board, fx, fy, tx, ty) {
  if (!inside(tx, ty)) return false;
  const src = board.get(fx, fy);
  const dst = board.get(tx, ty);
  return dst.type === PieceType.Empty || dst.color !== src.color;
}

/* -------------------------- API utama --------------------------- */
/**
 * @param {Board}  board  Instansi papan tempat queen berada
 * @param {number} x      Baris   (0‥7)
 * @param {number} y      Kolom   (0‥7)
 * @returns {Move[]}      Daftar langkah pseudo-legal
 */
export function queenMoves(board, x, y) {
  const res = [];

  /* 8 arah: orthogonal + diagonal */
  const DIR = [
    [-1,  0], [ 1,  0], [ 0, -1], [ 0,  1], // rook-like
    [-1, -1], [-1,  1], [ 1, -1], [ 1,  1]  // bishop-like
  ];

  DIR.forEach(([dx, dy]) => {
    let tx = x, ty = y;
    while (true) {
      tx += dx;
      ty += dy;
      if (!isPseudoLegal(board, x, y, tx, ty)) break;

      const move = makeMoveObj(board, x, y, tx, ty);
      res.push(move);

      /* Berhenti jika petak berisi bidak lawan (tangkapan). */
      if (move.to.container.type !== PieceType.Empty) break;
    }
  });

  return res;
}
