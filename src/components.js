import React from 'react';
import Loader from 'react-loader-spinner';
import {
  Link,
  useHistory,
  useLocation,
} from 'react-router-dom';

import {
  ExperimentMode,
  LSKey,
  RoutePath,
} from 'const';

import { lsGet, lsSet } from 'helpers';

import firebase from 'services/firebase';
import classNames from 'classNames';

export const ArrowButton = ({ onClick, name, style }) => (
  <button
    className="arrow-btn"
    onClick={onClick}
    type="button"
    style={style}
  >
    <a
      className="cta-btn"
      href={RoutePath.singleExperiment(name)}
      onClick={evt => evt.preventDefault()}
    >
      <span>{name}</span>

      <span>
        <i className="material-icons right cta-icon hidden">keyboard_arrow_right</i>
      </span>
    </a>
  </button>
);

export const BackButton = () => {
  const loc = useLocation();

  const { state } = loc;

  const linkTo = state && state.backUrl ? state.backUrl : RoutePath.CHOOSE_EXPERIMENT;

  return (
    <Link to={linkTo}>
      <button
        type="button"
        className="back"
      >
        <i className="material-icons">
          arrow_back
        </i>
      </button>
    </Link>
  );
};

export const BackHeader = ({ backUrl }) => (
  <header className="back-header">
    <BackButton backUrl={backUrl} />
  </header>
);

export const Bar = () => (
  <span className="bar">{' | '}</span>
);

export const EggHuntButton = ({ backUrl }) => {
  const history = useHistory();

  return (
    <Link
      to={RoutePath.EASTER_EGG}
      onClick={(evt) => {
        evt.preventDefault();
        history.push(RoutePath.EASTER_EGG, { backUrl });
      }}
    >
      <div
        className="secret-heart"
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'flex-end',
          backgroundColor: 'transparent',
          width: '60px',
          height: '60px',
          position: 'absolute',
          bottom: '0',
          left: '0',
          padding: '0 0 10px 10px',
        }}
      >
        <i className="material-icons">
          favorite_border
        </i>
      </div>
    </Link>
  );
};

export const Image = (props) => {
  const {
    className,
    idx,
    isSelected,
    onImgKeyPress,
    onLoad,
    onError,
    onSelection,
    url,
    urlsA,
    urlsB,
    whichImg,
    wrapperClassName,
  } = props;

  /**
   * @param {KeyboardEvent} evt
   */
  const handleKeyDown = ({ key, target }) => {
    if (!isSelected) {
      target.blur();
    }

    if (onImgKeyPress) {
      onImgKeyPress({
        evtKey: key,
        urls: { a: urlsA[idx], b: urlsB[idx] },
        whichImg: whichImg,
        index: idx,
      });
    }
  };

  /**
   * @param {MouseEvent} evt
   */
  const handleClick = ({ target }) => {
    if (!isSelected) {
      target.blur();
    }

    if (onSelection) {
      onSelection({
        urls: { a: urlsA[idx], b: urlsB[idx] },
        whichImg: whichImg,
        index: idx,
      });
    }
  };

  return (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mpg') || url.endsWith('.mpeg') || url.endsWith('.wmv')) ? (
    <div
      className={classNames({
        [wrapperClassName]: !!wrapperClassName,
      })}
    >
      <video
        id={"playa"}
        tabIndex="0"
        className={className}
        src={url}
        onLoad={onLoad}
        onError={onError}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        autoPlay={"autoplay"}
        controls
        loop
      />
    </div>
  ) : (url.endsWith('mp3') || url.endsWith('.wav')) ? (
    <div
      className={classNames({
        [wrapperClassName]: !!wrapperClassName,
      })}
    >
      <audio
        tabIndex="0"
        className={className}
        src={url}
        onLoad={onLoad}
        onError={onError}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
    </div>
  ) : (
    <div
      className={classNames({
        'img-bg': true,
        [wrapperClassName]: !!wrapperClassName,
      })}
    >
    <center>
      <img
        tabIndex="0"
        className={className}
        src={url}
        alt={url}
        onLoad={onLoad}
        onError={onError}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
    </center>
    </div>
  );
};

export const Input = React.forwardRef((props, ref) => {
  const {
    autoFocus,
    className,
    name,
    onChange,
    onKeyDown,
    placeholder,
    style = {},
    value,
    wrapperStyle = {},
    completions = ""
  } = props;

  return (
    <div
      className={classNames({
        'input-wrapper': true,
      })}
      style={wrapperStyle}
    >
      <input
        autoFocus={autoFocus}
        className={className}
        name={name}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        ref={ref}
        style={style}
        value={value}
        list={completions}
      />
    </div>
  );
});

export const LegendDesc = ({ children }) => (
  <span className="desc">{children}</span>
);

export const LegendEntry = ({ descText, keyClassName, keyText }) => (
  <span>
    <LegendKey className={keyClassName}>{keyText}</LegendKey>{keyText && ' - '}<LegendDesc>{descText}</LegendDesc>
  </span>
);

export const LegendKey = ({ children, className }) => (
  <span className={classNames({ key: true, [className]: !!className })}>
    {children}
  </span>
);

