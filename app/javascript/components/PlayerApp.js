import React from "react";
import firebase from './firebase';

class PlayerApp extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.db = firebase.firestore();

    const self = this;
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        console.log('user signed in');
        self.state.user = user;
      } else {
        console.error('user is not signed in.');
      }
    });

    firebase.auth().signInAnonymously().catch(function(error) {
      console.error('firebase auth error', error);
    });
  }

  /**
   * fetch a collection of games which can be joined
   *
   * @return Promise
   */
  listAvailableGames() {
    return this.db
             .collection('games')
             .where('current_stage', '==', 'joining')
             .get();
  }

  joinGame(gameId) {
    // TODO: some kind of wait/guard in case auth hasn't completed yet?
    return this.db
             .collection('games')
             .doc(gameId)
             .collection('players')
             .doc(this.state.user.uid)
             .set({is_active: true});
  }

  render() {
    this.listAvailableGames().then(snapshot => {
      const games = [];

      snapshot.forEach(doc => {
        console.log(`found open game: ${doc.data().title}`);
        games.push(doc.data().title);
      });

      if (games.length > 0) {
        console.log('joining first available game');
          this.joinGame(games[0]).then(
          (response) => {
            console.log('successfully joined game', games[0], response)
          },
          (failure) => {
            console.error('error joining game', games[0], failure)
          }
        );
      }
    });

    return(
      <div>Hello</div>
    )
  }
}

export default PlayerApp;
