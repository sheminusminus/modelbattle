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
  callbacks: {
    signInSuccess: () => {
      if (window.location.href.includes('choose')) {
        window.location.replace('/exp/choose');
      } else {
        const name = localStorage.getItem('name') || 'default';
        window.location.replace(`/exp?n=${name}`);
      }
    },
  },
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

function Choose(props) {
  const [names, setNames] = React.useState([]);

  React.useEffect(() => {
    const getExperiments = async () => {
      const snap = await db.ref('meta').once('value');
      const expData = snap.val();
      return Object.keys(expData || {});
    };

    getExperiments().then((names) => {
      setNames(names);
    });
  }, []);

  return (
    <React.Fragment>
      {names.map((n) => {
        return (
          <React.Fragment>
            <button
              key={n}
              onClick={() => {
                localStorage.setItem('name', n);
                props.setName(n);
                window.location.assign(`/exp?n=${n}`);
              }}
              type="button"
            >
              {n}
            </button>
            <br />
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
}

function Main(props) {
  const { name } = props;

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
        const { n } = qs.parse(window.location.search);
        const expName = n || 'default';
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

  if (name === null) {
    return <Redirect from="/exp" to="/exp/choose" />
  }

  return (
    <div className='App'>
      <div className="App-header images">
        {!!user && (
          <React.Fragment>
            <button
              className="btn choose"
              type="button"
              onClick={() => {
                props.history.push('/exp/choose');
              }}
            >
              Choose Experiment
            </button>

            <button
              className="btn logout"
              type="button"
              onClick={async () => {
                await firebase.auth().signOut();
              }}
            >
              Logout
            </button>
          </React.Fragment>
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
              const { n } = qs.parse(window.location.search);
              const expName = n || 'default';
              const { uid } = firebase.auth().currentUser;
              await db.ref('results').child(expName).child(uid).push(selected);
              localStorage.clear();
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
        props.history.push(`/exp?n=${props.name || 'default'}`);
      }
    });

    return () => {
      handle.current();
    };
  });

  if (checked && firebase.auth().currentUser) {
    return <Redirect to={`/exp?n=${props.name || 'default'}`} />;
  }

  return (
    <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()}/>
  );
}

function App() {
  const [name, setName] = React.useState(null);

  React.useEffect(() => {
    const prevName = localStorage.getItem('name');

    if (!name) {
      const { n } = qs.parse(window.location.search);

      if (n) {
        localStorage.setItem('name', n);
        setName(n);
      } else if (prevName) {
        setName(n);
      } else {
        localStorage.setItem('name', '');
        setName('');
      }
    }
  }, []);

  const handleSetName = (n) => {
    localStorage.setItem('name', n);
    setName(n);
    window.location.replace(`/exp?n=${n}`);
  };

  return (
    <Router>
      <Switch>
        <Route exact path="/exp/choose" render={() => (
          <Choose setName={handleSetName} />
        )} />
        <Route path="/exp" component={Main} name={name} />
        <Route path="/" component={Auth} name={name} />
      </Switch>
    </Router>
  );
}

export default App;
