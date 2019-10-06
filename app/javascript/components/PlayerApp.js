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

    return(
      <div>Hello</div>
    )
  }
}

export default PlayerApp;
