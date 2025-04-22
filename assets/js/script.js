// assets/js/script.js

// Initialize AOS (Animate On Scroll)
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 800, // Animation duration
        once: true // Whether animation should happen only once - while scrolling down
    });

    // --- Tetris Game Logic Start ---
    const canvas = document.getElementById('tetris-canvas');
    const context = canvas.getContext('2d');
    const nextPieceCanvas = document.getElementById('next-piece-canvas'); // Get next piece canvas
    const nextPieceContext = nextPieceCanvas.getContext('2d'); // Get context for next piece canvas
    const scoreElement = document.getElementById('score');
    const startButton = document.getElementById('start-tetris-button'); // Get start button

    const ROW = 20;
    const COL = 10;
    const SQ = 20; // Size of a square for the main board
    const NEXT_SQ = 20; // Size of a square for the next piece canvas
    const VACANT = "#FFF"; // Color of an empty square

    // Set canvas dimensions explicitly
    canvas.width = COL * SQ;
    canvas.height = ROW * SQ;
    // Also set the CSS display size to match the drawing surface
    canvas.style.width = `${COL * SQ}px`;
    canvas.style.height = `${ROW * SQ}px`;

    // Increase next piece canvas size to 5x5
    const nextPreviewSize = 5;
    nextPieceCanvas.width = nextPreviewSize * NEXT_SQ;
    nextPieceCanvas.height = nextPreviewSize * NEXT_SQ;
    // Also set the CSS display size for the next piece canvas
    nextPieceCanvas.style.width = `${nextPreviewSize * NEXT_SQ}px`;
    nextPieceCanvas.style.height = `${nextPreviewSize * NEXT_SQ}px`;

    // Draw a square (modified to accept context and square size)
    function drawSquare(ctx, x, y, color, sqSize) {
        ctx.fillStyle = color;
        ctx.fillRect(x * sqSize, y * sqSize, sqSize, sqSize);
        ctx.strokeStyle = "#CCC";
        ctx.strokeRect(x * sqSize, y * sqSize, sqSize, sqSize);
    }

    // Create the board
    let board = [];
    for (let r = 0; r < ROW; r++) {
        board[r] = [];
        for (let c = 0; c < COL; c++) {
            board[r][c] = VACANT;
        }
    }

    // Draw the board
    function drawBoard() {
        for (let r = 0; r < ROW; r++) {
            for (let c = 0; c < COL; c++) {
                drawSquare(context, c, r, board[r][c], SQ); // Use main context and SQ
            }
        }
    }

    drawBoard();

    // The pieces and their colors
    const PIECES = [
        [Z, "red"],
        [S, "green"],
        [T, "#6a0dad"],
        [O, "blue"],
        [L, "purple"],
        [I, "cyan"],
        [J, "orange"]
    ];

    let p;
    let nextP; // Variable to hold the next piece

    // Generate random pieces
    function randomPiece() {
        let r = Math.floor(Math.random() * PIECES.length); // 0 -> 6
        return new Piece(PIECES[r][0], PIECES[r][1]);
    }

    // Function to draw the next piece
    function drawNextPiece() {
        // Clear the next piece canvas
        nextPieceContext.fillStyle = VACANT;
        nextPieceContext.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);

        if (!nextP) return; // Don't draw if no next piece

        const piece = nextP.tetromino[0]; // Use the initial rotation
        const color = nextP.color;
        const pieceMatrixSize = piece.length; // Size of the tetromino matrix (e.g., 2, 3, or 4)
        // Use the updated canvas dimensions (now 5x5 grid)
        const canvasGridWidth = nextPieceCanvas.width / NEXT_SQ; // Should be 5
        const canvasGridHeight = nextPieceCanvas.height / NEXT_SQ; // Should be 5

        // Calculate offsets to center the piece's matrix within the 5x5 grid
        const offsetX = Math.floor((canvasGridWidth - pieceMatrixSize) / 2);
        const offsetY = Math.floor((canvasGridHeight - pieceMatrixSize) / 2);

        for (let r = 0; r < pieceMatrixSize; r++) {
            for (let c = 0; c < pieceMatrixSize; c++) {
                if (piece[r][c]) {
                    // Ensure drawing stays within the next piece canvas bounds if piece is large (like I)
                    if (offsetX + c < canvasGridWidth && offsetY + r < canvasGridHeight) {
                        drawSquare(nextPieceContext, offsetX + c, offsetY + r, color, NEXT_SQ);
                    }
                }
            }
        }
    }

    // The Object Piece
    function Piece(tetromino, color) {
        this.tetromino = tetromino;
        this.color = color;

        this.tetrominoN = 0; // Start from the first pattern
        this.activeTetromino = this.tetromino[this.tetrominoN];

        // Control the pieces
        this.x = 3;
        this.y = -2; // Start slightly above the board
    }

    // Fill function (modified to accept context and square size)
    Piece.prototype.fill = function(color, ctx = context, sqSize = SQ) {
        for (let r = 0; r < this.activeTetromino.length; r++) {
            for (let c = 0; c < this.activeTetromino.length; c++) {
                // Draw only occupied squares
                if (this.activeTetromino[r][c]) {
                    // Check bounds before drawing (important for initial placement)
                    if (this.y + r >= 0) {
                        drawSquare(ctx, this.x + c, this.y + r, color, sqSize);
                    }
                }
            }
        }
    };

    // Draw a piece to the board
    Piece.prototype.draw = function() {
        this.fill(this.color); // Defaults to main context and SQ
    };

    // Undraw a piece
    Piece.prototype.unDraw = function() {
        this.fill(VACANT); // Defaults to main context and SQ
    };

    // Move Down the piece
    Piece.prototype.moveDown = function() {
        if (!this.collision(0, 1, this.activeTetromino)) {
            this.unDraw();
            this.y++;
            this.draw();
        } else {
            // Lock the piece and generate a new one
            this.lock();
            p = nextP; // Current piece becomes the next piece
            nextP = randomPiece(); // Generate a new next piece
            drawNextPiece(); // Draw the new next piece
            if (gameOver) return; // Stop if game over after locking
            p.draw(); // Draw the new current piece
        }
    };

    // Move Right the piece
    Piece.prototype.moveRight = function() {
        if (!this.collision(1, 0, this.activeTetromino)) {
            this.unDraw();
            this.x++;
            this.draw();
        }
    };

    // Move Left the piece
    Piece.prototype.moveLeft = function() {
        if (!this.collision(-1, 0, this.activeTetromino)) {
            this.unDraw();
            this.x--;
            this.draw();
        }
    };

    // Rotate the piece
    Piece.prototype.rotate = function() {
        let nextPattern = this.tetromino[(this.tetrominoN + 1) % this.tetromino.length];
        let kick = 0;

        if (this.collision(0, 0, nextPattern)) {
            if (this.x > COL / 2) {
                // It's the right wall
                kick = -1; // Move the piece to the left
            } else {
                // It's the left wall
                kick = 1; // Move the piece to the right
            }
        }

        if (!this.collision(kick, 0, nextPattern)) {
            this.unDraw();
            this.x += kick;
            this.tetrominoN = (this.tetrominoN + 1) % this.tetromino.length;
            this.activeTetromino = this.tetromino[this.tetrominoN];
            this.draw();
        }
    };

    let score = 0;
    let gameOver = false;
    let gameStarted = false; // Flag to track game state
    let gameLoopId = null; // To store the animation frame ID
    let paused = false; // Flag to track pause state

    Piece.prototype.lock = function() {
        for (let r = 0; r < this.activeTetromino.length; r++) {
            for (let c = 0; c < this.activeTetromino.length; c++) {
                // Skip the vacant squares
                if (!this.activeTetromino[r][c]) {
                    continue;
                }
                // Pieces to lock on top = game over
                if (this.y + r < 0) {
                    gameOver = true;
                    // Optional: Display Game Over message
                    alert("Game Over! Score: " + score + ". Refresh to play again.");
                    // Stop request animation frame
                    if (gameLoopId) cancelAnimationFrame(gameLoopId);
                    return;
                }
                // Lock the piece
                board[this.y + r][this.x + c] = this.color;
            }
        }

        // Remove full rows
        for (let r = 0; r < ROW; r++) {
            let isRowFull = true;
            for (let c = 0; c < COL; c++) {
                isRowFull = isRowFull && (board[r][c] != VACANT);
            }
            if (isRowFull) {
                // Move down all rows above it
                for (let y = r; y > 1; y--) {
                    for (let c = 0; c < COL; c++) {
                        board[y][c] = board[y - 1][c];
                    }
                }
                // The top row board[0][..] has no row above it
                for (let c = 0; c < COL; c++) {
                    board[0][c] = VACANT;
                }
                // Increment the score
                score += 10;
            }
        }
        // Update the board
        drawBoard();

        // Update the score
        scoreElement.innerHTML = score;
    };

    // Collision function
    Piece.prototype.collision = function(x, y, piece) {
        for (let r = 0; r < piece.length; r++) {
            for (let c = 0; c < piece.length; c++) {
                // If the square is empty, skip it
                if (!piece[r][c]) {
                    continue;
                }
                // Coordinates of the piece after movement
                let newX = this.x + c + x;
                let newY = this.y + r + y;

                // Conditions
                if (newX < 0 || newX >= COL || newY >= ROW) {
                    return true; // Collision with walls/floor
                }
                // Skip newY < 0; board[-1] will crush the game
                if (newY < 0) {
                    continue;
                }
                // Check if there is a locked piece already in place
                if (board[newY][newX] != VACANT) {
                    return true; // Collision with locked piece
                }
            }
        }
        return false;
    };

    // Control the piece
    document.addEventListener("keydown", CONTROL);

    function CONTROL(event) {
        if (!gameStarted || gameOver || paused) return; // Only control if game is active

        let handled = false;
        if (event.keyCode == 37) {
            p.moveLeft();
            handled = true;
        } else if (event.keyCode == 38) {
            p.rotate();
            handled = true;
        } else if (event.keyCode == 39) {
            p.moveRight();
            handled = true;
        } else if (event.keyCode == 40) {
            p.moveDown();
            handled = true;
        }

        if (handled) {
            event.preventDefault(); // Prevent default arrow key actions (scrolling)
        }
    }

    // Drop the piece every 1 sec
    let dropStart = Date.now();
    function drop() {
        if (gameOver || paused) {
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            return;
        }
        let now = Date.now();
        let delta = now - dropStart;
        if (delta > 1000) { // Drop every 1000ms (1 second)
            p.moveDown();
            dropStart = Date.now();
        }
        gameLoopId = requestAnimationFrame(drop);
    }

    // Function to initialize and start the game
    function startGame() {
        if (gameStarted) return; // Prevent multiple starts

        // Reset board
        board = [];
        for (let r = 0; r < ROW; r++) {
            board[r] = [];
            for (let c = 0; c < COL; c++) {
                board[r][c] = VACANT;
            }
        }
        drawBoard();

        // Reset score and game state
        score = 0;
        scoreElement.innerHTML = score;
        gameOver = false;
        gameStarted = true;

        // Get first piece
        p = randomPiece();
        nextP = randomPiece(); // Generate the first next piece
        p.draw();
        drawNextPiece(); // Draw the first next piece

        // Start game loop
        dropStart = Date.now();
        if (gameLoopId) cancelAnimationFrame(gameLoopId); // Clear previous loop if any
        drop();

        // Update button state
        startButton.textContent = "Pause"; // Change text to Pause
        startButton.disabled = false; // Ensure it's enabled
    }

    // Function to toggle pause state
    function togglePause() {
        if (!gameStarted || gameOver) return;

        paused = !paused;

        if (paused) {
            // Pause the game
            if (gameLoopId) {
                cancelAnimationFrame(gameLoopId);
                gameLoopId = null; // Indicate loop is stopped
            }
            startButton.textContent = "Resume";
            // Optional: Display pause message on canvas
        } else {
            // Resume the game
            startButton.textContent = "Pause";
            dropStart = Date.now(); // Reset drop timer to prevent immediate drop
            // Restart the game loop if it was stopped
            if (!gameLoopId) {
                drop();
            }
        }
    }

    // Combined event listener for the button
    if (startButton) {
        startButton.addEventListener('click', () => { // Use a single 'click' listener
            if (!gameStarted || gameOver) {
                startGame();
            } else {
                togglePause();
            }
        });
    }

    // Only draw the initial board state, don't start the game loop automatically
    if (canvas) {
        drawBoard(); // Initial draw of empty board
        drawNextPiece(); // Draw initial state of next piece canvas (empty)
    }
    // --- Tetris Game Logic End ---
});

