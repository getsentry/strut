import firebase from 'firebase';
require('firebase/firestore');

const config = {
  apiKey: "AIzaSyDf5-S1K49RliRODMJa6glqgEfQoKOjbe0",
  authDomain: "sentry-strut.firebaseapp.com",
  databaseURL: "https://sentry-strut.firebaseio.com",
  projectId: "sentry-strut",
  storageBucket: "sentry-strut.appspot.com",
  messagingSenderId: "241763696783"
};

firebase.initializeApp(config);

export var db = firebase.firestore();

export const provider = new firebase.auth.GoogleAuthProvider();
export const auth = firebase.auth();

export default firebase;
