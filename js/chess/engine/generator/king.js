/* ======================================================================
 * engine/generator/king.js
 * ----------------------------------------------------------------------
 * Menghasilkan semua langkah (pseudo-legal) untuk RAJA pada koordinat
 * (x,y).  Termasuk 8 langkah satu-petak dan rokade (kingside / queenside)
 * bila kondisi jalan, tanpa memeriksa “raja lewat atau masuk ke skak”.
 * ==================================================================== */

import { Move }                 from "../../model/move.js";
import { PieceType, WHITE, BLACK } from "../../model/piece.js";
import { BOARD_SIZE }           from "../../utils.js";

/* ------------------------ helper internal ------------------------ */
const inside = (x, y) => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

/**  Bangun objek `Move` berdasar posisi papan saat ini.  */
function makeMoveObj(board, fx, fy, tx, ty, special = undefined) {
  const from = { x: fx, y: fy, container: board.get(fx, fy) };
  const to   = { x: tx, y: ty, container: board.get(tx, ty) };
  return new Move(from, to, special);
}

/**  True bila petak `tx,ty` masih di papan & bukan bidak sendiri. */
function isPseudoLegal(board, fx, fy, tx, ty) {
  if (!inside(tx, ty)) return false;
  const src = board.get(fx, fy);
  const dst = board.get(tx, ty);
  return dst.type === PieceType.Empty || dst.color !== src.color;
}

/* -------------------------- API utama --------------------------- */
/**
 * Hasilkan array langkah raja (pseudo-legal).
 * @param {Board} board  Instance papan.
 * @param {number} x     Baris  (0‥7)
 * @param {number} y     Kolom  (0‥7)
 * @returns {Move[]}     Daftar objek `Move`.
 */
export function kingMoves(board, x, y) {
  const res = [];
  const step = [
    [-1, 0], [0, -1], [1, 0], [0, 1],
    [-1,-1], [1,  1], [-1, 1], [1, -1]
  ];

  /* ----- 8 langkah satu-petak ----- */
  step.forEach(([dx, dy]) => {
    const tx = x + dx, ty = y + dy;
    if (isPseudoLegal(board, x, y, tx, ty)) {
      res.push(makeMoveObj(board, x, y, tx, ty));
    }
  });

  /* --------------  Rokade -------------- *
   * Papan diharapkan menyediakan salah satu:
   *   1.  board.canCastle(color, 'king'|'queen')  ➜  boolean
   *   2.  board.castlingRights = {
   *         white: { king:bool, queen:bool },
   *         black: { king:bool, queen:bool }
   *       }
   * Jika tak tersedia, blok ini otomatis dilewati.                    */
  const king = board.get(x, y);
  if (king.type !== PieceType.King) return res;     // penjaga keamanan

  const color      = king.color;
  const row        = color === WHITE ? 7 : 0;       // baris ‘rumah’ raja
  const rightsFun  = typeof board.canCastle === "function";
  const rightsObj  = !rightsFun && board.castlingRights;

  /* ---- Kingside (short) ---- */
  const canCastleK = rightsFun
    ? board.canCastle(color, "king")
    : rightsObj?.[color === WHITE ? "white" : "black"]?.king;

  if (canCastleK) {
    const pathClear = board.get(row, 5).type === PieceType.Empty &&
                      board.get(row, 6).type === PieceType.Empty;
    if (pathClear) {
      res.push(
        makeMoveObj(
          board, row, 4, row, 6,
          { name: "castling",
            secondMove: makeMoveObj(board, row, 7, row, 5) }
        )
      );
    }
  }

  /* ---- Queenside (long) ---- */
  const canCastleQ = rightsFun
    ? board.canCastle(color, "queen")
    : rightsObj?.[color === WHITE ? "white" : "black"]?.queen;

  if (canCastleQ) {
    const pathClear = board.get(row, 3).type === PieceType.Empty &&
                      board.get(row, 2).type === PieceType.Empty &&
                      board.get(row, 1).type === PieceType.Empty;
    if (pathClear) {
      res.push(
        makeMoveObj(
          board, row, 4, row, 2,
          { name: "castling",
            secondMove: makeMoveObj(board, row, 0, row, 3) }
        )
      );
    }
  }

  return res;
}
