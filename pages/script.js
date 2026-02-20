const WHITE = 'w';
const BLACK = 'b';

let $pgn = $('#pgn')

let currFen = 'start'; // if the first move is illegal that a person makes hence we set it to start
let humanColor = WHITE;
let botColor = humanColor === WHITE ? BLACK : WHITE;


function renderMoves(moves) {
  let html = '';
  let moveNumber = 1;

  for (let i = 0; i < moves.length; i += 2) {
    const white = moves[i]?.move ?? '';
    const black = moves[i + 1]?.move ?? '';
    html += `<div>${moveNumber}. ${white} ${black}</div>`;
    moveNumber++;
  }

  return html;
}



function onDrop(source, target, piece) {
  // if (piece[0] !== humanColor) return 'snapback';

  const move = {
    from: source,
    to: target,
    promotion: 'q'
  };

  fetch('http://localhost:3000/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(move)
  })
  .then(res => res.json())
  .then(data => {
    if (data.res === 'invalid_move') {
      board.position(currFen);
      return;
    }

    currFen = data.fen;
    $pgn.html(renderMoves(data.pgn[0].moves));
    board.position(currFen);

    if (data.isCheckmate) {
      alert("Checkmate!");
      return;
    }

    fetch('http://localhost:3000/getaimove')
      .then(res => res.json())
      .then(botData => {
        currFen = botData.fen;
        console.log(botData);
        if(humanColor == WHITE) {
          $pgn.html(renderMoves(botData.pgn[0].moves)); // write the bot move down in html
          console.log(botData.pgn[0].moves);
        } 
        board.position(currFen);
        if (data.isCheckmate) {
          alert("Checkmate!");
          return;
        }
      });
  });
  return;
}

var config = {
    draggable: true,
    position: 'start',
    orientation: humanColor === 'w' ? 'white' : 'black',
    onDrop: onDrop,
    // onChange: onChange
}

var board = Chessboard('myBoard', config)


document.getElementById("flipBoardBtn").addEventListener("click", () => {
  board.flip();
});

document.getElementById('whiteBtn').addEventListener('click', ()=>{
  humanColor = WHITE;
})

document.getElementById('blackBtn').addEventListener('click', ()=>{
  humanColor = BLACK;
  // bot opens if human is black
  if (humanColor === 'b') {
    fetch('http://localhost:3000/getaimove')
      .then(res => res.json())
      .then(data => {
        currFen = data.fen;
        $pgn.html(renderMoves(data.pgn[0].moves));
        board.position(currFen);
      });
  }
})

document.getElementById('resetGameBtn').addEventListener('click', ()=>{
  fetch('http://localhost:3000/reset')
  .then(res => res.json())
  .then(data=>{
    console.log(data);
    board.position('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 ');
  })
})


// board.position() = current position as an object
// board.fen() = current position as a FEN string

