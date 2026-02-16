import express from 'express';
import cors from 'cors';
import { Chess } from 'chess.js';
import { parse } from 'pgn-parser';
import { findBestMove } from './algorithm.js';
import { computeHash, initZobrist } from './zobrist.js';

initZobrist();

const WHITE = 'w';
const BLACK = 'b';

const app = express();
app.use(cors()); // enabling all CORS requests, for dev/test
app.use(express.json());
const PORT = 3000;

let chess = new Chess();

// state vars
let isCheckmate = false;
let isFirst = true;

app.get('/', (req, res)=>{
    res.send('Hello World with ES6');
})

app.get('/reset', (req, res)=>{
    chess = new Chess();
    isCheckmate = false;
    res.send(JSON.stringify({'reset' : 'done'}))
})

app.post('/validate', (req, res)=>{
    const {from, to, promotion} = req.body;
    
    try {
        const move = chess.move({from: from, to: to, promotion: promotion});
        console.log("Valid move");
        if(chess.isCheckmate()) {
            isCheckmate = true;
        }
        res.send(
            JSON.stringify({
                res: "valid_move",
                fen: chess.fen(),
                pgn: parse(chess.pgn()), // parsed pgn
                move,
                isCheckmate
            })
        )
    } catch(_) {
        console.log("Invalid move");
        console.log('from: ', from, ' to: ', to);
        res.send(JSON.stringify({"res" : "invalid_move"}))
    }

})

app.get('/getaimove', (req, res)=>{
    if(isFirst) {
        chess.hash = computeHash(chess);
        isFirst = false;
    }
    // const moves = chess.moves();
    // const move = moves[Math.floor(Math.random() * moves.length)];
    // chess.move(move);
    let move = findBestMove(chess, 5, chess.turn() == WHITE);
    chess.move(move);
    // check for mate
    if(chess.isCheckmate()) {
        isCheckmate = true;
    }
    res.send(
        JSON.stringify({
            res: "valid_move",
            fen: chess.fen(),
            pgn: parse(chess.pgn()),
            move,
            isCheckmate
        })
    )

})

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})




// while(!chess.isGameOver()) {
//     const moves = chess.moves();
//     const move = moves[Math.floor(Math.random() * moves.length)]
//     chess.move(move);
// }

// console.log(chess.pgn());

