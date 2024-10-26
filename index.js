const board = document.getElementById('gameboard');
const winnerDisplay = document.getElementById('winner');
const modal = document.getElementById('modal');
const checkModal = document.getElementById('check-modal');
const closeBtn = document.querySelector('.close');
const restartBtn = document.getElementById('restart-btn');

let whiteKingMoved = false;
let blackKingMoved = false;
let whiteRookMoved = { left: false, right: false };
let blackRookMoved = { left: false, right: false };

const pieces = {
    K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟',
    k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

let gameboard = [
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
];

let selectedPiece = null;
let selectedPosition = null;
let currentTurn = 'white';

function drawBoard() {
    board.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square', (row + col) % 2 === 0 ? 'white' : 'black');
            square.dataset.row = row;
            square.dataset.col = col;

            if (gameboard[row][col]) {
                const piece = document.createElement('div');
                piece.classList.add('piece', gameboard[row][col] === gameboard[row][col].toUpperCase() ? 'piece-white' : 'piece-black');
                piece.textContent = pieces[gameboard[row][col]];
                square.appendChild(piece);
            }

            square.addEventListener('click', () => handleSquareClick(row, col));
            board.appendChild(square);
        }
    }
    updatePlayerClasses();
}

function handleSquareClick(row, col) {
    clearHighlights();
    if (!selectedPiece) {
        if (gameboard[row][col]) {
            const pieceColor = gameboard[row][col] === gameboard[row][col].toUpperCase() ? 'white' : 'black';
            if ((currentTurn === 'white' && pieceColor === 'white') || (currentTurn === 'black' && pieceColor === 'black')) {
                selectedPiece = gameboard[row][col];
                selectedPosition = { row, col };
                highlightValidMoves(selectedPiece, selectedPosition);
                highlightSelectedPiece(row, col);
            }
        }
    } else {
        if (isValidMove(selectedPiece, selectedPosition, { row, col })) {
            if (gameboard[row][col].toLowerCase() === 'k') {
                endGame(currentTurn === 'white' ? 'White' : 'Black', row, col);
            } else {
                movePiece(row, col);
                const opponentColor = currentTurn === 'white' ? 'black' : 'white';
                if (isKingInCheck(opponentColor)) {
                    showCheckAlert(opponentColor === 'white' ? 'White' : 'Black');
                }
                currentTurn = currentTurn === 'white' ? 'black' : 'white';
                updatePlayerClasses();
            }
        }
        selectedPiece = null;
        selectedPosition = null;
    }
}

function highlightKingInCheck(kingPosition) {
    const kingSquare = document.querySelector(`.square[data-row="${kingPosition.row}"][data-col="${kingPosition.col}"]`);
    if (kingSquare) {
        kingSquare.style.backgroundColor = 'red';
    }
}

function findKing(king) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (gameboard[row][col] === king) {
                return { row, col };
            }
        }
    }
    return null;
}

function updatePlayerClasses() {
    const whitePlayer = document.getElementById('white-player');
    const blackPlayer = document.getElementById('black-player');

    if (currentTurn === 'white') {
        whitePlayer.classList.add('active');
        blackPlayer.classList.remove('active');
    } else {
        blackPlayer.classList.add('active');
        whitePlayer.classList.remove('active');
    }
}

function highlightSelectedPiece(row, col) {
    const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
    if (square) {
        const pieceDiv = square.querySelector('.piece');
        if (pieceDiv) {
            pieceDiv.classList.add('selected');
        }
    }
}

