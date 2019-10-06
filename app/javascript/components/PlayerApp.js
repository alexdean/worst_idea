import React from "react";
import firebase from './firebase';

class PlayerApp extends React.Component {
  render() {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        console.log('user signed in', user)
      } else {
        console.error('user is not signed in.')
      }
    });

    firebase.auth().signInAnonymously().catch(function(error) {
      console.error('firebase auth error', error);
    });

    // example of querying for data.
    // this fetches a list of available games.
    firebase.firestore().collection('games').where('current_stage', '==', 'joining').get().then(snapshot => {
      snapshot.forEach(doc => {
        console.log(`found open game: ${doc.data().title}`);
      });
    })

    return(
      <div>Hello</div>
    )
  }
}

export default PlayerApp;
