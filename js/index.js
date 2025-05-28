// js/index.js
import { Board }                   from '../chess/board.js';
import { moveToString }            from '../chess/model/move.js';
import { PieceType, BLACK, WHITE, nameOf } 
                                   from '../chess/model/piece.js';

let board = null;
let currentTurn = 'human';
let choosingState = 'none';
let fromx, fromy;

// Helper untuk menentukan URL gambar bidak
function getModelOf(container) {
  if (container.type === PieceType.Empty) return '';
  const type = nameOf(container.type);
  const color = container.color === BLACK ? 'black' : 'white';
  return `images/${type}_${color}.png`;
}

function getCell(x, y) {
  return $(`[x=${x}][y=${y}]`);
}

function setCellContainer(x, y, container) {
  const img = cells[x][y].find('img');
  const url = getModelOf(container);
  if (url) img.attr('src', url);
  else    img.removeAttr('src');
}

// (Highlight helpers — sama persis seperti sebelumnya)
function setCellStateSelecting(x, y) { /* ... */ }
function setCellStateHighlighting(x, y) { /* ... */ }
function setCellStateNormal(x, y) { /* ... */ }
function checkState(x, y) { /* ... */ }

// Inisialisasi grid & event handling
let cells = [];
$(document).ready(() => {
  // Bangun papan HTML
  let rows = '';
  for (let i = 0; i < 8; i++) {
    cells[i] = [];
    let row = '<tr>';
    for (let j = 0; j < 8; j++) {
      const bg = ((i + j) % 2 === 0) ? FIRST_BACKGROUND_COLOR : SECOND_BACKGROUND_COLOR;
      row += `<td x="${i}" y="${j}" bgcolor="${bg}">
                <div class="highlight_overlay">
                  <div class="chosen_overlay"><img/></div>
                </div>
              </td>`;
    }
    row += '</tr>';
    rows += row;
  }
  $('table#chessboard').append(rows);
  $('table#chessboard td').click(cellOnClick);

  // Mulai game
  startGame();
});

// Fungsi untuk memulai / mereset game
function startGame() {
  board = new Board();
  setStatus('Your turn, You are white!');
  initBoard();
  choosingState = 'none';
  currentTurn = 'human';
  $('#moveLog').text('');
}

// Render ulang seluruh papan sesuai state Board
function updateBoard() {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      setCellContainer(i, j, board.get(i, j));
    }
  }
}

// Inisialisasi sekali, memanggil updateBoard ke setiap cell
function initBoard() {
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      cells[i][j] = getCell(i, j);
      setCellContainer(i, j, board.get(i, j));
    }
  }
}

// Mengeksekusi langkah: simpan log, perbarui UI
function makeMove(fromx, fromy, tox, toy, move) {
  choosingState = 'none';
  $('.enabled').removeClass('enabled');

  // Bila move sudah disediakan, pakai itu;  
  // jika tidak, ambil dari array moveTo (optional)
  const m = move || moveTo[fromx][fromy][tox][toy];

  board.makeMove(m);
  const log = moveToString(m);
  $('#moveLog').append(`${currentTurn.toUpperCase()}: ${log}\n`);

  updateBoard();
}

// Pemilihan bidak manusia
function chooseCell(x, y) {
  const possible = board.allMoves(true)
                        .filter(m => m.from.x === x && m.from.y === y);
  $('.enabled').removeClass('enabled');
  setCellStateSelecting(x, y);
  fromx = x; fromy = y;
  possible.forEach(m => {
    setCellStateHighlighting(m.to.x, m.to.y);
    // simpan move di array dua dimensi:
    moveTo[m.to.x][m.to.y] = m;
  });
  choosingState = 'chosen';
}

// Handle klik user
function cellOnClick() {
  if (choosingState === 'over' || currentTurn !== 'human') return;
  const x = +$(this).attr('x');
  const y = +$(this).attr('y');
  const state = checkState(x, y);

  if (board.isHuman(x, y)) {
    chooseCell(x, y);
  } else if (choosingState === 'chosen' && state === 'highlight') {
    makeMove(fromx, fromy, x, y);

    if (checkWin()) return;
    currentTurn = 'pc';
    setStatus('PC turn, he is thinking…');

    // Kirim konfigurasi ke Worker
    chessEngine.postMessage(board.getConfiguration());
  }
}

// Setup Web Worker untuk AI
const chessEngine = new Worker('chess/board.js', { type: 'module' });
chessEngine.addEventListener('message', e => {
  const m = e.data;
  makeMove(m.from.x, m.from.y, m.to.x, m.to.y, m);
  currentTurn = 'human';
  setStatus('Your turn, You are white!');
  checkWin();
});

// Status dan pengecekan pemenang
function setStatus(txt) { $('#status').text(txt); }
function checkWin() {
  const w = board.checkWin();
  if (w !== 0) {
    disableBoard();
    choosingState = 'over';
    setStatus(w === 1 ? 'You Win!' : 'You Lose!');
    return true;
  }
  return false;
}

function disableBoard() { $('#chessdiv').addClass('disabled'); }
function enableBoard() { $('#chessdiv').removeClass('disabled'); }

// Array untuk menyimpan move sementara
const moveTo = Array.from({ length: 8 }, () => Array(8).fill(null));
// Inisialisasi moveTo dengan objek Move kosong