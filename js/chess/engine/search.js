/* ======================================================================
 * engine/search.js
 * ----------------------------------------------------------------------
 * Pencarian langkah terbaik untuk AI (board.pc) menggunakan Negamax
 * dengan alfa-beta pruning.
 *
 * SYARAT minimal yang harus disediakan objek `Board`:
 *   • board.allMoves(forHuman:boolean) → Move[]
 *   • board.makeMove(m:Move) / board.undoMove(m:Move)
 *   • board.checkWin()                → GameState enum
 *   • board.human , board.pc          → warna pemain
 *   • board.stateEntries()            → iterable (dipakai evaluator)
 * ==================================================================== */

import { shuffle }           from "../utils.js";
import { evaluate }          from "./evaluator.js";
import { GameState, MAX_INT } from "../constants.js";

/* ------------------------- Negamax AB -------------------------- */
/**
 * Negamax dengan alfa-beta.  Selalu mengembalikan skor untuk **AI**
 * (pemain board.pc).  `sign` = +1 jika giliran AI, −1 jika giliran
 * manusia; sehingga panggilan rekursif hanya butuh satu fungsi.
 *
 * @param {Board}   board
 * @param {number}  depth
 * @param {number}  alpha
 * @param {number}  beta
 * @param {number}  sign   +1 (giliran AI) | −1 (giliran manusia)
 * @returns {number} skor terbaik
 */
function negamax(board, depth, alpha, beta, sign) {
  /* ---- evaluasi terminal / kedalaman 0 ---- */
  const gameState = board.checkWin();
  if (gameState === GameState.PCWin)   return  MAX_INT - (MAX_INT - depth); // prefer cepat
  if (gameState === GameState.HumanWin) return -MAX_INT + (MAX_INT - depth);
  if (depth === 0) return sign * evaluate(board); // sign membalik sisi pemain

  const moves = shuffle(board.allMoves(sign === -1)); // true = human turn
  let best     = -MAX_INT;

  for (const mv of moves) {
    board.makeMove(mv);
    const score = -negamax(board, depth - 1, -beta, -alpha, -sign);
    board.undoMove(mv);

    if (score > best) best = score;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;               // pruning
  }

  return best;
}

/* ---------------------- API publik ----------------------------- */
/**
 * Cari langkah terbaik untuk AI (board.pc) hingga kedalaman `depth`.
 * Jika lebih dari satu langkah sama baik, dipilih acak di antara yang
 * terbaik agar permainan tidak terlalu deterministik.
 *
 * @param {Board}  board
 * @param {number} depth  Kedalaman pencarian (1 = hanya 1 plies AI)
 * @returns {Move|null}   Langkah terbaik atau null bila tidak ada
 */
export function findBestMove(board, depth = 3) {
  const moves = shuffle(board.allMoves(false));   // false = giliran AI
  let bestScore = -MAX_INT;
  let bestMoves = [];

  for (const mv of moves) {
    board.makeMove(mv);
    const score = -negamax(board, depth - 1, -MAX_INT, MAX_INT, -1); // giliran manusia
    board.undoMove(mv);

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [mv];
    } else if (score === bestScore) {
      bestMoves.push(mv);
    }
  }

  if (bestMoves.length === 0) return null;
  return bestMoves[(Math.random() * bestMoves.length) | 0];
}