function isValidMove(piece, from, to) {
    const dr = to.row - from.row;
    const dc = to.col - from.col;
    const targetSquare = gameboard[to.row][to.col];
    const isEmpty = targetSquare === '';

    const targetPieceColor = targetSquare ? (targetSquare === targetSquare.toUpperCase() ? 'white' : 'black') : null;

    if ((currentTurn === 'white' && targetPieceColor === 'white') || (currentTurn === 'black' && targetPieceColor === 'black')) {
        return false;
    }

    switch (piece.toLowerCase()) {
        case 'p':
            if (piece === 'P') { // White pawn
                return (
                    (dr === -1 && dc === 0 && isEmpty) || // Move one square forward
                    (dr === -2 && dc === 0 && from.row === 6 && isEmpty && gameboard[from.row - 1][from.col] === '') || // Move two squares forward from starting row
                    (dr === -1 && Math.abs(dc) === 1 && targetSquare && targetSquare === targetSquare.toLowerCase()) // Capture move
                );
            } else { // Black pawn
                return (
                    (dr === 1 && dc === 0 && isEmpty) || // Move one square forward
                    (dr === 2 && dc === 0 && from.row === 1 && isEmpty && gameboard[from.row + 1][from.col] === '') || // Move two squares forward from starting row
                    (dr === 1 && Math.abs(dc) === 1 && targetSquare && targetSquare === targetSquare.toUpperCase()) // Capture move
                );
            }
        case 'r':
            return (dr === 0 || dc === 0) && pathIsClear(from, to);
        case 'n':
            return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
        case 'b':
            return Math.abs(dr) === Math.abs(dc) && pathIsClear(from, to);
        case 'q':
            return (Math.abs(dr) === Math.abs(dc) || dr === 0 || dc === 0) && pathIsClear(from, to);
        case 'k':
            // King moves
            if (isValidKingMove(from, to)) {
                return true;
            }
            // Castling logic
            if (!whiteKingMoved && piece === 'K' && from.row === 7 && from.col === 4) {
                if (to.row === 7 && to.col === 6 && !whiteRookMoved.right && gameboard[7][5] === '' && gameboard[7][6] === '') {
                    // Castling short (king side)
                    return !isSquareUnderAttack({ row: 7, col: 4 }, 'black') &&
                            !isSquareUnderAttack({ row: 7, col: 5 }, 'black') &&
                            !isSquareUnderAttack({ row: 7, col: 6 }, 'black');
                } else if (to.row === 7 && to.col === 2 && !whiteRookMoved.left && gameboard[7][1] === '' && gameboard[7][2] === '' && gameboard[7][3] === '') {
                    // Castling long (queen side)
                    return !isSquareUnderAttack({ row: 7, col: 4 }, 'black') &&
                            !isSquareUnderAttack({ row: 7, col: 3 }, 'black') &&
                            !isSquareUnderAttack({ row: 7, col: 2 }, 'black');
                }
            } else if (!blackKingMoved && piece === 'k' && from.row === 0 && from.col === 4) {
                if (to.row === 0 && to.col === 6 && !blackRookMoved.right && gameboard[0][5] === '' && gameboard[0][6] === '') {
                    // Castling short (king side)
                    return !isSquareUnderAttack({ row: 0, col: 4 }, 'white') &&
                            !isSquareUnderAttack({ row: 0, col: 5 }, 'white') &&
                            !isSquareUnderAttack({ row: 0, col: 6 }, 'white');
                } else if (to.row === 0 && to.col === 2 && !blackRookMoved.left && gameboard[0][1] === '' && gameboard[0][2] === '' && gameboard[0][3] === '') {
                    // Castling long (queen side)
                    return !isSquareUnderAttack({ row: 0, col: 4 }, 'white') &&
                            !isSquareUnderAttack({ row: 0, col: 3 }, 'white') &&
                            !isSquareUnderAttack({ row: 0, col: 2 }, 'white');
                }
            }
            return false;
        default:
            return false;
    }
}

function isSquareUnderAttack(square, attackerColor) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameboard[row][col];
            if (piece && ((attackerColor === 'white' && piece === piece.toUpperCase()) ||
                          (attackerColor === 'black' && piece === piece.toLowerCase()))) {
                if (isValidMove(piece, { row, col }, square)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function isKingInCheck(opponentColor) {
    const kingPosition = findKing(opponentColor === 'white' ? 'K' : 'k');

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameboard[row][col];
            if (piece && ((opponentColor === 'white' && piece === piece.toLowerCase()) ||
                (opponentColor === 'black' && piece === piece.toUpperCase()))) {
                if (isValidMove(piece, { row, col }, kingPosition)) {
                    highlightKingInCheck(kingPosition); // Highlight king in check
                    return true;
                }
            }
        }
    }

    return false;
}

function isValidKingMove(from, to) {
    const dr = to.row - from.row;
    const dc = to.col - from.col;

    // Check if the move is within one square in any direction
    if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
        // Temporarily move the king to the new position
        const originalPiece = gameboard[from.row][from.col];
        const targetPiece = gameboard[to.row][to.col];
        gameboard[from.row][from.col] = '';
        gameboard[to.row][to.col] = originalPiece;

        const isSafe = !isSquareUnderAttack(to, currentTurn === 'white' ? 'black' : 'white');

        // Restore original position
        gameboard[to.row][to.col] = targetPiece;
        gameboard[from.row][from.col] = originalPiece;

        return isSafe; // Return whether the move is safe
    }
    return false; // Invalid move
}

function pathIsClear(from, to) {
    const dr = Math.sign(to.row - from.row);
    const dc = Math.sign(to.col - from.col);
    let row = from.row + dr;
    let col = from.col + dc;

    while (row !== to.row || col !== to.col) {
        if (gameboard[row][col]) return false;
        row += dr;
        col += dc;
    }
    return true;
}

