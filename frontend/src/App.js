import React, { Component } from 'react';
import './App.css';
import { auth, provider, db } from './firebase.js';
import firebase from 'firebase';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      profile: null
    };

    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getProfile = this.getProfile.bind(this);
    this.createProfile = this.createProfile.bind(this);
  }

  logout() {
    auth.signOut()
    .then(() => {
      this.setState({
        user: null
      });
    });
  }

  login() {
    auth.signInWithPopup(provider) 
      .then((result) => {
        const user = result.user;
        this.setState({
          user
        });
        this.getProfile(user.uid)
      }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;
        // ...
      });
  }

  getProfile() {
    var user = firebase.auth().currentUser;
    var userRef = db.collection("users").doc(user.email);

    userRef.get().then((doc) => {
      if (doc.exists) {
        this.setState({
          profile: doc.data()
        });
      } else {
        this.createProfile();
        console.log("No such document!");
      }
    }).catch(function(error) {
        console.log("Error getting document:", error);
    });
  }

 createProfile() {
    var user = firebase.auth().currentUser;
    var usersRef = db.collection("users");

    usersRef.doc(user.email).add({
      email: user.email,
      name: user.displayName
    })
    .then(function(docRef) {
      console.log("Profile created with ID: ", docRef.id);
    })
    .catch(function(error) {
      console.error("Error creating profile: ", error);
    });
  }

  componentDidMount() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user });
        this.getProfile();
      }
    });
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <h1>STRUT™</h1>
          {this.state.user ?
            <button onClick={this.logout}>Log Out</button>                
            :
            <button onClick={this.login}>Log In</button>              
          }
        </div>
        {this.state.user && this.state.profile ?
          <div>
            hi {this.state.user.displayName}
            <div className='user-profile'>
              <img src={this.state.user.photoURL} />
            </div>
            <label>email</label>
            <input type="text" defaultValue={this.state.profile.email} />
            
            <label>bio</label>
            <input type="text" defaultValue={this.state.profile.bio} />

            <h6>Songs</h6>

            {this.state.profile.songs &&
              this.state.profile.songs.map((song, index) =>
              <div key={index}>
                Song {index + 1}:
                <div>Start: {song.options.start}</div>
                <div>Duration: {song.options.duration}</div>
                <div>ID: {song.options.video_id}</div>
              </div>
            )
          }
          </div>
          :
          <div className='wrapper'>
            <p>Please sign in to continue.</p>
          </div>
        }
      </div>
    );
  }
}

export default App;
