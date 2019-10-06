import firebase from 'firebase/app';
import "firebase/auth";
import "firebase/firestore";

const settings = {};
const config = {
  "apiKey": "AIzaSyCkAeXDokAKJ6RHRe1KTQUW05TLN3GPb5k",
  "authDomain": "bad-ideas.firebaseapp.com",
  "databaseURL": "https://bad-ideas.firebaseio.com",
  "projectId": "bad-ideas",
  "storageBucket": "bad-ideas.appspot.com",
  "messagingSenderId": "583188637319",
  "appId": "1:583188637319:web:1eff7887fea2e384d43a22"
};

firebase.initializeApp(config);

firebase.firestore().settings(settings);

export default firebase;
