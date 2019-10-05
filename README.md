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
