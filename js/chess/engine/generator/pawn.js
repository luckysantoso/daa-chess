/* ======================================================================
 * engine/generator/pawn.js
 * ----------------------------------------------------------------------
 * Generator langkah Pion (Pawn).
 * Fitur yang didukung:
 *   • Langkah maju 1 petak
 *   • Langkah maju 2 petak dari baris awal
 *   • Tangkap diagonal (↙ / ↘)
 *   • Promosi (upgradePawn) ketika mencapai baris terakhir
 *
 * Catatan: En-passant belum diimplementasikan; biasanya membutuhkan
 *          status tambahan (target square) di objek Board.
 * ==================================================================== */

import { Move }                      from "../../model/move.js";
import { PieceType, WHITE, BLACK }   from "../../model/piece.js";
import { BOARD_SIZE }                from "../../utils.js";

/* ------------------------ helper internal ------------------------ */
const inside = (x, y) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

/**  Bangun objek Move berdasarkan keadaan papan. */
function makeMoveObj(board, fx, fy, tx, ty, special = undefined) {
  const from = { x: fx, y: fy, container: board.get(fx, fy) };
  const to   = { x: tx, y: ty, container: board.get(tx, ty) };
  return new Move(from, to, special);
}

/* --------------------------- API utama -------------------------- */
/**
 * Menghasilkan array langkah pseudo-legal untuk Pion.
 *
 * @param {Board}  board  Papan permainan
 * @param {number} x      Baris (0‥7)
 * @param {number} y      Kolom (0‥7)
 * @returns {Move[]}      Daftar langkah pseudo-legal
 */
export function pawnMoves(board, x, y) {
  const res   = [];
  const pawn  = board.get(x, y);
  const dir   = pawn.color === WHITE ? -1 : 1;        // Arah gerak
  const start = pawn.color === WHITE ? 6  : 1;        // Baris awal
  const promo = pawn.color === WHITE ? 0  : 7;        // Baris promosi

  /* ---- Langkah maju 1 petak ---- */
  const nx = x + dir;
  if (inside(nx, y) && board.get(nx, y).type === PieceType.Empty) {
    const isPromo = nx === promo;
    res.push(
      makeMoveObj(
        board, x, y, nx, y,
        isPromo ? { name: "upgradePawn" } : undefined
      )
    );

    /* ---- Langkah maju 2 petak (hanya dari baris awal) ---- */
    if (x === start) {
      const nnx = x + 2 * dir;
      if (board.get(nnx, y).type === PieceType.Empty) {
        res.push(makeMoveObj(board, x, y, nnx, y));
      }
    }
  }

  /* ---- Tangkap diagonal ↙ / ↘ ---- */
  const DIAG = [ -1, 1 ];           // kolom ±1
  DIAG.forEach(dy => {
    const tx = x + dir;
    const ty = y + dy;
    if (!inside(tx, ty)) return;

    const target = board.get(tx, ty);
    if (target.type !== PieceType.Empty && target.color !== pawn.color) {
      const isPromo = tx === promo;
      res.push(
        makeMoveObj(
          board, x, y, tx, ty,
          isPromo ? { name: "upgradePawn" } : undefined
        )
      );
    }
  });

  return res;
}
