// The rules are separate from the drawing so we can test them without a browser.
class SnakeGame {
  constructor({ columns = 20, rows = 20, random = Math.random } = {}) {
    this.columns = columns;
    this.rows = rows;
    this.random = random;
    this.reset();
  }

  reset() {
    const x = Math.floor(this.columns / 2);
    const y = Math.floor(this.rows / 2);
    this.snake = [{ x, y }, { x: x - 1, y }, { x: x - 2, y }];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.turnQueued = false;
    this.score = 0;
    this.lives = 3;
    this.protectedUntil = 0;
    this.status = "ready";
    this.endReason = "";
    this.apple = this.spawnApple();
  }

  start() {
    this.reset();
    this.status = "running";
  }

  isInside(cell) {
    return cell.x >= 0 && cell.x < this.columns && cell.y >= 0 && cell.y < this.rows;
  }

  spawnApple() {
    const emptyCells = [];
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.columns; x += 1) {
        const occupied = this.snake.some(segment => segment.x === x && segment.y === y);
        if (!occupied) emptyCells.push({ x, y });
      }
    }
    // A full board means the player has won; there is nowhere to put more food.
    if (emptyCells.length === 0) return null;
    return emptyCells[Math.floor(this.random() * emptyCells.length)];
  }

  setDirection(x, y) {
    if (Math.abs(x) + Math.abs(y) !== 1) return false;
    if (this.status !== "running" && this.status !== "frozen") return false;
    if (this.turnQueued) return false;

    // A turn must be perpendicular: no immediate reverse into the snake's neck.
    if (x === this.direction.x && y === this.direction.y) return false;
    if (x === -this.direction.x && y === -this.direction.y) return false;

    if (this.status === "frozen") {
      const head = this.snake[0];
      if (!this.isInside({ x: head.x + x, y: head.y + y })) return false;
      this.status = "running";
    }
    this.nextDirection = { x, y };
    // Accept just one turn per movement tick, including rapid key presses.
    this.turnQueued = true;
    return true;
  }

  togglePause() {
    if (this.status === "paused") {
      this.status = this.statusBeforePause;
    } else if (this.status === "running" || this.status === "frozen") {
      this.statusBeforePause = this.status;
      this.status = "paused";
    }
  }

  tick(now = Date.now()) {
    if (this.status !== "running") return;
    this.direction = this.nextDirection;
    this.turnQueued = false;
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };

    if (!this.isInside(head)) {
      // Keep the head on the board. Waiting at a wall never drains more hearts.
      if (now >= this.protectedUntil) {
        this.lives -= 1;
        this.protectedUntil = now + 3000;
      }
      this.status = this.lives === 0 ? "gameover" : "frozen";
      if (this.lives === 0) this.endReason = "You ran out of hearts.";
      return;
    }

    const eating = this.apple && head.x === this.apple.x && head.y === this.apple.y;
    // The last tail cell moves away this tick unless the snake is growing.
    const body = eating ? this.snake : this.snake.slice(0, -1);
    if (body.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.lives = 0;
      this.status = "gameover";
      this.endReason = "You touched your own body.";
      return;
    }

    this.snake.unshift(head);
    if (eating) {
      this.score += 1;
      this.apple = this.spawnApple();
      if (!this.apple) this.status = "won";
    } else {
      this.snake.pop();
    }
  }
}

// Node uses this export for automated rule tests. The browser uses the class above.
if (typeof module !== "undefined" && module.exports) module.exports = { SnakeGame };
