const board = document.getElementById('gameboard');
const winnerDisplay = document.getElementById('winner');
const modal = document.getElementById('modal');
const checkModal = document.getElementById('check-modal');
const closeBtn = document.querySelector('.close');

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
            return isValidKingMove(from, to);
        default:
            return false;
    }
}

function isValidKingMove(from, to) {
    const dr = to.row - from.row;
    const dc = to.col - from.col;

    // Check if the move is within one square in any direction
    if (Math.abs(dr) <= 1 && Math.abs(dc) <= 1) {
        // Temporarily move the king to the new position
        const originalPiece = gameboard[from.row][from.col];
        gameboard[from.row][from.col] = '';
        gameboard[to.row][to.col] = originalPiece;

        const opponentColor = currentTurn === 'white' ? 'black' : 'white';
        const isSafe = !isKingInCheck(opponentColor); // Check if the king is in check after the move

        // Restore original position
        gameboard[to.row][to.col] = '';
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
    gameboard[selectedPosition.row][selectedPosition.col] = '';
    gameboard[row][col] = selectedPiece;
    drawBoard();
}

function highlightValidMoves(piece, position) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (isValidMove(piece, position, { row, col })) {
                const square = document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
                square.classList.add('highlight');
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
        kingSquare.style.backgroundColor = 'red';
    }

    winnerDisplay.textContent = `${winner} wins!`;

    setTimeout(() => {
        modal.style.display = "block";
    }, 500);
}

function showCheckAlert(opponent) {
    const message = `${opponent} king is in check!`;
    const checkMessage = document.getElementById('check-message');
    checkMessage.textContent = message;

    setTimeout(() => {
        checkModal.style.display = "block"; // Show the check alert
        setTimeout(() => {
            checkModal.style.display = "none"; // Hide the alert after 2 seconds
        }, 3000);
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
