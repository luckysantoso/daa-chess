/* =======================================================================
 * board.js
 * -----------------------------------------------------------------------
 * Papan permainan + logika dasar mutasi/validasi langkah.
 * – Reversibel: makeMove() / undoMove() mem‐push / mem‐pop riwayat
 *   sehingga mesin pencari (search.js) dapat mundur ke posisi sebelumnya.
 * – Castling rights dilacak di `this.castlingRights`.
 * – Promosi otomatis menjadi Queen.
 * – En-passant belum diimplementasi (mudah ditambah belakangan).
 * ==================================================================== */

import { BLACK, WHITE, GameState }     from "./constants.js";
import { PieceType, makePiece }        from "./model/piece.js";
import { hash, decode, shuffle }       from "./utils.js";
import { Move }                        from "./model/move.js";

import { kingMoves   } from "./engine/generator/king.js";
import { queenMoves  } from "./engine/generator/queen.js";
import { rookMoves   } from "./engine/generator/rook.js";
import { bishopMoves } from "./engine/generator/bishop.js";
import { knightMoves } from "./engine/generator/knight.js";
import { pawnMoves   } from "./engine/generator/pawn.js";

import { findBestMove } from "./engine/search.js";

/* ------------------- generator lookup table ------------------- */
const GEN = {
  [PieceType.King]   : kingMoves,
  [PieceType.Queen]  : queenMoves,
  [PieceType.Rook]   : rookMoves,
  [PieceType.Bishop] : bishopMoves,
  [PieceType.Knight] : knightMoves,
  [PieceType.Pawn]   : pawnMoves
};

/* ======================== KELAS BOARD ========================= */
export class Board {
  /**
   * @param {Object=} opts
   *   • humanColor : WHITE/BLACK (default WHITE)
   *   • maxDepth   : kedalaman search (default 3)
   *   • state      : Map<number,{type,color}> posisi awal (opsional)
   *   • castlingRights : {white:{king:Boolean,queen:Boolean}, black:{…}}
   */
  constructor(opts = {}) {
    this.human     = opts.humanColor ?? WHITE;
    this.pc        = this.human === WHITE ? BLACK : WHITE;
    this.maxDepth  = opts.maxDepth ?? 3;

    /* -------- posisi bidak -------- */
    this.state = opts.state ? new Map(opts.state) : new Map();
    if (this.state.size === 0) this.#initStartingPosition();

    /* -------- hak rokade -------- */
    this.castlingRights = opts.castlingRights
      ? JSON.parse(JSON.stringify(opts.castlingRights))
      : { white: { king: true, queen: true },
          black: { king: true, queen: true } };

    /* -------- riwayat utk undo ---- */
    this.history = [];
  }

    /**
   * Return a JSON-serializable snapshot of this Board
   * for sending to a Worker.
   */
  getConfiguration() {
    return {
      state: Array.from(this.state.entries()),
      castlingRights: this.castlingRights,
      humanColor: this.human,
      maxDepth: this.maxDepth
    };
  }

  /** Legacy: allow setting search depth at runtime */
  setMaxDepth(d) {
    this.maxDepth = d;
  }

  /** Legacy: possible moves from a given square */
  getPossibleMovesFrom(x, y) {
    return this.allMoves(true).filter(m => m.from.x === x && m.from.y === y);
  }

  /** Legacy alias for isHuman */
  isHumanPiece(x, y) {
    return this.isHuman(x, y);
  }


  /* ---------- inisialisasi papan standar ---------- */
  #initStartingPosition() {
    const back = [PieceType.Rook , PieceType.Knight, PieceType.Bishop,
                  PieceType.Queen, PieceType.King , PieceType.Bishop,
                  PieceType.Knight, PieceType.Rook];

