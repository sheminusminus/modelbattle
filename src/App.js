import React from 'react';
import firebase from 'firebase';
import qs from 'query-string';
import { StyledFirebaseAuth }  from 'react-firebaseui';
import * as firebaseUi from 'firebaseui';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import Loader from 'react-loader-spinner';

import classNames from './classNames';

import firebaseConfig from './firebaseConfig';

import './App.css';

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
        const name = localStorage.getItem('name');
        if (name) {
          window.location.replace(`/exp?n=${name}`);
        }
      }
    },
  },
  // We will display Google and Facebook as auth providers.
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebaseUi.auth.AnonymousAuthProvider.PROVIDER_ID,
  ],
};

const Keys = {
  ONE: '1',
  TWO: '2',
  SKIP: 'q',
  NEXT: 'Enter',
};

const validKeys = Object.values(Keys);

const ActionForKey = {
  [Keys.ONE]: 'a',
  [Keys.TWO]: 'b',
  [Keys.SKIP]: 'none',
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
          <React.Fragment key={n}>
            <button
              key={n}
              onClick={() => {
                localStorage.setItem('name', n);
                props.setName(n);
                window.location.assign(`/exp?n=${n}`); // `
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

const listImages = async () => {
  const { n: expName } = qs.parse(window.location.search);

  if (!expName) { return; }

  const dirASnap = await db.ref('meta').child(expName).child('a_dir').once('value');
  const dirBSnap = await db.ref('meta').child(expName).child('b_dir').once('value');
  const dirA = dirASnap.val();
  const dirB = dirBSnap.val();
  const { items: itemsA } = await store.ref(dirA).listAll();
  const { items: itemsB } = await store.ref(dirB).listAll();
  return { a: [shuffle(itemsA)[0]], b: [shuffle(itemsB)[0]] };
};

const Spinner = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="spinner">
      <Loader
        type="Puff"
        color="#0EBCF3"
        height={20}
        width={20}
        timeout={3000}
      />
    </div>
  );
};

function Main(props) {
  const { name } = props;

  const user = firebase.auth().currentUser;

  console.log(user);
  const [checked, setChecked] = React.useState(false);
  const [aFirstList, setAFirstList] = React.useState([]);

  const [totals, setTotals] = React.useState({ a: 0, b: 0, none: 0 });

  const handle = React.useRef();
  const nextBtn = React.useRef();

  const [urlsA, setUrlsA] = React.useState([]);
  const [urlsB, setUrlsB] = React.useState([]);

  const [selected, setSelected] = React.useState([]);

  const [submitting, setSubmitting] = React.useState(false);

  const loadImages = async (shouldSet) => {
    const images = await listImages();

    if (images) {
      const {a, b} = images;
      const aUrls = await Promise.all(a.map(async (ref) => {
        return ref.getDownloadURL();
      }));
      const bUrls = await Promise.all(b.map(async (ref) => {
        return ref.getDownloadURL();
      }));
      const ordering = aUrls.map(() => coinFlip());

      if (shouldSet) {
        setUrlsA(shuffle(aUrls));
        setUrlsB(shuffle(bUrls));
        setAFirstList(ordering);
      }
    }

    setSubmitting(false);
  };

  const onSubmit = React.useCallback(async (overrideSelected) => {
    if (!submitting) {
      const selection = overrideSelected || selected[0];

      const { n: expName } = qs.parse(window.location.search);

      if (expName) {
        setSubmitting(true);

        const isASelected = selection && selection.vote === 'a';
        const isBSelected = selection && selection.vote === 'b';
        const isNoneSelected = !selection || selection.vote === 'none';

        const nextTotals = {
          a: isASelected ? totals.a + 1 : totals.a,
          b: isBSelected ? totals.b + 1 : totals.b,
          none: isNoneSelected ? totals.none + 1 : totals.none,
        };

        console.log(totals, nextTotals);
        setTotals(nextTotals);

        localStorage.setItem(`totals:${expName}`, JSON.stringify(nextTotals));

        setSelected([]);

        const { uid } = firebase.auth().currentUser;
        await db.ref('results').child(expName).child(uid).push(selected);

        await loadImages(true);

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });

        setSubmitting(false);
      }
    }
  }, [selected, submitting, totals]);

  const onSelection = ({ index, whichImg, urls }) => {
    if (selected[index] && selected[index].vote === whichImg) {
      setSelected([]);
    } else {
      const nextSelected = [...selected];
      nextSelected[index] = {
        a: urls.a,
        b: urls.b,
        vote: whichImg,
      };
      setSelected(nextSelected);
    }
  };

  const onImgKeyPress = ({ evtKey, ...rest }) => {
    if (evtKey === 'Enter') {
      onSelection(rest);
    }
  };

  const handleKeyDown = React.useCallback((evt) => {
    const { key } = evt;

    if (validKeys.includes(key)) {
      const isA = (key === Keys.ONE && aFirstList[0])
        || (key === Keys.TWO && !aFirstList[0]);
      const isB = (key === Keys.ONE && !aFirstList[0])
        || (key === Keys.TWO && aFirstList[0]);

      const vote = (isA) ? 'a' : ((isB) ? 'b' : 'none');

      const selection = {
        a: urlsA[0],
        b: urlsB[0],
        vote,
      };

      onSubmit(selection);
    }
  }, [aFirstList, onSubmit, urlsA, urlsB]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [totals.a, totals.b, totals.none, selected, handleKeyDown]);

  React.useEffect(() => {
    const { n: expName } = qs.parse(window.location.search);
    const savedTotals = localStorage.getItem(`totals:${expName}`);
    if (savedTotals) {
      const totalsObj = JSON.parse(savedTotals);
      setTotals(totalsObj);
    }
  }, []);

  React.useEffect(() => {
    handle.current = firebase.auth().onAuthStateChanged(async (u) => {
      setChecked(true);

      if (!u) {
        props.history.push('/');
      } else {
        const { displayName, email, photoURL, uid, providerId, isAnonymous } = u;

        let userData;

        if (isAnonymous) {
          userData = { displayName: uid, uid, anon: isAnonymous };
        } else {
          userData = { displayName: displayName || uid, email, photoUrl: photoURL, uid, providerId };
        }

        await db.ref('users').child(uid).set(userData);
      }

      return () => {
        handle.current();
      };
    });
  });

  React.useEffect(() => {
    let shouldSet = true;

    if (user) {
      loadImages(shouldSet);
    }

    return () => {
      shouldSet = false;
    };
  }, [user]);

  if (!user && checked) {
    return <Redirect to="/" />
  }

  if (name === null) {
    return <Redirect from="/exp" to="/exp/choose" />
  }

  return (
    <div className='App'>
      <div className="App-header images">
        <div className={classNames({ heading: true, loading: submitting })}>
          <div className="totals">
            <span
              title="Your historical picks for this experiment"
            >
              Picks:
            </span>
            <span
              className="total-a"
              title={`${totals.a} pink images chosen`}
            >
              {totals.a}
            </span>
            <span className="bar">{' | '}</span>
            <span
              className="total-b"
              title={`${totals.b} orange images chosen`}
            >
              {totals.b}
            </span>
            <span className="bar">{' | '}</span>
            <span
              className="total-none"
              title={`${totals.none} rounds skipped`}
            >
              ({totals.none})
            </span>
          </div>

          <div className="legend">
            <span className="desc">Hotkeys: </span>
            <span>
              <span className="key">1</span> <span className="desc">(Left)</span>
            </span>
            <span className="bar">{' | '}</span>
            <span>
              <span className="key">2</span> <span className="desc">(Right)</span>
            </span>
            <span className="bar">{' | '}</span>
            <span>
              <span className="key lower">q</span> <span className="desc">(Skip)</span>
            </span>
          </div>

          <div className="title-wrapper">
            <span className="title">
              Which is better?
            </span>

            <button
              ref={nextBtn}
              className="btn done"
              disabled={submitting}
              type="button"
              onFocus={(evt) => evt.preventDefault()}
              onBlur={(evt) => evt.preventDefault()}
              onClick={() => onSubmit()}
            >
              {submitting && (
                <Spinner isLoading={submitting} />
              )}
              {!submitting && selected.length > 0 && 'Save & Next'}
              {!submitting && selected.length === 0 && 'Neither, skip'}
            </button>
          </div>
        </div>

        {!!user && (
          <div className="actions">
            <button
              className="btn choose"
              type="button"
              onClick={() => {
                props.history.push('/exp/choose');
              }}
            >
              Choose Another Experiment
            </button>

            <button
              className="btn logout"
              type="button"
              onClick={async () => {
                const expName = localStorage.getItem('name');
                localStorage.clear();
                await firebase.auth().signOut();
                localStorage.setItem('name', expName);
              }}
            >
              Logout
            </button>
          </div>
        )}

        {(urlsA.length === urlsB.length) && urlsA.map((url, idx) => {
          const aFirst = aFirstList[idx];
          const b = urlsB[idx];
          const isASelected = selected[idx] && selected[idx].vote === 'a';
          const isBSelected = selected[idx] && selected[idx].vote === 'b';

          const aImg = (
            <img
              tabIndex="0"
              className={classNames({
                disabled: submitting,
                'a-img': true,
                'exp-image': true,
                'a_selected': isASelected,
              })}
              src={url}
              alt={url}
              onKeyDown={(evt) => {
                const { key, target } = evt;

                if (!isASelected) {
                  target.blur();
                }

                onImgKeyPress({
                  evtKey: key,
                  urls: { a: urlsA[idx], b: urlsB[idx] },
                  whichImg: 'a',
                  index: idx,
                });
              }}
              onClick={(evt) => {
                const { target } = evt;

                if (!isASelected) {
                  target.blur();
                }

                onSelection({
                  urls: { a: urlsA[idx], b: urlsB[idx] },
                  whichImg: 'a',
                  index: idx,
                });
              }}
            />
          );

          const bImg = (
            <img
              tabIndex="0"
              className={classNames({
                disabled: submitting,
                'b-img': true,
                'exp-image': true,
                'b_selected': isBSelected,
              })}
              src={b}
              alt={b}
              onKeyDown={(evt) => {
                const { key, target } = evt;

                if (!isBSelected) {
                  target.blur();
                }

                onImgKeyPress({
                  evtKey: key,
                  urls: { a: urlsA[idx], b: urlsB[idx] },
                  whichImg: 'b',
                  index: idx,
                });
              }}
              onClick={(evt) => {
                const { target } = evt;

                if (!isASelected) {
                  target.blur();
                }

                onSelection({
                  urls: { a: urlsA[idx], b: urlsB[idx] },
                  whichImg: 'b',
                  index: idx,
                });
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
              </div>

              {idx < urlsA.length - 1 && (
                <hr />
              )}
            </React.Fragment>
          );
        })}
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
        const { displayName, email, photoURL, uid, providerId, isAnonymous } = user;

        let userData;

        if (isAnonymous) {
          userData = { displayName: uid, uid, anon: isAnonymous };
        } else {
          userData = { displayName: displayName || uid, email, photoUrl: photoURL, uid, providerId };
        }

        await db.ref('users').child(uid).set(userData);

        if (props.name) {
          props.history.push(`/exp?n=${props.name}`);
        }
      }
    });

    return () => {
      handle.current();
    };
  });

  if (checked && firebase.auth().currentUser) {
    if (props.name) {
      return <Redirect to={`/exp?n=${props.name}`} />; // `
    } else {
      return <Redirect to={`/exp`} />;
    }
  }

  return (
    <StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebase.auth()} />
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
  }, [name]);

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
