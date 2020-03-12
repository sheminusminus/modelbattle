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

const uiConfig = {
  signInFlow: 'popup',
  callbacks: {
    signInSuccess: () => {
      if (window.location.href.includes('choose')) {
        window.location.replace('/exp/choose');
      } else {
        const name = localStorage.getItem('name');

        if (name) {
          window.location.replace(`/exp?n=${name}`);
        } else {
          window.location.replace('/exp/choose');
        }
      }
    },
  },
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebaseUi.auth.AnonymousAuthProvider.PROVIDER_ID,
  ],
};

// hotkeys
const Keys = {
  ONE: '1',
  TWO: '2',
  SKIP: 'q',
  NEXT: 'Enter',
};

const validKeys = Object.values(Keys);

const shuffle = (array) => {
  return array.sort(() => Math.random() - 0.5);
};

const coinFlip = () => {
  return Math.floor(Math.random() * 2) === 0;
};

const ArrowButton = ({ onClick, name }) => (
  <button
    className="arrow-btn"
    onClick={onClick}
    type="button"
  >
    <a
      className="cta-btn"
      href={`/exp?n=${name}`}
      onClick={evt => evt.preventDefault()}
    >
      <span>{name}</span>
      <span>
        <i className="material-icons right cta-icon hidden">keyboard_arrow_right</i>
      </span>
    </a>
  </button>
);

const Choose = (props) => {
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
    <div className="choose-exp">
      <span className="title">Available experiments:</span>

      <br />

      <div className="choose-btns">
        {names.map((n) => {
          return (
            <ArrowButton
              key={n}
              onClick={() => {
                localStorage.setItem('name', n);
                props.setName(n);
                window.location.assign(`/exp?n=${n}`); // `
              }}
              name={n}
            />
          );
        })}
      </div>
    </div>
  );
};

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

const Image = (props) => {
  const {
    className,
    idx,
    isSelected,
    onImgKeyPress,
    onLoad,
    onSelection,
    url,
    urlsA,
    urlsB,
    whichImg,
  } = props;

  return (
    <img
      tabIndex="0"
      className={className}
      src={url}
      alt={url}
      onLoad={onLoad}
      onKeyDown={(evt) => {
        const { key, target } = evt;

        if (!isSelected) {
          target.blur();
        }

        onImgKeyPress({
          evtKey: key,
          urls: { a: urlsA[idx], b: urlsB[idx] },
          whichImg: whichImg,
          index: idx,
        });
      }}
      onClick={(evt) => {
        const { target } = evt;

        if (!isSelected) {
          target.blur();
        }

        onSelection({
          urls: { a: urlsA[idx], b: urlsB[idx] },
          whichImg: whichImg,
          index: idx,
        });
      }}
    />
  );
};

const Main = (props) => {
  const { name } = props;

  const user = firebase.auth().currentUser;

  const [checked, setChecked] = React.useState(false);
  const [aFirstList, setAFirstList] = React.useState([]);

  const [totals, setTotals] = React.useState({ a: 0, b: 0, none: 0 });

  const handle = React.useRef();
  const nextBtn = React.useRef();

  const [urlsA, setUrlsA] = React.useState([]);
  const [urlsB, setUrlsB] = React.useState([]);
  const [loaded, setLoaded] = React.useState({ a: false, b: false });
  const [loadedTime, setLoadedTime] = React.useState('');

  const [selected, setSelected] = React.useState([]);

  const [submitting, setSubmitting] = React.useState(false);

  const [menuOpen, setMenuOpen] = React.useState(false);

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

        setTotals(nextTotals);

        localStorage.setItem(`totals:${expName}`, JSON.stringify(nextTotals));

        setSelected([]);

        const { uid } = firebase.auth().currentUser;
        const data = isNoneSelected ? {
          a: urlsA[0],
          b: urlsB[0],
          vote: 'none',
        } : selection;

        const now = new Date();
        const loadedMillis = (new Date(loadedTime)).valueOf();
        const submittedMillis = now.valueOf();

        await db.ref('results').child(expName).child(uid).push({
          ...data,
          submitted: now.toUTCString(),
          duration_ms: submittedMillis - loadedMillis,
        });

        await loadImages(true);

        setSubmitting(false);
        setLoadedTime((new Date()).toUTCString());
      }
    }
  }, [submitting, selected, totals.a, totals.b, totals.none, urlsA, urlsB, loadedTime]);

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
      setSubmitting(true);
      loadImages(shouldSet);
    }

    return () => {
      setSubmitting(false);
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
    <div className={classNames({ App: true })}>
      <div className="App-header images">
        <div className={classNames({ heading: true, loading: submitting })}>
          <div className={classNames({ totals: true, show: menuOpen })}>
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

          <div className="legend hide-mobile">
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
          <React.Fragment>
            <div className="hide-large mobile-nav-trigger">
              <button
                className="show-stats-btn"
                onClick={() => {
                  setMenuOpen(true);
                }}
                type="button"
              >
                <i className="material-icons">
                  apps
                </i>
              </button>
            </div>

            <div
              className={classNames({
                actions: true,
                'mobile-nav': true,
                open: menuOpen,
              })}
            >
              <div className="menu">
                <div className="hide-large mobile-nav-trigger close">
                  <button
                    className="show-stats-btn close"
                    onClick={() => {
                      setMenuOpen(false);
                    }}
                    type="button"
                  >
                    <i className="material-icons">
                      close
                    </i>
                  </button>
                </div>
              </div>

              <div className="menu-btns">
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
            </div>
          </React.Fragment>
        )}

        {(urlsA.length === urlsB.length) && urlsA.map((url, idx) => {
          const aFirst = aFirstList[idx];
          const b = urlsB[idx];
          const isASelected = selected[idx] && selected[idx].vote === 'a';
          const isBSelected = selected[idx] && selected[idx].vote === 'b';

          const aImg = (
            <Image
              className={classNames({
                disabled: submitting,
                'a-img': true,
                'exp-image': true,
                'a_selected': isASelected,
              })}
              idx={idx}
              isSelected={isASelected}
              onImgKeyPress={onImgKeyPress}
              onSelection={onSelection}
              onLoad={() => {
                if (loaded.b) {
                  setLoaded({ a: true, b: true });
                  setLoadedTime((new Date()).toUTCString());
                } else {
                  setLoaded({ a: true, b: loaded.b });
                }
              }}
              url={url}
              urlsA={urlsA}
              urlsB={urlsB}
              whichImg="a"
            />
          );

          const bImg = (
            <Image
              className={classNames({
                disabled: submitting,
                'b-img': true,
                'exp-image': true,
                'b_selected': isBSelected,
              })}
              idx={idx}
              isSelected={isBSelected}
              onImgKeyPress={onImgKeyPress}
              onSelection={onSelection}
              onLoad={() => {
                if (loaded.a) {
                  setLoaded({ a: true, b: true });
                  setLoadedTime((new Date()).toUTCString());
                } else {
                  setLoaded({ a: loaded.a, b: true });
                }
              }}
              url={b}
              urlsA={urlsA}
              urlsB={urlsB}
              whichImg="b"
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
};

const Auth = (props) => {
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
};

const App = () => {
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
};

export default App;
