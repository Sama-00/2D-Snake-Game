// Connect the buttons, keyboard, and canvas to the game rules.
const board = document.getElementById("board");
const pen = board.getContext("2d");
const cellSize = 20;
const game = new SnakeGame();
const startButton = document.getElementById("start");
const pauseButton = document.getElementById("pause");
const scoreLabel = document.getElementById("score");
const livesLabel = document.getElementById("lives");
const bestLabel = document.getElementById("best");
const message = document.getElementById("message");
let bestScore = 0;

// The game still works if the browser blocks saving local data.
try {
  const saved = Number(localStorage.getItem("snake-best-score"));
  if (Number.isFinite(saved) && saved >= 0) bestScore = Math.floor(saved);
} catch (error) {
  console.info("High score will only be kept for this visit.");
}

function updateDisplay() {
  if (game.score > bestScore) {
    bestScore = game.score;
    try {
      localStorage.setItem("snake-best-score", String(bestScore));
    } catch (error) {
      // Saving a best score is optional; it must not interrupt play.
    }
  }
  scoreLabel.textContent = game.score;
  bestLabel.textContent = bestScore;
  livesLabel.textContent = "♥".repeat(game.lives) + "♡".repeat(3 - game.lives);
  livesLabel.setAttribute("aria-label", `${game.lives} of 3 hearts remaining`);
  const finished = game.status === "gameover" || game.status === "won";
  startButton.textContent = game.status === "ready" ? "Start Game" : "Restart Game";
  startButton.disabled = !finished && game.status !== "ready";
  pauseButton.disabled = finished || game.status === "ready";
  pauseButton.textContent = game.status === "paused" ? "Resume" : "Pause";

  let text = "Press Start Game, then use the arrow keys.";
  if (game.status === "running") text = "Collect apples. Avoid your body and the walls.";
  if (game.status === "frozen") text = "At the wall: turn 90° toward an open square to continue.";
  if (game.status === "paused") text = "Paused. Press Resume or Space to continue.";
  if (game.status === "gameover") text = `Game Over. ${game.endReason} Final score: ${game.score}.`;
  if (game.status === "won") text = `You filled the board! Final score: ${game.score}.`;
  if (message.textContent !== text) message.textContent = text;
}

function draw() {
  pen.clearRect(0, 0, board.width, board.height);
  pen.fillStyle = "#fafff0";
  pen.fillRect(0, 0, board.width, board.height);
  pen.strokeStyle = "#dbe4cd";
  for (let position = cellSize; position < board.width; position += cellSize) {
    pen.beginPath();
    pen.moveTo(position, 0);
    pen.lineTo(position, board.height);
    pen.moveTo(0, position);
    pen.lineTo(board.width, position);
    pen.stroke();
  }

  if (game.apple) {
    pen.fillStyle = "#be3536";
    pen.beginPath();
    pen.arc(game.apple.x * cellSize + 10, game.apple.y * cellSize + 11, 7, 0, Math.PI * 2);
    pen.fill();
    pen.fillStyle = "#355a29";
    pen.fillRect(game.apple.x * cellSize + 10, game.apple.y * cellSize + 2, 3, 5);
  }

  const now = Date.now();
  const flickering = now < game.protectedUntil && game.status !== "gameover";
  pen.globalAlpha = flickering && Math.floor(now / 120) % 2 === 0 ? 0.4 : 1;
  game.snake.forEach((segment, index) => {
    pen.fillStyle = index === 0 ? "#263b20" : "#628a39";
    pen.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
  });
  pen.globalAlpha = 1;

  if (["ready", "paused", "gameover", "won"].includes(game.status)) {
    pen.fillStyle = "rgba(250, 255, 240, 0.85)";
    pen.fillRect(0, board.height / 2 - 43, board.width, 86);
    pen.fillStyle = "#263b20";
    pen.textAlign = "center";
    pen.font = "bold 26px Arial";
    const titles = { ready: "Ready to play?", paused: "Paused", gameover: "Game Over", won: "You won!" };
    pen.fillText(titles[game.status], board.width / 2, board.height / 2);
    pen.font = "15px Arial";
    const hint = game.status === "ready" ? "Press Start Game below" : game.status === "paused" ? "Press Resume or Space" : `Score: ${game.score}  ·  Best: ${bestScore}`;
    pen.fillText(hint, board.width / 2, board.height / 2 + 26);
  }
  requestAnimationFrame(draw);
}

startButton.addEventListener("click", () => {
  game.start();
  updateDisplay();
  board.focus();
});

pauseButton.addEventListener("click", () => {
  game.togglePause();
  updateDisplay();
  board.focus();
});

const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
document.addEventListener("keydown", event => {
  if (directions[event.key]) {
    event.preventDefault();
    game.setDirection(...directions[event.key]);
    updateDisplay();
  } else if (event.code === "Space" && event.target.tagName !== "BUTTON") {
    event.preventDefault();
    if (!event.repeat) game.togglePause();
    updateDisplay();
  }
});

// Automatically pause if the player switches to another tab or window.
function pauseWhenAway() {
  if (game.status === "running" || game.status === "frozen") {
    game.togglePause();
    updateDisplay();
  }
}
window.addEventListener("blur", pauseWhenAway);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pauseWhenAway();
});

// One fixed movement tick makes the game independent of drawing speed.
setInterval(() => {
  game.tick();
  updateDisplay();
}, 140);
updateDisplay();
draw();
