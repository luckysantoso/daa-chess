// js/index.js

import { Board }        from './chess/board.js';
import { moveToString } from './chess/model/move.js';
import {
  PieceType,
  BLACK,
  WHITE,
  nameOf
}                       from './chess/model/piece.js';
import { GameState }    from './chess/constants.js';

// ────────────────────────────────────────────────────────────────────────
// We still use the old, pre-bundled chessboard.js inside a Worker
// for fast search.  UI & rendering remain modular.
// ────────────────────────────────────────────────────────────────────────

let currentTurn   = 'human';
let choosingState = 'none';
let game_depth    = 3;

const FIRST_BACKGROUND_COLOR  = '#AB7B2A';
const SECOND_BACKGROUND_COLOR = '#FFFAD5';

let cells   = [];
const moveTo = Array.from({ length: 8 }, () => Array(8).fill(null));
let board   = null;

// track pick-up location
let fromx = null;
let fromy = null;

/** Start or restart the game */
function startGame() {
  board = new Board({ maxDepth: game_depth });
  setStatus('Your turn, You are white!');
  initBoard();
  choosingState = 'none';
  currentTurn   = 'human';
  $('#moveLog').text('');
  $('.enabled').removeClass('enabled');
}
window.startGame = startGame;  // for inline onclick

/** Map piece → image URL */
function getModelOf(pc) {
  if (pc.type === PieceType.Empty) return '';
  const t = nameOf(pc.type);
  const c = pc.color === BLACK ? 'black' : 'white';
  return `images/${t}_${c}.png`;
}

function getCell(x,y) {
  return $(`[x=${x}][y=${y}]`);
}

function setCellContainer(x,y,pc) {
  const img = cells[x][y].find('img');
  const url = getModelOf(pc);
  if (url) img.attr('src', url);
  else     img.removeAttr('src');
}

function setCellStateSelecting(x,y) {
  cells[x][y].find('.chosen_overlay').addClass('enabled');
}
function setCellStateHighlighting(x,y) {
  cells[x][y].find('.highlight_overlay').addClass('enabled');
}
function setCellStateNormal(x,y) {
  cells[x][y]
    .find('.highlight_overlay, .chosen_overlay')
    .removeClass('enabled');
}
function checkState(x,y) {
  if (cells[x][y].find('.highlight_overlay').hasClass('enabled'))
    return 'highlight';
  if (cells[x][y].find('.chosen_overlay').hasClass('enabled'))
    return 'chosen';
  return 'normal';
}

function makeMove(fx, fy, tx, ty, overrideMove) {
  choosingState = 'none';
  $('.enabled').removeClass('enabled');

  const m = overrideMove || moveTo[tx][ty];
  board.makeMove(m);
  $('#moveLog').append(
    `${currentTurn.toUpperCase()}: ${moveToString(m)}\n`
  );

  // update only those two squares
  setCellContainer(fx, fy, board.get(fx, fy));
  setCellContainer(tx, ty, board.get(tx, ty));
}

function chooseCell(x,y) {
  fromx = x;
  fromy = y;

  const possible = board.getPossibleMovesFrom(x,y);
  $('.enabled').removeClass('enabled');
  setCellStateSelecting(x,y);

  possible.forEach(m => {
    setCellStateHighlighting(m.to.x, m.to.y);
    moveTo[m.to.x][m.to.y] = m;
  });
  choosingState = 'chosen';
}

function initBoard() {
  for (let i = 0; i < 8; i++) {
    cells[i] = [];
    for (let j = 0; j < 8; j++) {
      cells[i][j] = getCell(i, j);
      setCellContainer(i, j, board.get(i, j));
    }
  }
}

function checkWin() {
  const res = board.checkWin();
  if (res !== GameState.Normal) {
    choosingState = 'over';
    $('#chessdiv').addClass('disabled');
    setStatus(
      res === GameState.HumanWin
        ? 'Congratulations, You Win!'
        : 'Sorry, You Lose!'
    );
    return true;
  }
  return false;
}

function setStatus(txt) {
  $('#status').text(txt);
}

function cellOnClick() {
  if (choosingState === 'over' || currentTurn !== 'human') return;
  const x = +$(this).attr('x'), y = +$(this).attr('y');

  if (board.isHumanPiece(x,y)) {
    chooseCell(x,y);
  } else if (choosingState === 'chosen' && checkState(x,y) === 'highlight') {
    makeMove(fromx, fromy, x, y);
    if (checkWin()) return;

    currentTurn = 'pc';
    setStatus('PC is thinking…');
    // send only the board configuration
    chessEngine.postMessage(board.getConfiguration());
  }
}

$(document).ready(() => {
  // build the 8×8 grid
  let rows = '';
  for (let i = 0; i < 8; i++) {
    let r = '<tr>';
    for (let j = 0; j < 8; j++) {
      const bg = ((i + j) & 1)
        ? SECOND_BACKGROUND_COLOR
        : FIRST_BACKGROUND_COLOR;
      r += `<td x="${i}" y="${j}" bgcolor="${bg}">
              <div class="highlight_overlay">
                <div class="chosen_overlay"><img/></div>
              </div>
            </td>`;
    }
    r += '</tr>';
    rows += r;
  }
  $('table#chessboard').append(rows);
  $('table#chessboard td').click(cellOnClick);

  // difficulty selector
  $('input[name="difficulty"]').on('change', e => {
    game_depth = +e.target.value;
  });

  // background selector
  $('input[name="backgroundmode"]').on('change', e => {
    if (+e.target.value === 1) $('body').addClass('night');
    else                        $('body').removeClass('night');
  });

  // kick off the first game
  startGame();
});

// ───────────────────────────────────────────────────────────────────────────
// Hook up the original bundled chessboard.js worker
const chessEngine = new Worker('js/chessboard.js');
chessEngine.addEventListener('message', e => {
  const m = e.data;
  if (!m || !m.from) {
    console.error('Worker returned invalid move:', e.data);
    return;
  }
  makeMove(m.from.x, m.from.y, m.to.x, m.to.y, m);
  currentTurn   = 'human';
  choosingState = 'none';
  $('.enabled').removeClass('enabled');
  setStatus('Your turn, You are white!');
  checkWin();
});