export const LegendHotKeys = ({ experiment }) => (
  experiment && experiment.mode === ExperimentMode.BOUNDARY ?
    <div className="legend hide-mobile">
      <LegendDesc>Hotkeys: </LegendDesc>

      <br />
      <LegendEntry descText="next/back" keyText="F/R" />

      <br />
      <LegendEntry descText="next video (with/without gifs)" keyText="1/3" />

      <br />
      <LegendEntry descText="next pic (with/without gifs)" keyText="2/4" />

      <br />
      <LegendEntry descText="random" keyText="P" />

      <br />
      <LegendEntry descText="next 10/100/1000" keyText="G/H/J" />

      <br />
      <LegendEntry descText="back 10/100/1000" keyText="T/Y/U" />

      <br />
      <LegendEntry descText="open in new window" keyText="V" />

      <br />
      <LegendEntry descText="undo tag" keyText="Z" />

      <br />
      <LegendEntry descText="• to save tags, go next/back" keyText="" />
      <br />
      <LegendEntry descText="• next/back wipes undo history" keyText="" />
      <br />
      <LegendEntry descText="• scroll with WASD" keyText="" />
    </div>
  :
  <div className="legend hide-mobile">
    <LegendDesc>Hotkeys: </LegendDesc>

    <LegendEntry descText="(Left)" keyText="1" />

    <Bar />

    <LegendEntry descText="(Right)" keyText="2" />

    <Bar />

    <LegendEntry descText="(Skip)" keyClassName="lower" keyText="q" />
  </div>
);

export const Nav = ({ isOpen, onChooseExperiment, setOpen }) => {
  const history = useHistory();

  return (
    <React.Fragment>
      <div className="hide-large mobile-nav-trigger">
        <button
          className="show-stats-btn"
          onClick={() => {
            setOpen(true);
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
          open: isOpen,
        })}
      >
        <div className="menu">
          <div className="hide-large mobile-nav-trigger close">
            <button
              className="show-stats-btn close"
              onClick={() => {
                setOpen(false);
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
              onChooseExperiment();
            }}
          >
            Choose Another Experiment
          </button>

          <button
            className="btn logout"
            type="button"
            onClick={async () => {
              const expName = lsGet(LSKey.NAME);
              localStorage.clear();
              await firebase.auth().signOut();
              const saveName = typeof expName === 'string'
                ? expName.replace('?', '')
                : expName;
              lsSet(LSKey.NAME, saveName);
              history.push(RoutePath.AUTH);
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </React.Fragment>
  );
};

export const Spinner = ({ isLoading }) => {
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
        timeout={5000}
      />
    </div>
  );
};

export const TaglineAction = React.forwardRef((props, ref) => {
  const {
    boundaryIndex,
    boundaryItems,
    getUrl,
    handleAction,
    hasNext,
    hasSkip,
    isLoading,
    linkText = "View",
    nextText,
    skipText,
    taglineText,
    userDidAction,
  } = props;

  // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
  const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const isButtonNext = hasNext && !isLoading && userDidAction;
  const isButtonSkip = hasSkip && !isLoading && !userDidAction;

  return (
    <div className="title-wrapper">
      <span className="title">
        <span dangerouslySetInnerHTML={{__html: taglineText}} />
        <br />
        {boundaryItems && `${numberWithCommas(boundaryIndex)} out of ${numberWithCommas(boundaryItems.length)}`}
      </span>

      <div className={"title-align"}>
        {(isButtonNext || isButtonSkip) && (
          <button
            ref={ref}
            className="btn done"
            disabled={isLoading}
            type="button"
            onFocus={(evt) => evt.preventDefault()}
            onBlur={(evt) => evt.preventDefault()}
            onClick={handleAction}
          >
            {isLoading && (
              <Spinner isLoading={isLoading} />
            )}
            {isButtonNext && (nextText + (getUrl ? ' (F)' : ''))}
            {isButtonSkip && (skipText + (getUrl ? ' (F)' : ''))}
          </button>
        )}

        {getUrl ? (
          <a href={getUrl()} target="_blank" rel="noopener noreferrer">
            <button
              ref={ref}
              className="btn done"
              disabled={isLoading}
              type="button"
              onFocus={(evt) => evt.preventDefault()}
              onBlur={(evt) => evt.preventDefault()}
            >
              {linkText + ' (V)'}
            </button>
          </a>
        ) : null}
      </div>
    </div>
  );
});

TaglineAction.defaultProps = {
  ...TaglineAction.defaultProps,
  nextText: 'Save & Next',
  skipText: 'Neither, skip',
  taglineText: 'Which is better?',
};

export const Totals = ({ totals, shouldShow }) => {
  const picksTitle = 'Your historical picks for this experiment';
  const aTitle = `${totals.a} pink images chosen`;
  const bTitle = `${totals.b} orange images chosen`;
  const noneTitle = `${totals.none} rounds skipped`;

  return (
    <div className={classNames({ totals: true, show: shouldShow })}>
      <span className="picks" title={picksTitle}>
        Picks:
      </span>

      <span className="total-a" title={aTitle}>
        {totals.a}
      </span>

      <Bar />

      <span className="total-b" title={bTitle}>
        {totals.b}
      </span>

      <Bar />

      <span className="total-none" title={noneTitle}>
        ({totals.none})
      </span>
    </div>
  );
};
