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
  it('allows unauthenticated user to read', async () => {
    const db = authedApp(null);
    const games = db.collection('games');
    await firebase.assertSucceeds(games.get());
  });

  it('allows users to list open games', async () => {
    const admin = adminApp();
    await admin.collection('games').doc('game1').set({current_stage: 'joining'});
    await admin.collection('games').doc('game2').set({current_stage: 'in-progress'});

    // TODO: assert on returned data. get() will succeed even if we don't get anything.
    const db = authedApp({uid: 'alice'});
    await firebase.assertSucceeds(db.collection('games').where('current_stage', '==', 'joining').get());
  });

  describe("joining a game", () => {
    beforeEach(async () => {
      const admin = adminApp();
      await admin.collection('games').doc('joinable_game').set({current_stage: 'joining'})
      await admin.collection('games').doc('unjoinable_game').set({current_stage: 'preparing'})
    });

    it("allows users to join a joinable game", async () => {
      const db = authedApp({uid: 'alice'});
      const game = db.collection('games').doc('joinable_game');
      await firebase.assertSucceeds(game.collection('players').doc('alice').set({is_active: true}));
    });

    it("does not allow users to modify their user record during non-joining stages", async () => {
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
        current_stage: 'question-open',
        active_question_id: '3',
        active_question_max_answer_id: 2,
      });

      const players = game.collection('players');
      await players.doc('alice').set({is_active: true});
      await players.doc('bob').set({is_active: false});
    });

    it('requires player to be active in the game', async () => {
      const alice = authedApp({uid: 'alice'});
      const bob = authedApp({uid: 'bob'});

      // alice is active so she can provide an answer to the current question.
      await firebase.assertSucceeds(
        // alice selects answer 1 for question 2. set({2: 1})
        // maybe could be simpler if we used doc('alice').set({question_id: answer_id})
        // and https://firebase.google.com/docs/reference/rules/rules.Map.html
        alice.collection('games').doc('game').collection('player_answers').doc('alice').set({'answer_id': 1})
      );
      // bob is inactive so he cannot.
      await firebase.assertFails(
        bob.collection('games').doc('game').collection('player_answers').doc('bob').set({'answer_id': 1})
      );
    });

    it('requires an answer which is valid for the question', async () => {
      const alice = authedApp({uid: 'alice'});

      // question 2 has answers 0-2.
      await firebase.assertSucceeds(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').set({'answer_id': 2})
      );
      // can't add an answer that's out of range
      await firebase.assertFails(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').set({'answer_id': 5})
      );
      await firebase.assertFails(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').set({'answer_id': -1})
      );
    });

    it('requires an integer answer', async () => {
      const alice = authedApp({uid: 'alice'});

      await firebase.assertFails(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').set({'answer_id': 'NaN'})
      );
    });

    it('does not allow users to set answers unless game is in-progress', async () => {
      const admin = adminApp();
      const game = admin.collection('games').doc('game')
      await game.set({
        current_stage: 'finished',
        // these should be null when game is finished. leaving values to ensure test fails due to current_stage
        // condition not being met.
        active_question_id: 3,
        active_question_max_answer_id: 3,
      });

      const players = game.collection('players');
      await players.doc('alice').set({is_active: true});

      const alice = authedApp({uid: 'alice'});
      await firebase.assertFails(
        alice.collection('games').doc('game').collection('player_answers').doc('alice').set({'answer_id': 1})
      );
    })
  });

  describe("reading game state", () => {
    it('allows inactive users to read current game data')
  })
});
