import { computeHash } from "./zobrist.js";
import { logStats } from "./logger.js";

const WHITE = 'w';
const BLACK = 'b';

let debug = {
    startTime: 0,
    nodes: 0,
    qNodes: 0,
    ttHits: 0,
    cutoffs: 0,
    maxDepth: 0
};

let piece_vals = {
    'p' : 100,
    'r': 500,
    'n': 320,
    'b': 330,
    'q': 900,
    'k': 20000
}

let pawnEvalWhite = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, -20, -20, 10, 10,  5,
    5, -5, -10,  0,  0, -10, -5,  5,
    0,  0,  0, 20, 20,  0,  0,  0,
    5,  5, 10, 25, 25, 10,  5,  5,
    10, 10, 20, 30, 30, 20, 10, 10,
    50, 50, 50, 50, 50, 50, 50, 50,
    0, 0, 0, 0, 0, 0, 0, 0
]

let pawnEvalBlack = pawnEvalWhite.reverse();

let knightEval = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
]

let bishopEvalWhite = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
]

let bishopEvalBlack = bishopEvalWhite.reverse();

let rookEvalWhite = [
    0, 0, 0, 5, 5, 0, 0, 0,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    5, 10, 10, 10, 10, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
]

let rookEvalBlack = rookEvalWhite.reverse();

let queenEval = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20
]

let kingEvalWhite = [
    20, 30, 10, 0, 0, 10, 30, 20,
    20, 20, 0, 0, 0, 0, 20, 20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, -30, -30, -40, -40, -30, -30, -20,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30
]

let kingEvalBlack = kingEvalWhite.reverse();

let kingEvalEndGameWhite = [
    50, -30, -30, -30, -30, -30, -30, -50,
    -30, -30,  0,  0,  0,  0, -30, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 30, 40, 40, 30, -10, -30,
    -30, -10, 20, 30, 30, 20, -10, -30,
    -30, -20, -10,  0,  0, -10, -20, -30,
    -50, -40, -30, -20, -20, -30, -40, -50
]

let kingEvalEndGameBlack = kingEvalEndGameWhite.reverse();

// https://github.com/healeycodes/andoma
// https://www.freecodecamp.org/news/simple-chess-ai-step-by-step-1d55a9266977/

function getPieceVal(piece, x, y, endgame) {
    if (piece === null || piece === undefined) return 0;

    let rank = y - 1;    
    let idx = (7 - rank) * 8 + x;
    let res = null;

    if(piece.type === 'p') {
        res = piece_vals[piece.type] + (piece.color == WHITE ? pawnEvalWhite[idx] : pawnEvalBlack[idx]);
    } else if(piece.type == 'r') {
        res = piece_vals[piece.type] + (piece.color == WHITE ? rookEvalWhite[idx] : rookEvalBlack[idx]);
    } else if(piece.type == 'n') {
        res = piece_vals[piece.type] + knightEval[idx];
    } else if(piece.type == 'b') {
        res = piece_vals[piece.type] + (piece.color == WHITE ? bishopEvalWhite[idx] : bishopEvalBlack[idx]);
    } else if(piece.type == 'q') {
        res = piece_vals[piece.type] + queenEval[idx];
    } else if(piece.type == 'k') {
        if(endgame) {
            res = piece_vals[piece.type] + (piece.color == WHITE ? kingEvalEndGameWhite[idx] : kingEvalEndGameBlack[idx]);
        } else {
            res = piece_vals[piece.type] + (piece.color == WHITE ? kingEvalWhite[idx] : kingEvalBlack[idx]);
        }
        
    }

    return piece.color == WHITE ? res : -res;

}

function squareToCoords(square) {
    let x = square.charCodeAt(0) - 97;
    let y = parseInt(square[1], 10);
    return {x, y};
}

function moveValue(board, move, endgame) {
    if (move.promotion) {
        return board.turn() === WHITE ? Infinity : -Infinity;
    }

    const piece = board.get(move.from);
    if (!piece) {
        throw new Error("No piece on from-square: " + move.from);
    }

    const from = squareToCoords(move.from);
    const to   = squareToCoords(move.to);

    const fromValue = getPieceVal(piece, from.x, from.y, endgame);
    const toValue   = getPieceVal(piece, to.x, to.y, endgame);

    let posChange = toValue - fromValue;

    let captureValue = 0;
    if (move.captured) {
        captureValue = evaluateCapture(board, move);
    }

    let score = posChange + captureValue;
    return board.turn() === WHITE ? score : -score;


}


function evaluateCapture(board, move) {
    // En passant
    if(move.flags && move.flags.includes('e')) {
        return piece_vals['p'];
    }
    let to = board.get(move.to);
    let from = board.get(move.from);

    if(to === undefined || from === undefined) {
        throw new Error("Pieces were expected at: ", to, " and ", from);
    }
    return piece_vals[to.type] - piece_vals[from.type];
}


