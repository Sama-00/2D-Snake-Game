const test = require("node:test");
const assert = require("node:assert/strict");
const { SnakeGame } = require("./game.js");

function playing() {
  const game = new SnakeGame({ random: () => 0 });
  game.start();
  return game;
}

test("Start and restart restore the score, three hearts, length, and movement", () => {
  const game = playing();
  game.score = 9;
  game.lives = 0;
  game.status = "gameover";
  game.protectedUntil = 999999;
  game.start();
  assert.equal(game.score, 0);
  assert.equal(game.lives, 3);
  assert.equal(game.snake.length, 3);
  assert.equal(game.protectedUntil, 0);
  assert.equal(game.status, "running");
  assert.deepEqual(game.direction, { x: 1, y: 0 });
  assert.ok(game.apple);
});

test("MO-1: automatic movement and four arrow directions", () => {
  const game = playing();
  game.tick(1000);
  assert.deepEqual(game.snake[0], { x: 11, y: 10 });
  for (const [x, y, expected] of [[0, -1, { x: 11, y: 9 }], [-1, 0, { x: 10, y: 9 }], [0, 1, { x: 10, y: 10 }], [1, 0, { x: 11, y: 10 }]]) {
    assert.equal(game.setDirection(x, y), true);
    game.tick(1200);
    assert.deepEqual(game.snake[0], expected);
  }
});

test("MO-2: apples spawn inside the board and never on the snake", () => {
  const game = playing();
  for (let i = 0; i < 100; i += 1) {
    game.random = () => i / 100;
    const apple = game.spawnApple();
    assert.ok(game.isInside(apple));
    assert.ok(!game.snake.some(cell => cell.x === apple.x && cell.y === apple.y));
  }
});

test("MO-3: an apple adds exactly one point and one segment", () => {
  const game = playing();
  game.apple = { x: 11, y: 10 };
  game.tick(1000);
  assert.equal(game.score, 1);
  assert.equal(game.snake.length, 4);
  assert.notDeepEqual(game.apple, { x: 11, y: 10 });
  game.tick(1140);
  assert.equal(game.score, 1);
  assert.equal(game.snake.length, 4);
});

test("MO-4: body collision immediately ends the game despite wall protection", () => {
  const game = playing();
  game.snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }, { x: 6, y: 4 }];
  game.protectedUntil = 5000;
  game.tick(1000);
  assert.equal(game.status, "gameover");
  assert.equal(game.lives, 0);
  const before = JSON.stringify(game.snake);
  game.tick(2000);
  assert.equal(JSON.stringify(game.snake), before);
});

test("Moving into the vacated tail cell is legal", () => {
  const game = playing();
  game.snake = [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 6, y: 5 }];
  game.tick(1000);
  assert.equal(game.status, "running");
  assert.deepEqual(game.snake[0], { x: 6, y: 5 });
});

test("S-1: a wall hit loses one heart and freezes without repeated damage", () => {
  const game = playing();
  game.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }];
  game.tick(1000);
  assert.equal(game.lives, 2);
  assert.equal(game.status, "frozen");
  assert.equal(game.protectedUntil, 4000);
  assert.deepEqual(game.snake[0], { x: 19, y: 10 });
  game.tick(9999);
  assert.equal(game.lives, 2);
  assert.equal(game.setDirection(1, 0), false);
  assert.equal(game.setDirection(-1, 0), false);
  assert.equal(game.setDirection(0, -1), true);
  game.tick(10100);
  assert.equal(game.status, "running");
  assert.deepEqual(game.snake[0], { x: 19, y: 9 });
});

test("Protection blocks further wall damage for exactly three seconds", () => {
  const game = playing();
  game.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }];
  game.tick(1000);
  game.setDirection(0, -1);
  game.tick(1140);
  game.setDirection(1, 0);
  game.tick(1280);
  assert.equal(game.status, "frozen");
  assert.equal(game.lives, 2);
  assert.equal(game.protectedUntil, 4000);
  game.setDirection(0, -1);
  game.tick(3860);
  game.setDirection(1, 0);
  game.tick(4000);
  assert.equal(game.lives, 1);
});

test("Losing the last heart ends the game", () => {
  const game = playing();
  game.snake = [{ x: 19, y: 10 }, { x: 18, y: 10 }, { x: 17, y: 10 }];
  game.lives = 1;
  game.tick(1000);
  assert.equal(game.status, "gameover");
  assert.equal(game.lives, 0);
});

test("Rapid inputs cannot produce a reverse before the next movement tick", () => {
  const game = playing();
  assert.equal(game.setDirection(-1, 0), false);
  assert.equal(game.setDirection(0, -1), true);
  assert.equal(game.setDirection(-1, 0), false);
  game.tick(1000);
  assert.deepEqual(game.snake[0], { x: 10, y: 9 });
  assert.equal(game.setDirection(-1, 0), true);
});

test("A corner only permits a perpendicular turn back onto the board", () => {
  const game = playing();
  game.snake = [{ x: 19, y: 0 }, { x: 18, y: 0 }, { x: 17, y: 0 }];
  game.tick(1000);
  assert.equal(game.setDirection(0, -1), false);
  assert.equal(game.status, "frozen");
  assert.equal(game.setDirection(0, 1), true);
  game.tick(1140);
  assert.deepEqual(game.snake[0], { x: 19, y: 1 });
});

test("Pause stops movement and resumes the previous state", () => {
  const game = playing();
  const head = { ...game.snake[0] };
  game.togglePause();
  game.tick(1000);
  assert.deepEqual(game.snake[0], head);
  assert.equal(game.setDirection(0, -1), false);
  game.togglePause();
  game.tick(1140);
  assert.notDeepEqual(game.snake[0], head);
  game.status = "frozen";
  game.togglePause();
  game.togglePause();
  assert.equal(game.status, "frozen");
});

test("A completely filled board wins without an infinite apple-spawn loop", () => {
  const game = new SnakeGame({ columns: 4, rows: 2, random: () => 0 });
  game.start();
  game.snake = [{ x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }];
  game.apple = { x: 3, y: 0 };
  game.tick(1000);
  assert.equal(game.status, "won");
  assert.equal(game.apple, null);
  assert.equal(game.score, 1);
  assert.equal(game.snake.length, 8);
});
