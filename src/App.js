import React from 'react';
import firebase from 'firebase';
import qs from 'query-string';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import './App.css';

const firebaseConfig = {
  apiKey: 'AIzaSyDc8kZCL0_ai9tCds8bwXYiJiy8xgEv3uU',
  authDomain: 'experiments-573d7.firebaseapp.com',
  databaseURL: 'https://experiments-573d7.firebaseio.com',
  projectId: 'experiments-573d7',
  storageBucket: 'experiments-573d7.appspot.com',
  messagingSenderId: '450691706719',
  appId: '1:450691706719:web:e60b4879afd17d34cbd0ea',
  measurementId: 'G-CHD125KKCH',
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

const store = firebase.storage();
const db = firebase.database();

// Configure FirebaseUI.
const uiConfig = {
  // Popup signin flow rather than redirect flow.
  signInFlow: 'popup',
  // Redirect to /signedIn after sign in is successful. Alternatively you can provide a callbacks.signInSuccess function.
  signInSuccessUrl: '/exp',
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID
  ]
};

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function coinFlip() {
  return Math.floor(Math.random() * 2) === 0;
}

function Main(props) {
  const { n: name } = qs.parse(window.location.search);

  const user = firebase.auth().currentUser;
  const [checked, setChecked] = React.useState(false);
  const [aFirstList, setAFirstList] = React.useState([]);

  const handle = React.useRef();

  const [urlsA, setUrlsA] = React.useState([]);
  const [urlsB, setUrlsB] = React.useState([]);

  const [selected, setSelected] = React.useState([]);

  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    handle.current = firebase.auth().onAuthStateChanged(async (u) => {
      setChecked(true);

      if (!u) {
        props.history.push('/');
      } else {
        const { displayName, email, photoURL, uid, providerId } = u;
        await db.ref('users').child(uid).set({ displayName, email, photoUrl: photoURL, uid, providerId });
      }

      return () => {
        handle.current();
      };
    });
  });

  React.useEffect(() => {
    let shouldSet = true;

    if (user) {
      const listImages = async () => {
        const expName = name || 'default';
        const dirASnap = await db.ref('meta').child(expName).child('a_dir').once('value');
        const dirBSnap = await db.ref('meta').child(expName).child('b_dir').once('value');
        const dirA = dirASnap.val();
        const dirB = dirBSnap.val();
        const { items: itemsA } = await store.ref(dirA).listAll();
        const { items: itemsB } = await store.ref(dirB).listAll();
        return { a: itemsA, b: itemsB };
      };

      listImages().then(async ({ a, b }) => {
        if (shouldSet && !urlsA.length && !urlsB.length) {
          const aUrls = await Promise.all(a.map(async (ref) => {
            return ref.getDownloadURL();
          }));
          const bUrls = await Promise.all(b.map(async (ref) => {
            return ref.getDownloadURL();
          }));
          const ordering = aUrls.map(() => coinFlip());
          setUrlsA(shuffle(aUrls));
          setUrlsB(shuffle(bUrls));
          setAFirstList(ordering);
        }
      });
    }

    return () => {
      shouldSet = false;
    };
  }, [name, urlsA.length, urlsB.length, user]);

  if (!user && checked) {
    return <Redirect to="/" />
  }

  return (
    <div className='App'>
      <div className="App-header images">
        {!!user && (
          <button
            className="btn logout"
            type="button"
            onClick={async () => {
              await firebase.auth().signOut();
            }}
          >
            Logout
          </button>
        )}

        <span className="title">Which is best?</span>
        <br />
        {urlsA.length === urlsB.length && urlsA.map((url, idx) => {
          const aFirst = aFirstList[idx];
          const b = urlsB[idx];

          const aImg = (
            <img
              className={`exp-image${selected[idx] && selected[idx].vote === 'a' ? ' selected' : ''}`}
              src={url}
              alt={url}
              onClick={() => {
                const nextSelected = [...selected];
                nextSelected[idx] = {
                  a: url,
                  b: b,
                  vote: 'a',
                };
                setSelected(nextSelected);
              }}
            />
          );

          const bImg = (
            <img
              className={`exp-image${selected[idx] && selected[idx].vote === 'b' ? ' selected' : ''}`}
              src={b}
              alt={b}
              onClick={() => {
                const nextSelected = [...selected];
                nextSelected[idx] = nextSelected[idx] = {
                  a: url,
                  b: b,
                  vote: 'b',
                };
                setSelected(nextSelected);
              }}
            />
          );

          return (
            <React.Fragment key={url}>
              <div className="exp-image-wrap">
                {aFirst && (
                  <React.Fragment>
                    {aImg}
                    {bImg}
                  </React.Fragment>
                )}

                {!aFirst && (
                  <React.Fragment>
                    {bImg}
                    {aImg}
                  </React.Fragment>
                )}

                <div
                  className={`none exp-image${selected[idx] && selected[idx].vote === 'none' ? ' selected' : ''}`}
                  onClick={() => {
                    const nextSelected = [...selected];
                    nextSelected[idx] = nextSelected[idx] = {
                      a: url,
                      b: b,
                      vote: 'none',
                    };
                    setSelected(nextSelected);
                  }}
                >
                  <span>None</span>
                </div>
              </div>

              {idx < urlsA.length - 1 && (
                <hr />
              )}
            </React.Fragment>
          );
        })}

        <button
          className="btn done"
          disabled={submitting || selected.filter(opt => !!opt).length !== urlsA.length}
          type="button"
          onClick={async () => {
            if (!submitting) {
              setSubmitting(true);
              const expName = name || 'default';
              const { uid } = firebase.auth().currentUser;
              await db.ref('results').child(expName).child(uid).push(selected);
              setSelected([]);
              setSubmitting(false);
              window.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth',
              });
            }
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

function Auth(props) {
  const [checked, setChecked] = React.useState(false);

  const handle = React.useRef();

  React.useEffect(() => {
    handle.current = firebase.auth().onAuthStateChanged(async (user) => {
      setChecked(true);

      if (user) {
        const { displayName, email, photoURL, uid, providerId } = user;
        await db.ref('users').child(uid).set({ displayName, email, photoUrl: photoURL, uid, providerId });
        props.history.push('/exp');
      }
    });

    return () => {
      handle.current();
    };
  });

  if (checked && firebase.auth().currentUser) {
    return <Redirect to="/exp" />;
  }

  return (
    <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()}/>
  );
}

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/exp" component={Main} />
        <Route path="/" component={Auth}  />
      </Switch>
    </Router>
  );
}

export default App;