    // baris 0 = hitam, baris 7 = putih
    back.forEach((t, i) => {
      this.set(0, i, makePiece(t, BLACK));
      this.set(7, i, makePiece(t, WHITE));
      this.set(1, i, makePiece(PieceType.Pawn, BLACK));
      this.set(6, i, makePiece(PieceType.Pawn, WHITE));
    });
  }

  /* =======================  API DASAR  ======================= */
  hash   = hash;
  decode = decode;

  get(x, y) {
    const h = hash(x, y);
    const p = this.state.get(h);
    // beri SALINAN supaya container di Move tak merefer Map langsung
    return p ? { ...p } : makePiece(PieceType.Empty, 0);
  }
  set(x, y, pc) { this.state.set(hash(x, y), pc); }
  del(x, y)     { this.state.delete(hash(x, y)); }

  stateEntries() { return this.state.entries(); }

  isHuman(x, y) { return this.get(x, y).color === this.human; }

  /* ---------- hak rokade dipakai king.js ---------- */
  canCastle(color, side /* 'king' | 'queen' */) {
    return color === WHITE
      ? this.castlingRights.white[side]
      : this.castlingRights.black[side];
  }

  /* =====================  ENUMERASI LANGKAH  ===================== */
  #positionsFor(color) {
    const list = [];
    for (const [h, pc] of this.state) {
      if (pc.color === color) list.push(decode(h));
    }
    // acak & urutkan pion→raja (membantu pruning stabil)
    shuffle(list).sort((a, b) => this.get(a[0], a[1]).type - this.get(b[0], b[1]).type);
    return list;
  }

  /**
   * @param {boolean} forHuman true → langkah pemain manusia
   * @returns {Move[]}  kumpulan langkah pseudo-legal
   */
  allMoves(forHuman) {
    const color = forHuman ? this.human : this.pc;
    const res   = [];

    this.#positionsFor(color).forEach(([x, y]) => {
      const tipe = this.get(x, y).type;
      const gen  = GEN[tipe];
      if (gen) res.push(...gen(this, x, y));
    });

    return res;
  }

  /* ======================  MAKE / UNDO  ====================== */

  /**
   * Terapkan `move` *in-place*.  Menyimpan snapshot agar bisa di-undo.
   * @param {Move} move
   */
  makeMove(move) {
    /* snapshot hak rokade & bidak tangkapan */
    const snapshot = {
      move,
      captured: this.get(move.to.x, move.to.y),
      rights : JSON.parse(JSON.stringify(this.castlingRights))
    };
    this.history.push(snapshot);

    /* --- pindah bidak utama --- */
    this.set(move.to.x, move.to.y, { ...move.from.container }); // salin
    this.del(move.from.x, move.from.y);

    /* --- update hak rokade jika Raja / Benteng bergerak --- */
    const mover  = move.from.container;
    const color  = mover.color;
    if (mover.type === PieceType.King) {
      this.#disableCastling(color, "king");
      this.#disableCastling(color, "queen");
    } else if (mover.type === PieceType.Rook) {
      if (move.from.y === 0) this.#disableCastling(color, "queen");
      else if (move.from.y === 7) this.#disableCastling(color, "king");
    }

    /* jika menangkap rook lawan di kotak awalnya, tutup hak lawan */
    if (snapshot.captured.type === PieceType.Rook) {
      if (move.to.y === 0)  this.#disableCastling(snapshot.captured.color, "queen");
      else if (move.to.y === 7) this.#disableCastling(snapshot.captured.color, "king");
    }

    /* --- special moves --- */
    if (move.specialCondition) {
      if (move.specialCondition.name === "castling") {
        // secondMove TIDAK di-push ke history (bagian snapshot castling sama)
        const sm = move.specialCondition.secondMove;
        this.set(sm.to.x, sm.to.y, { ...sm.from.container });
        this.del(sm.from.x, sm.from.y);
      }
      else if (move.specialCondition.name === "upgradePawn") {
        const pc = this.get(move.to.x, move.to.y);
        pc.type = PieceType.Queen;           // auto promote jadi Queen
        this.set(move.to.x, move.to.y, pc);
      }
    }
  }

  /**
   * Batalkan langkah terakhir.
   */
  undoMove() {
    const snap = this.history.pop();
    if (!snap) return;

    const { move, captured, rights } = snap;

    /* pulihkan hak rokade */
    this.castlingRights = rights;

    /* ---- kembalikan bidak utama ---- */
    this.set(move.from.x, move.from.y, { ...move.from.container });
    this.set(move.to.x, move.to.y, captured); // bisa empty / bidak lawan

    /* ---- special reversal ---- */
    if (move.specialCondition && move.specialCondition.name === "castling") {
      const sm = move.specialCondition.secondMove;
      this.set(sm.from.x, sm.from.y, { ...sm.from.container });
      this.del(sm.to.x, sm.to.y);
    }
    // upgradePawn tidak butuh tindakan (Queen diganti oleh Pawn yg copy)
  }

  #disableCastling(color, side) {
    const obj = color === WHITE ? this.castlingRights.white
                                : this.castlingRights.black;
    obj[side] = false;
  }

  /* ======================  PENILAIAN AKHIR  ===================== */
  checkWin() {
    let humanKingAlive = false;
    let pcKingAlive    = false;

    for (const [, pc] of this.state) {
      if (pc.type === PieceType.King) {
        if (pc.color === this.human) humanKingAlive = true;
        else                          pcKingAlive    = true;
      }
    }
    if (!humanKingAlive) return GameState.PCWin;
    if (!pcKingAlive)    return GameState.HumanWin;
    return GameState.Normal;
  }

  /* ======================  INTERFACE AI  ======================= */
  /**
   * Hitung langkah AI terbaik (memanggil Negamax αβ).
   * @returns {Move|null}
   */
  getPCResponse() {
    return findBestMove(this, this.maxDepth);
  }
}

/* ---------------------------------------------------------------
 * Worker‐style helper (optional) — agar kompatibel dgn kode lama
 * ------------------------------------------------------------- */
export function findBestMoveWorker(conf) {
  const board = new Board(conf);
  return board.getPCResponse();
}

/* Jika file dipakai oleh Web Worker lama (seperti aslinya):
   self.onmessage = e => postMessage(findBestMoveWorker(e.data));
*/