function movePiece(row, col) {
    const isCastlingMove = selectedPiece.toLowerCase() === 'k' && Math.abs(selectedPosition.col - col) === 2;

    gameboard[selectedPosition.row][selectedPosition.col] = '';
    gameboard[row][col] = selectedPiece;

    // Handle castling: move the rook accordingly
    if (isCastlingMove) {
        if (selectedPiece === 'K' && row === 7) {
            if (col === 6) { // King-side castling
                gameboard[7][7] = ''; // Remove rook from h1
                gameboard[7][5] = 'R'; // Place rook on f1
                whiteRookMoved.right = true;
            } else if (col === 2) { // Queen-side castling
                gameboard[7][0] = ''; // Remove rook from a1
                gameboard[7][3] = 'R'; // Place rook on d1
                whiteRookMoved.left = true;
            }
            whiteKingMoved = true;
        } 
        else if (selectedPiece === 'k' && row === 0) {
            if (col === 6) { // King-side castling
                gameboard[0][7] = ''; // Remove rook from h8
                gameboard[0][5] = 'r'; // Place rook on f8
                blackRookMoved.right = true;
            } else if (col === 2) { // Queen-side castling
                gameboard[0][0] = ''; // Remove rook from a8
                gameboard[0][3] = 'r'; // Place rook on d8
                blackRookMoved.left = true;
            }
            blackKingMoved = true;
        }
    }

    // Handle regular moves for the king and rooks (update move flags)
    if (selectedPiece === 'K') whiteKingMoved = true;
    if (selectedPiece === 'k') blackKingMoved = true;
    if (selectedPiece === 'R' && selectedPosition.row === 7) {
        if (selectedPosition.col === 0) whiteRookMoved.left = true;
        else if (selectedPosition.col === 7) whiteRookMoved.right = true;
    }
    if (selectedPiece === 'r' && selectedPosition.row === 0) {
        if (selectedPosition.col === 0) blackRookMoved.left = true;
        else if (selectedPosition.col === 7) blackRookMoved.right = true;
    }

    // Pawn promotion logic remains unchanged
    if (selectedPiece === 'P' && row === 0) {
        gameboard[row][col] = 'Q'; // Promote white pawn to queen
    } else if (selectedPiece === 'p' && row === 7) {
        gameboard[row][col] = 'q'; // Promote black pawn to queen
    }

    drawBoard();
}

function highlightValidMoves(piece, position) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            // Check if the move is valid
            if (isValidMove(piece, position, { row, col })) {
                const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
                
                // Check if the move is under attack, and highlight accordingly
                if (piece.toLowerCase() === 'k') {
                    const opponentColor = currentTurn === 'white' ? 'black' : 'white';
                    if (isSquareUnderAttack({ row, col }, opponentColor)) {
                        square.style.backgroundColor = 'red'; // Highlight in red if under attack
                    } else {
                        square.classList.add('highlight'); // Default highlight for safe moves
                    }
                } else {
                    square.classList.add('highlight'); // Default highlight for non-king pieces
                }
            }
        }
    }
}

function clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => square.classList.remove('highlight'));
    const selectedPieces = document.querySelectorAll('.selected');
    selectedPieces.forEach(piece => piece.classList.remove('selected'));
}

function endGame(winner, kingRow, kingCol) {
    const kingSquare = document.querySelector(`.square[data-row="${kingRow}"][data-col="${kingCol}"]`);
    
    if (kingSquare) {
        kingSquare.classList.add('checkmate-indicator'); // Add a checkmate indicator class
    }

    winnerDisplay.textContent = `${winner} wins!`;

    setTimeout(() => {
        modal.style.display = "block";
    }, 1000);
}

function restartGame() {
    // Reset game state
    gameboard = [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    currentTurn = 'white';
    selectedPiece = null;
    selectedPosition = null;
    whiteKingMoved = false;
    blackKingMoved = false;
    whiteRookMoved = { left: false, right: false };
    blackRookMoved = { left: false, right: false };

    // Hide modal and redraw the board
    modal.style.display = "none";
    drawBoard();
}
restartBtn.onclick = restartGame;

function showCheckAlert(opponent) {
    const message = `${opponent} king is in check!`;
    const checkMessage = document.getElementById('check-message');
    checkMessage.textContent = message;

    setTimeout(() => {
        checkModal.style.display = "block"; // Show the check alert
        setTimeout(() => {
            checkModal.style.display = "none"; // Hide the alert after 2 seconds
        }, 2000);
    }, 100); // Small delay before showing the alert
}

closeBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target === modal || event.target === checkModal) {
        modal.style.display = "none";
        checkModal.style.display = "none";
    }
}

drawBoard();