// --- Tetromino Definitions Start ---
// (These should be defined globally or passed into the Piece class properly)
const Z = [
    [[1, 1, 0],
     [0, 1, 1],
     [0, 0, 0]],

    [[0, 0, 1],
     [0, 1, 1],
     [0, 1, 0]]
];

const S = [
    [[0, 1, 1],
     [1, 1, 0],
     [0, 0, 0]],

    [[0, 1, 0],
     [0, 1, 1],
     [0, 0, 1]]
];

const T = [
    [[0, 1, 0],
     [1, 1, 1],
     [0, 0, 0]],

    [[0, 1, 0],
     [0, 1, 1],
     [0, 1, 0]],

    [[0, 0, 0],
     [1, 1, 1],
     [0, 1, 0]],

    [[0, 1, 0],
     [1, 1, 0],
     [0, 1, 0]]
];

const O = [
    [[1, 1],
     [1, 1]]
];

const L = [
    [[0, 0, 1],
     [1, 1, 1],
     [0, 0, 0]],

    [[0, 1, 0],
     [0, 1, 0],
     [0, 1, 1]],

    [[0, 0, 0],
     [1, 1, 1],
     [1, 0, 0]],

    [[1, 1, 0],
     [0, 1, 0],
     [0, 1, 0]]
];

const I = [
    [[0, 0, 0, 0],
     [1, 1, 1, 1],
     [0, 0, 0, 0],
     [0, 0, 0, 0]],

    [[0, 1, 0, 0],
     [0, 1, 0, 0],
     [0, 1, 0, 0],
     [0, 1, 0, 0]]
];

const J = [
    [[1, 0, 0],
     [1, 1, 1],
     [0, 0, 0]],

    [[0, 1, 1],
     [0, 1, 0],
     [0, 1, 0]],

    [[0, 0, 0],
     [1, 1, 1],
     [0, 0, 1]],

    [[0, 1, 0],
     [0, 1, 0],
     [1, 1, 0]]
];
// --- Tetromino Definitions End ---

// Existing script content (if any)
console.log("Tydal Consulting site loaded.");