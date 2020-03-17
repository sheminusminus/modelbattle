import React from 'react';
import {
  Redirect,
  useLocation,
} from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  Keys,
  instantSubmitKeys,
  validKeyDownKeys,
  Vote,
  ExperimentMode,
} from 'const';

import firebase, { listImages } from 'services/firebase';

import classNames from 'classNames';
import { coinFlip, shuffle } from 'helpers';

import * as selectors from "selectors";

import ABTestExperiment from 'ABTestExperiment';
import Asset from 'Asset';
import BoundaryExperiment from './BoundaryExperiment';
import {
  EggHuntButton,
  LegendHotKeys,
  Nav,
  TaglineAction,
  Totals,
} from 'components';

import { changeActiveExperiment, getExperimentMeta } from 'types';

import { useInitTotalsHistory } from 'hooks';

const db = firebase.database();

const Main = (props) => {
  const {
    activeExperiment,
    history,
    isFetchingData,
    isLoading,
    onChangeExperiment,
    onGetExperimentMeta,
    user,
  } = props;

  const [isAFirst, setIsAFirst] = React.useState(coinFlip());
  const [totals, setTotals] = React.useState({ a: 0, b: 0, none: 0 });
  const [wrapperClasses, setWrapperClasses] = React.useState('');
  const [loadedExperiment, setLoadedExperiment] = React.useState(false);

  React.useEffect(() => {
    if (activeExperiment && !loadedExperiment) {
      setLoadedExperiment(true);
      onGetExperimentMeta();
    }
  }, [activeExperiment, loadedExperiment, onGetExperimentMeta]);

  /**
   * @type {React.MutableRefObject<HTMLButtonElement>}
   */
  const nextBtnRef = React.useRef();

  const [boundaryItems, setBoundaryItems] = React.useState([]);
  const [boundaryShapes, setBoundaryShapes] = React.useState([]);
  const [urlsA, setUrlsA] = React.useState([]);
  const [urlsB, setUrlsB] = React.useState([]);
  const [loaded, setLoaded] = React.useState({ a: false, b: false });
  const [loadedTime, setLoadedTime] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [boundaryIndex, setBoundaryIndex] = React.useState(0);

  const loc = useLocation();

  const loadImages = React.useCallback(async () => {
    const isBoundary = activeExperiment && activeExperiment.mode === ExperimentMode.BOUNDARY;
    const isAB = activeExperiment && activeExperiment.mode === ExperimentMode.AB;

    if (activeExperiment && (isAB || (isBoundary && boundaryItems.length === 0))) {
      const images = await listImages(activeExperiment.id);

      if (images && activeExperiment) {
        if (activeExperiment.mode === ExperimentMode.AB) {
          const { a, b } = images;
          const aUrls = await Promise.all(a.map(async (ref) => {
            return ref.getDownloadURL();
          }));
          const bUrls = await Promise.all(b.map(async (ref) => {
            return ref.getDownloadURL();
          }));

          setUrlsA(shuffle(aUrls));
          setUrlsB(shuffle(bUrls));
          setIsAFirst(coinFlip());
        } else if (activeExperiment.mode === ExperimentMode.BOUNDARY) {
          const { items } = images;
          const itemData = await Promise.all(items.map(async (ref) => {
            const { contentType } = await ref.getMetadata();
            const url = await ref.getDownloadURL();
            return { contentType, url };
          }));
          setBoundaryItems(itemData);
        }
      }
    }

    setSubmitting(false);
  }, [activeExperiment, boundaryItems.length]);

  const onSubmit = React.useCallback(async (overrideSelected) => {
    const { mode: expMode, id: expName } = activeExperiment;
    const { uid } = firebase.auth().currentUser;

    if (!submitting) {
      if (expMode === ExperimentMode.AB) {
        const selection = overrideSelected || selected[0];

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
      } else if (expMode === ExperimentMode.BOUNDARY) {
        if (boundaryShapes && boundaryShapes.length) {
          const now = new Date();
          const data = boundaryShapes.map((shape) => ({
            ...shape,
            submitted: now.toUTCString(),
          }));
          await db.ref('results').child(expName).child(uid).push(data);
        }

        setBoundaryIndex(boundaryIndex + 1);
        setBoundaryShapes([]);
      }
    }
  }, [activeExperiment, submitting, selected, totals.a, totals.b, totals.none, urlsA, urlsB, loadedTime, loadImages, boundaryShapes, boundaryIndex]);

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
      const isA = (key === Keys.ONE && isAFirst)
        || (key === Keys.TWO && !isAFirst);
      const isB = (key === Keys.ONE && !isAFirst)
        || (key === Keys.TWO && isAFirst);

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
  }, [isAFirst, onSubmit, urlsA, urlsB]);

  React.useEffect(() => {
    if (activeExperiment && activeExperiment.mode === ExperimentMode.AB) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [totals.a, totals.b, totals.none, selected, handleKeyDown, activeExperiment]);

  useInitTotalsHistory({ setTotals, expName: activeExperiment && activeExperiment.id });

  React.useEffect(() => {
    if (user) {
      setSubmitting(true);
      loadImages();
    }

    return () => {
      setSubmitting(false);
    };
  }, [loadImages, user]);

  const isASelected = selected[0] && selected[0].vote === Vote.A;
  const isBSelected = selected[0] && selected[0].vote === Vote.B;

  if (!isLoading && !user) {
    return <Redirect to="/" />
  }

  let contents = null;

  if (activeExperiment && !isFetchingData) {
    const { mode } = activeExperiment;
    if (mode === ExperimentMode.AB) {
      contents = (
        <ABTestExperiment
          imageA={(
            <Asset
              assets={urlsA}
              data={{
                className: classNames({
                  disabled: submitting,
                  'a-img': true,
                  'exp-image': true,
                  'a_selected': isASelected,
                }),
                idx: 0,
                isSelected: isASelected,
                onImgKeyPress,
                onSelection,
                onLoad: () => {
                  if (loaded.b) {
                    setLoaded({ a: true, b: true });
                    setLoadedTime((new Date()).toUTCString());
                  } else {
                    setLoaded({ a: true, b: loaded.b });
                  }
                },
                urlsA,
                urlsB,
                whichImg: 'a',
                wrapperClassName: classNames({
                  'a_selected': isASelected,
                }),
              }}
              type="image/"
            />
          )}
          imageB={(
            <Asset
              assets={urlsB}
              data={{
                className: classNames({
                  disabled: submitting,
                  'b-img': true,
                  'exp-image': true,
                  'b_selected': isBSelected,
                }),
                idx: 0,
                isSelected: isBSelected,
                onImgKeyPress,
                onSelection,
                onLoad: () => {
                  if (loaded.a) {
                    setLoaded({ a: true, b: true });
                    setLoadedTime((new Date()).toUTCString());
                  } else {
                    setLoaded({ a: loaded.a, b: true });
                  }
                },
                urlsA,
                urlsB,
                whichImg: 'b',
                wrapperClassName: classNames({
                  'b_selected': isBSelected,
                }),
              }}
              type="image/"
            />
          )}
          aIsFirst={isAFirst}
        />
      );
    } else if (mode === ExperimentMode.BOUNDARY) {
      contents = (
        <BoundaryExperiment
          items={boundaryItems.slice(boundaryIndex)}
          onSubmit={() => onSubmit()}
          onImageLoad={() => {
            setLoadedTime((new Date()).toUTCString());
          }}
          onDrawStart={() => {
            setBoundaryShapes([]);
          }}
          onDrawEnd={(shapeData) => {
            setBoundaryShapes(shapeData);
          }}
        />
      );
    }
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
            userDidAction={Boolean(
              (activeExperiment && activeExperiment.mode === ExperimentMode.AB && selected && selected.length > 0)
              || (activeExperiment && activeExperiment.mode === ExperimentMode.BOUNDARY && boundaryShapes.length > 0)
            )}
            ref={nextBtnRef}
            taglineText={activeExperiment && activeExperiment.tagline}
            skipText={activeExperiment && activeExperiment.skipText}
          />
        </div>

        {!!user && (
          <Nav
            onChooseExperiment={() => {
              onChangeExperiment();
              history.push('/exp/choose');
            }}
            isOpen={menuOpen}
            setOpen={setMenuOpen}
          />
        )}

        {contents}
      </div>

      <EggHuntButton backUrl={`${loc.pathname}${loc.search}`} />
    </div>
  );
};

const mapStateToProps = createStructuredSelector({
  activeExperiment: selectors.getExperimentMetaForActiveId,
  isLoading: selectors.getSessionIsLoading,
  isFetchingData: selectors.getExperimentsIsFetching,
  user: selectors.getSessionUser,
});

const mapDispatchToProps = {
  onChangeExperiment: changeActiveExperiment.trigger,
  onGetExperimentMeta: getExperimentMeta.trigger,
};

export default connect(mapStateToProps, mapDispatchToProps)(Main);
