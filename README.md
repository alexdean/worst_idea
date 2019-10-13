# Worst Idea

An interactive game for live groups.

  1. Admins set a list of questions/issues, each with multiple answers/solutions.
     All of them should be silly.
  1. One person is chosen as the Emperor of Bad Ideas.
  1. First question is presented to players for a fixed amount of time. ~30 seconds.
  1. Each player chooses which answer they want. Players are free to change their
     answer. While voting is open, players see real-time statistics about how
     many votes each answer is getting.
  1. When voting closes, players who made the same choice as the Emperor are
     eliminated from play. They may continue to observe future rounds of voting,
     but cannot participate.
  1. Play stops when only 1 person remains, or when questions run out, or when
     it's not fun anymore.

## Architecture

  * Data stored in [Google Cloud Firestore](https://firebase.google.com/docs/firestore).
  * Admin & player apps implemented in JavaScript.
  * Some backend processes implemented in ruby. Example: Building summaries of
    answer counts during voting.

## Game Flow

This is an outline of the stages of the game, and what should happen in each of them.

Once a game is created `bin/admin next -g <game-name>` will progress the game
to the next stage.

### To create a game

`bin/admin init` to generate a new game
`bin/admin init --production` to reset the state of the `current` game.

this will destroy any existing data in the named game.

the generated game will be in the `joining` stage once is it created.

### 1. joining

Players can join the game (by adding themselves to the `players` collection).

### 2. preparing

  * Players can no longer join the game.
  * Short codes are generated for each player.

An emperor can be selected using `bin/admin crown`.

### 3. question-open

  * Players can select an answer to the displayed question.
  * The `game.summary` property will live-update with a summary of how many players
    have selected each answer.
  * The `game.questions(id).summary` property will live-update with the same data.

### 4. question-closed

  * Players can no longer select an answer or change their answer.
  * An emperor must be selected before moving past this stage.

`bin/admin eliminate` should be used here to eliminate players based on their answers.

### 5. question-results

  * The live screen should now show some summary of how many players were eliminated
    and how many remain.
  * `bin/admin crown` should be used to select a new Emperor if desired.

`bin/admin next` will move the game either to the next `question-open`, or to `finished`
if this was the last question.

### 6. finished

The game is over.

## Develoment

To build & test security rules:

Follow the [setup guide](https://github.com/firebase/quickstart-nodejs/tree/master/firestore-emulator/javascript-quickstart).

  1. `nvm use`
  1. `cd config/firestore_rules`
  1. edit `firestore.rules` and `test.js`
  1. `npx firebase emulators:start --only firestore`
  1. in a separate window: `npm test`
  1. when everything passes, copy/paste rules to Firestore web UI.

https://firebase.google.com/docs/firestore/security/test-rules-emulator