function staticEvaluation(board) {
    let total_eval = 0
    let endgame = checkEndGame(board);

    for(let i=0; i<8; i++) {

        for(let j=1; j<=8; j++) {

            let square = String.fromCharCode(97+i) + j;

            let piece = board.get(square);

            total_eval += getPieceVal(piece, i, j, endgame);
            

        }
    }

    return total_eval;
}


// the horizon effect
function quiescence(board, alpha, beta) {
    debug.qNodes++;

    let standPat = staticEvaluation(board);

    if (standPat >= beta) return standPat;
    if (standPat > alpha) alpha = standPat;

    const moves = board.moves({ verbose: true })
        .filter(m => m.isCapture());

    // TODO: sort by MVV-LVA
    for (const move of moves) {
        board.move(move);
        const score = -quiescence(board, -beta, -alpha);
        board.undo();

        if (score >= beta) return score;
        if(score > standPat) standPat = score;
        if (score > alpha) alpha = score;
    }

    return standPat;
}



function getOrderedMoves(board, depth) {
    let endgame = checkEndGame(board);

    let moves = board.moves({verbose: true});
    
    // if(depth >= 4) return moves;

    moves.sort((a, b)=>{
        return moveValue(board, b, endgame) - moveValue(board, a, endgame);
    });

    return moves;
}

// transposition table
const TT = new Map();

function minimax(board, depth, alpha, beta, maximizing_player) {

    debug.nodes++;

    debug.maxDepth = Math.max(debug.maxDepth, depth);

    if (board.isCheckmate()) {
        return maximizing_player ? -1000000000 : 1000000000;
    } else if (board.isGameOver()) {
        return 0;
    }

    if(board.isThreefoldRepetition()) {
        return 0;
    }

    if(depth == 0) {
        return staticEvaluation(board);
        // return quiescence(board, alpha, beta);
    }

    const key = board.hash; 
    const entry = TT.get(key);
    if(entry && entry.depth >= depth) {
        debug.ttHits++;

        if(entry.flag === "EXACT") return entry.value;
        if(entry.flag === "LOWER") alpha = Math.max(alpha, entry.value);
        if(entry.flag === "UPPER") beta = Math.min(beta, entry.value);
        if(alpha >= beta) return entry.value;
    }

    let bestValue = maximizing_player ? -Infinity : Infinity;
    const alphaOrig = alpha;
    const betaOrig = beta;

    for(const move of getOrderedMoves(board, depth)) {
        board.move(move);
        let oldHash = board.hash;
        board.hash = computeHash(board);

        const score = minimax(board, depth-1, alpha, beta, !maximizing_player);
        board.undo();

        board.hash = oldHash;

        if(maximizing_player) {
            bestValue = Math.max(bestValue, score);
            alpha = Math.max(alpha, bestValue);
        } else {
            bestValue = Math.min(bestValue, score);
            beta = Math.min(beta, bestValue);
        }

        if(alpha >= beta) {
            debug.cutoffs++;
            break;
        } 
    }

    let flag = "EXACT";
    if(bestValue <= alphaOrig) flag = "UPPER";
    else if(bestValue >= betaOrig) flag = "LOWER";

    TT.set(key, {value: bestValue, depth, flag});

    return bestValue;

    
}


function checkEndGame(board) {
    /*  
        according to Michniewski
        both sides have no queens or a side that has a queen has no other pieces or one minorpiece maximum (bishop or knight)
    */
   let queens = 0;
   let minorChessPieces = 0;

   for(let i=0; i<8; i++) {

        for(let j=1; j<=8; j++) {

            let square = String.fromCharCode(97+i) + j;

            let piece = board.get(square);

            if(piece) {
                if(piece.type == 'q') 
                    queens++;
            }

            if (piece) {
                if(piece.type == 'b' || piece.type == 'n') 
                    minorChessPieces++;
            }
            

        }
    }

    if(queens == 0 || (queens == 2 && minorChessPieces <= 1)) {
        return true;
    }

    return false;

}

function findBestMoveAtDepth(board, depth, maximizing_player, pvMove) {
    let bestMove = null;
    let bestValue = -Infinity;

    let moves = getOrderedMoves(board, depth);

    if (pvMove) {
        moves = [pvMove, ...moves.filter(m => m !== pvMove)];
    }

    for(let move of getOrderedMoves(board, depth)) {
        board.move(move);

        let value = minimax(board, depth-1, -Infinity, Infinity, !maximizing_player);

        board.undo();
        
        if(value > bestValue) {
            bestValue = value;
            bestMove = move;
        }
        
    }

    return bestMove;
}

export function findBestMove(board, maxDepth, maximizing_player) {

    // clearing transposition table between moves
    TT.clear();

    debug.nodes = 0;
    debug.qNodes = 0;
    debug.ttHits = 0;
    debug.cutoffs = 0;
    debug.maxDepth = 0;
    debug.startTime = Date.now();

    let bestMove = null;

    for(let depth=1; depth <= maxDepth; depth++) {
        bestMove = findBestMoveAtDepth(board, depth, maximizing_player, bestMove);
    }

    const san = bestMove.san;

    
    logStats(debug, `Move played: ${san}`);
    

    return bestMove;
}


