const PIECES = ['p','n','b','r','q','k','P','N','B','R','Q','K'];
const Z_PIECE = {};

const Z_SIDE = random64();

function random64() {
    return BigInt.asUintN(
        64,
        BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER))
    );
}

export function initZobrist() {
    for (const p of PIECES) {
        Z_PIECE[p] = Array(64);
        for (let sq = 0; sq < 64; sq++) {
            Z_PIECE[p][sq] = random64();
        }
    }
}

function squareIndex(square) {
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10) - 1; 
    return rank * 8 + file;
}

export function computeHash(board) {
    let hash = 0n;

    for(let r = 1; r<=8; r++) {
        for(let f=0; f<8; f++) {
            const square = String.fromCharCode(97+f) + r;
            const piece = board.get(square);
            if(!piece) continue;

            const p = piece.color == 'w' ? piece.type.toUpperCase() : piece.type;

            hash ^= Z_PIECE[p][squareIndex(square)];
        }
    }

    if(board.turn() == 'b') {
        hash ^= Z_SIDE;
    }

    return hash;
}

export function updateHash(hash, move) {
    const from = squareIndex(move.from);
    const to = squareIndex(move.to);

    const piece = move.color === 'w'
        ? move.piece.toUpperCase()
        : move.piece;

    hash ^= Z_PIECE[piece][from];
    hash ^= Z_PIECE[piece][to];

    if (move.captured) {
        const cap = move.color === 'w'
            ? move.captured
            : move.captured.toUpperCase();
        hash ^= Z_PIECE[cap][to];
    }

    hash ^= Z_SIDE;
    return hash;
}



