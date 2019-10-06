const firebase = require("@firebase/testing");
const fs = require("fs");

/*
 * ============
 *    Setup
 * ============
 */
const projectId = "firestore-emulator-example";
const firebasePort = require("./firebase.json").emulators.firestore.port;
const port = firebasePort /** Exists? */ ? firebasePort : 8080;
const coverageUrl = `http://localhost:${port}/emulator/v1/projects/${projectId}:ruleCoverage.html`;

const rules = fs.readFileSync("firestore.rules", "utf8");

/**
 * Creates a new app with authentication data matching the input.
 *
 * @param {object} auth the object to use for authentication (typically {uid: some-uid})
 * @return {object} the app.
 */
function authedApp(auth) {
  return firebase.initializeTestApp({ projectId, auth }).firestore();
}

function adminApp() {
  return firebase.initializeAdminApp({ projectId }).firestore();
}

/*
 * ============
 *  Test Cases
 * ============
 */
beforeEach(async () => {
  // Clear the database between tests
  await firebase.clearFirestoreData({ projectId });
});

before(async () => {
  await firebase.loadFirestoreRules({ projectId, rules });
});

after(async () => {
  await Promise.all(firebase.apps().map(app => app.delete()));
  console.log(`View rule coverage information at ${coverageUrl}\n`);
});

describe("worst idea", () => {
  it('does not allow unauthenticate user to read', async () => {
    const db = authedApp(null);
    const games = db.collection('games');
    await firebase.assertFails(games.get());
  });

  describe("joining a game", () => {
    beforeEach(async () => {
      const admin = adminApp();
      await admin.collection('games').doc('joinable_game').set({is_joinable: true})
      // admin.collection('games').doc('joinable_game').collection('players')
      await admin.collection('games').doc('unjoinable_game').set({is_joinable: false})
    });

    it("allows users to join a joinable game", async () => {
      const db = authedApp({uid: 'alice'});
      const game = db.collection('games').doc('joinable_game');
      await firebase.assertSucceeds(game.collection('players').doc('alice').set({is_active: true}));
    });

    it("does not allow users to join a non-joinable game", async () => {
      const db = authedApp({uid: 'alice'});
      const game = db.collection('games').doc('unjoinable_game');
      await firebase.assertFails(game.collection('players').doc('alice').set({is_active: true}));
    });
  });

  it('does not allow players to modify other players', async () => {
    const admin = adminApp();
    const game = admin.collection('games').doc('game')
    await game.set({is_joinable: true});
    await game.collection('players').doc('alice').set({is_active: true});
    await game.collection('players').doc('bob').set({is_active: true});

    const db = authedApp({uid: 'alice'});
    bob = db.collection('games').doc('game').collection('players').doc('bob')
    await firebase.assertFails(bob.set({is_active: false}));
  })

  describe("providing an answer", () => {
    beforeEach(async () => {
      const admin = adminApp();
      const game = admin.collection('games').doc('game')
      await game.set({
        is_joinable: false,
        active_question_id: '2'
      });

      const players = game.collection('players');
      await players.doc('alice').set({is_active: true});
      await players.doc('bob').set({is_active: false});

      // game.collection('player_answers').doc('2').set({placeholder: true});

      const questions = game.collection('questions');
      // not the current question. (see game's active_question_id)
      await questions.doc('1').set({
        answers: {
          0: "a",
          1: "b",
          2: "c"
        },
        question: "what is the best number?",
        sequence: 1,
        summary: {}
      });
      // the current question. (see game's active_question_id)
      await questions.doc('2').set({
        answers: {
          0: "zero",
          1: "one",
          2: "two"
        },
        question: "what is the worst number?",
        sequence: 2,
        summary: {}
      });
    });

    it('requires player to be active in the game', async () => {
      const alice = authedApp({uid: 'alice'});
      const bob = authedApp({uid: 'bob'});

      // alice is active so she can provide an answer to the current question.
      await firebase.assertSucceeds(
        // alice selects answer 1 for question 2. set({2: 1})
        alice.collection('games').doc('game').collection('player_answers').doc('alice').collection('answers').doc('2').set({'a': 1})
      );
      // bob is inactive so he cannot.
      await firebase.assertFails(
        bob.collection('games').doc('game').collection('player_answers').doc('bob').collection('answers').doc('2').set({'a': 1})
      );
    });

    it('requires an answer which is valid for the question', async () => {
      const alice = authedApp({uid: 'alice'});

      // question 2 has answers 0-2.
      await firebase.assertSucceeds(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').collection('answers').doc('2').set({'a': 1})
      );
      // can't add an answer that's out of range
      await firebase.assertFails(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').collection('answers').doc('2').set({'a': 5})
      );
    });

    it('requires the question to be current for the game', async () => {
      const alice = authedApp({uid: 'alice'});
      const bob = authedApp({uid: 'bob'});

      // question 2 is current.
      await firebase.assertSucceeds(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').collection('answers').doc('2').set({'a': 1})
      );
      // cant answer question 1. it's not current.
      await firebase.assertFails(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').collection('answers').doc('1').set({'a': 1})
      );
    })
  });

  describe("reading game state", () => {
    it('allows inactive users to read current game data')
  })
});
