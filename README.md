# 2D Snake Game

Open **index.html** in a desktop browser. Keep **game.js** and **app.js** in the same folder. No package installation or web server is needed to play.

## Controls

- Start Game starts a new round. Arrow keys steer the snake.
- Each apple adds 1 point and 1 body segment.
- A wall hit costs 1 of 3 hearts and freezes the snake. Turn 90 degrees back onto the board to continue.
- Losing a heart gives 3 seconds of protection from further wall damage. The snake flickers during that time.
- Touching the body ends the game immediately, even during wall protection.
- Space or the Pause button pauses and resumes. Changing tabs automatically pauses.
- Restart Game is available after Game Over. Score and hearts reset; the best score stays.

## Understand the files

- **index.html**: the page, colours, board, instructions, and buttons.
- **game.js**: the snake's position and the rules. `tick()` advances one step. `setDirection()` checks a turn. `spawnApple()` finds an empty cell. `start()` resets a round.
- **app.js**: keyboard and button events, drawing, scoreboard, and a 140 ms movement timer.
- **game.test.js**: repeatable tests of the game rules using Node's built-in test runner.

The snake is an array of grid positions. Movement adds a new head and removes the tail. Eating keeps the tail, so the snake grows by one segment. Wall collision is checked before changing the head position, which keeps the snake inside the board.

## Technical checks on 25 September 2026

Run the rule tests with `node --test game.test.js` if Node.js is installed. Node is only needed for tests, not for playing.

The assistant ran 13 tests and all 13 passed:

1. Start/restart resets score, hearts, length, direction, and protection.
2. Automatic movement and all four directions (Mo-1).
3. Apple placement stays inside the board and outside the snake (Mo-2).
4. One apple adds exactly one point and one segment (Mo-3).
5. Body collision immediately ends play, including during wall protection (Mo-4).
6. Moving into the tail's old cell is allowed when that tail moves away.
7. A wall hit removes one heart, freezes, and resumes after a valid turn (S-1).
8. Wall protection expires after three seconds.
9. Losing the final heart ends play.
10. Fast key presses cannot reverse the snake into its neck.
11. Corner recovery only accepts a turn back inside the board.
12. Pause stops movement and resumes the previous state.
13. Filling the board ends with a win instead of an endless apple search.

Browser checks also confirmed Start, visible hearts, wall freeze, turning away, Game Over, restart, and pause/resume controls. These are technical checks by the assistant, not two end-user playtests. The automated tests do not measure whether users understand or enjoy the game.

## Design and scope

The implementation follows the three-heart wall-freeze flowchart, including three-second protection, immediate body-collision Game Over, score, and restart. The high score uses this browser's local storage; there is no online database.

Small additions: pause/resume, automatic pause when changing tabs, and a full-board win state. The code is split into rules and browser display so the rules can be tested. Increasing speed and a difficulty selector are not implemented in this version.

## Remaining portfolio work

Ask two real people to play. For each tester record:

- Date, tester identifier, and version tested.
- Task: start, collect an apple, hit a wall and recover, lose, and restart.
- What they expected and what actually happened.
- Their feedback, any change made, and the retest result.

Do not mark these sessions complete until they actually happen. Keep screenshots of the running game, Game Over, and any problem you reproduce and fix.

## AI assistance

The starting version contained the page, instructions, and grid. The gameplay, file separation, and automated tests in this revision were added with Codex assistance. The student should review and understand the code, record their own changes and testing, and explain the assistance accurately in the portfolio.
