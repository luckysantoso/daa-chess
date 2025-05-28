/* ======================================================================
 * model/piece.js
 * ----------------------------------------------------------------------
 * Representasi bidak catur sebagai “piece-container” sederhana
 * (objek { type, color }).  Menyertakan enum jenis bidak dan
 * beberapa helper agar modul lain tidak perlu menyentuh angka mentah.
 * ==================================================================== */

import { PieceValue, BLACK, WHITE } from "../constants.js";

/* ------------------- Alias enum type bidak -------------------- *
 * PieceType hanyalah alias ramah-baca untuk PieceValue di constants.
 * Ini membuat impor di modul lain lebih eksplisit.                */
export const PieceType = {
  Empty  : PieceValue.Empty,
  Pawn   : PieceValue.Pawn,
  Knight : PieceValue.Knight,
  Bishop : PieceValue.Bishop,
  Rook   : PieceValue.Rook,
  Queen  : PieceValue.Queen,
  King   : PieceValue.King
};

/* -------------------- Factory / constructor ------------------- */
/**
 * Membuat “piece-container” standar.
 * @param {number} type   Salah satu nilai di `PieceType`.
 * @param {number} color  `WHITE` atau `BLACK`.
 * @returns {{type:number,color:number}}
 */
export function makePiece(type, color) {
  return { type, color };
}

/* ------------------- Helper: cek square kosong ---------------- */
export function isEmpty(pieceContainer) {
  return pieceContainer.type === PieceType.Empty;
}

/* -------------- Helper: nama string bidak (optional) ---------- */
/**
 * Mengambil nama bidak dari nilai type.
 * @param {number} type
 * @returns {string} "Pawn" | "Knight" | ...
 */
export function nameOf(type) {
  for (const key in PieceType) {
    if (PieceType[key] === type) return key;
  }
  return "Unknown";
}

/* ---------- Helper: unicode ikon bidak (opsional UI) ---------- *
 * Cocok untuk rendering cepat di HTML demo.  Ikon hitam dan putih
 * dibedakan agar tampilan lebih jelas.                            */
const WHITE_ICON = {
  [PieceType.Pawn]  : "♙",
  [PieceType.Knight]: "♘",
  [PieceType.Bishop]: "♗",
  [PieceType.Rook]  : "♖",
  [PieceType.Queen] : "♕",
  [PieceType.King]  : "♔"
};

const BLACK_ICON = {
  [PieceType.Pawn]  : "♟︎",
  [PieceType.Knight]: "♞",
  [PieceType.Bishop]: "♝",
  [PieceType.Rook]  : "♜",
  [PieceType.Queen] : "♛",
  [PieceType.King]  : "♚"
};

/**
 * Mendapatkan ikon Unicode untuk bidak (berguna di UI demo).
 * @param {{type:number,color:number}} pieceContainer
 * @returns {string} Karakter ikon atau string kosong untuk square kosong.
 */
export function iconFor(pieceContainer) {
  if (isEmpty(pieceContainer)) return "";
  return pieceContainer.color === WHITE
    ? WHITE_ICON[pieceContainer.type]
    : BLACK_ICON[pieceContainer.type];
}

/* Re-export warna agar pemanggil cukup impor dari satu file */
export { BLACK, WHITE };
