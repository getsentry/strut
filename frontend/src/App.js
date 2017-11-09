import React, { Component } from 'react';
import './App.css';
import Logo from './logo.svg';
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
          <img className="App-logo" src={Logo} />
          <div className="pull-right">
          {this.state.user ?
            <div class="User-nav">
              <img src={this.state.user.photoURL} />
              <button class="btn" onClick={this.logout}>Log Out</button>     
            </div>
            :
            <button onClick={this.login} className="btn">Log In</button>              
          }
          </div>
        </div>
        {this.state.user && this.state.profile ?
          <div className="row">
            <div className="column">

            <div className="field">
              <label>email</label>
              <input class="Input" type="text" defaultValue={this.state.profile.email} />
            </div>
            
            <div className="field">
              <label>bio</label>
              <input className="Input" type="text" defaultValue={this.state.profile.bio} />
            </div>

            </div>
            <div className="column">
            <h6>Songs</h6>
            <div className="song-list">
            {this.state.profile.songs &&
              this.state.profile.songs.map((song, index) =>
              <div className="song" key={index}>
                <div className="song-thumb">
                  <img src="https://d3vv6lp55qjaqc.cloudfront.net/items/3W2T382C29363I0l071Y/Image%202017-11-08%20at%204.43.49%20PM.jpg?X-CloudApp-Visitor-Id=17234&v=3b71512d" />
                </div>
                <div className="song-desc">
                  <h6>PARTY HARD</h6>
                  <div>Starts at {song.options.start}s &amp; plays for {song.options.duration}s </div>
                </div>
              </div>
            )
            }
            </div>
            <button className="btn">Add song</button>
            </div>
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
