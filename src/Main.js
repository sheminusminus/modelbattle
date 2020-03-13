import React from 'react';
import qs from 'query-string';
import {
  Redirect,
  useLocation,
} from 'react-router-dom';

import {
  Keys,
  instantSubmitKeys,
  validKeyDownKeys,
  Vote,
} from './constants';

import firebase, { listImages, makeAuthHandler } from './firebase';

import classNames from './classNames';
import { coinFlip, shuffle } from './util';

import {
  ABTest,
  EggHuntButton,
  Image,
  LegendHotKeys,
  Nav,
  TaglineAction,
  Totals,
} from './components';

import { useInitTotalsHistory } from './hooks';

const db = firebase.database();

const Main = ({ history, name }) => {
  const user = firebase.auth().currentUser;

  const [checked, setChecked] = React.useState(false);
  const [aFirstList, setAFirstList] = React.useState([]);
  const [totals, setTotals] = React.useState({ a: 0, b: 0, none: 0 });
  const [wrapperClasses, setWrapperClasses] = React.useState('');

  /**
   * @type {React.MutableRefObject<firebase.Unsubscribe>}
   */
  const handle = React.useRef();
  /**
   * @type {React.MutableRefObject<HTMLButtonElement>}
   */
  const nextBtn = React.useRef();

  const [urlsA, setUrlsA] = React.useState([]);
  const [urlsB, setUrlsB] = React.useState([]);
  const [loaded, setLoaded] = React.useState({ a: false, b: false });
  const [loadedTime, setLoadedTime] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [taglineData, setTaglineData] = React.useState(false);

  const loc = useLocation();

  const loadImages = React.useCallback(async () => {
    const images = await listImages(loc.search);

    if (images) {
      const { a, b, tagline } = images;
      const aUrls = await Promise.all(a.map(async (ref) => {
        return ref.getDownloadURL();
      }));
      const bUrls = await Promise.all(b.map(async (ref) => {
        return ref.getDownloadURL();
      }));
      const ordering = aUrls.map(() => coinFlip());

      setUrlsA(shuffle(aUrls));
      setUrlsB(shuffle(bUrls));
      setTaglineData(tagline);
      setAFirstList(ordering);
    }

    setSubmitting(false);
  }, [loc.search]);

  const onSubmit = React.useCallback(async (overrideSelected) => {
    if (!submitting) {
      const selection = overrideSelected || selected[0];

      const queries = qs.parse(window.location.search);

      /**
       * @type {?string}
       */
      const expName = queries.n || queries['?n'];

      if (expName) {
        setSubmitting(true);

        const isASelected = selection && selection.vote === Vote.A;
        const isBSelected = selection && selection.vote === Vote.B;
        const isNoneSelected = !selection || selection.vote === Vote.NONE;

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
          vote: Vote.NONE,
        } : selection;

        const now = new Date();
        const loadedMillis = (new Date(loadedTime)).valueOf();
        const submittedMillis = now.valueOf();

        await db.ref('results').child(expName).child(uid).push({
          ...data,
          submitted: now.toUTCString(),
          duration_ms: submittedMillis - loadedMillis,
        });

        await loadImages();

        setSubmitting(false);
        setLoadedTime((new Date()).toUTCString());
      }
    }
  }, [
    loadedTime,
    loadImages,
    selected,
    submitting,
    totals.a,
    totals.b,
    totals.none,
    urlsA,
    urlsB,
  ]);

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

    if (validKeyDownKeys.includes(key)) {
      const isA = (key === Keys.ONE && aFirstList[0])
        || (key === Keys.TWO && !aFirstList[0]);
      const isB = (key === Keys.ONE && !aFirstList[0])
        || (key === Keys.TWO && aFirstList[0]);

      const vote = (isA) ? Vote.A : ((isB) ? Vote.B : Vote.NONE);
      const nextWrapperClasses = (isA) ? 'beep beep-a' : ((isB) ? 'beep beep-b' : 'beep beep-skip');

      if (instantSubmitKeys.includes(key)) {
        setWrapperClasses(nextWrapperClasses);

        setTimeout(() => {
          setWrapperClasses('');
        }, 1000);
      }

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

  useInitTotalsHistory({ setTotals });

  React.useEffect(() => {
    const authHandler = makeAuthHandler({
      expName: name,
      history,
      setChecked,
    });

    handle.current = firebase.auth().onAuthStateChanged(authHandler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (user) {
      setSubmitting(true);
      loadImages();
    }

    return () => {
      setSubmitting(false);
    };
  }, [loadImages, user]);

  if (!user && checked) {
    return <Redirect to="/" />
  }

  if (name === null) {
    return <Redirect from="/exp" to="/exp/choose" />
  }

  return (
    <div className={classNames({ App: true })}>
      <div
        className={classNames({
          'App-header': true,
          images: true,
          [wrapperClasses]: true,
        })}
      >
        <div className={classNames({ heading: true, loading: submitting })}>
          <Totals shouldShow={menuOpen} totals={totals} />

          <LegendHotKeys />

          <TaglineAction
            handleAction={() => onSubmit()}
            isLoading={submitting}
            ref={nextBtn}
            selected={selected}
            taglineText={taglineData}
          />
        </div>

        {!!user && (
          <Nav
            isOpen={menuOpen}
            setOpen={setMenuOpen}
          />
        )}

        {(urlsA.length === urlsB.length) && urlsA.map((url, idx) => {
          const aFirst = aFirstList[idx];
          const b = urlsB[idx];
          const isASelected = selected[idx] && selected[idx].vote === Vote.A;
          const isBSelected = selected[idx] && selected[idx].vote === Vote.B;

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
              wrapperClassName={classNames({
                'a_selected': isASelected,
              })}
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
              wrapperClassName={classNames({
                'b_selected': isBSelected,
              })}
            />
          );

          return (
            <ABTest
              imageA={aImg}
              imageB={bImg}
              aIsFirst={aFirst}
              key={url}
            />
          );
        })}
      </div>

      <EggHuntButton backUrl={`${loc.pathname}${loc.search}`} />
    </div>
  );
};

export default Main;
