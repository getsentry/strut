window.Strut.firebase = (function(){

firebase.initializeApp({
  apiKey: 'AIzaSyDf5-S1K49RliRODMJa6glqgEfQoKOjbe0',
  authDomain: 'sentry-strut.firebaseapp.com',
  databaseURL: 'https://sentry-strut.firebaseio.com',
  projectId: 'sentry-strut',
  storageBucket: 'sentry-strut.appspot.com',
  messagingSenderId: '241763696783'
});

return {
  db: firebase.firestore(),
  provider: new firebase.auth.GoogleAuthProvider(),
  auth: firebase.auth()
};


})();
