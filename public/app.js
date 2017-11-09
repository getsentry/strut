window.onload = function() {

var body = document.body;
var $ = document.getElementById.bind(document);

var Strut = window.Strut;
var auth = Strut.firebase.auth;
var provider = Strut.firebase.provider;
var db = Strut.firebase.db;

var UserProfile = null;

var avatarImage = $('img-avatar');
var inputEmail = $('input-email');
var inputBio = $('input-bio');
var songList = $('song-list');
var songTemplate = $('song-template');

auth.onAuthStateChanged(function(user) {
  if (user) {
    body.className = 'logged-in';
    getProfile();
  } else {
    body.className = 'logged-out';
  }
});

$('btn-logout').addEventListener('click', logout);
$('btn-login').addEventListener('click', login);

function logout() {
  auth.signOut().then(function() {
    UserProfile = null;
    inputEmail.value = '';
    inputBio.value = '';
  });
}

function login() {
  auth.signInWithPopup(provider).then(function(result) {
    var user = result.user;
    console.log('logged in', user);
    getProfile();
  }).catch(function(error) {
    alert(error);
  });
}

function getProfile() {
  var user = auth.currentUser;
  var userDoc = db.collection('users').doc(user.email);

  avatarImage.src = user.photoURL;

  userDoc.get().then(function(doc) {
    if (doc.exists) {
      UserProfile = doc.data();
      renderProfile();
    } else {
      createProfile();
    }
  }).catch(function(error) {
    alert(error);
  });
}

function createProfile() {
  var user = auth.currentUser;
  db.collection('users').doc(user.email).add({
    email: user.email,
    name: user.displayName
  });
}

function renderProfile() {
  clearSongs();

  if (!UserProfile) {
    inputEmail.value = '';
    inputBio.value = '';
    return;
  }

  inputEmail.value = UserProfile.email;
  inputBio.value = UserProfile.bio;

  for (var i=0; i<UserProfile.songs.length; i++) {
    addSong(UserProfile.songs[i]);
  }
}

function clearSongs() {
  //
}

function addSong(song) {
  var div = document.importNode(songTemplate.content, true);
  div.querySelector('.song-thumb img').src = 'https://img.youtube.com/vi/' + song.options.video_id + '/0.jpg';
  div.querySelector('.song-desc h6').textContent = song.options.video_id;
  div.querySelector('.song-desc div').textContent = 'Starts at ' + song.options.start + 's & plays for ' + song.options.duration + 's';
  songList.appendChild(div);
}

};
