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
      admin.collection('games').doc('joinable_game').set({is_joinable: true})
      admin.collection('games').doc('unjoinable_game').set({is_joinable: false})
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

  it('does not allow players to modify other players', async() => {
    const admin = adminApp();
    const game = admin.collection('games').doc('game')
    game.set({is_joinable: true});
    game.collection('players').doc('alice').set({is_active: true});
    game.collection('players').doc('bob').set({is_active: true});

    const db = authedApp({uid: 'alice'});
    bob = db.collection('games').doc('game').collection('players').doc('bob')
    await firebase.assertFails(bob.set({is_active: false}));
  })

  describe("providing an answer", () => {
    it('requires player to be active in the game')
    it('requires an answer which is valid for the question')
    it('requires the question to be current for the game')
  });

  describe("reading game state", () => {
    it('allows inactive users to read current game data')
  })
});
