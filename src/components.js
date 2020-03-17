import React from 'react';
import Loader from 'react-loader-spinner';
import {
  Link,
  useHistory,
  useLocation,
} from 'react-router-dom';

import firebase from 'services/firebase';
import classNames from 'classNames';

export const ArrowButton = ({ onClick, name }) => (
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

export const BackButton = () => {
  const loc = useLocation();

  const { state } = loc;

  const linkTo = state && state.backUrl ? state.backUrl : '/exp/choose';

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
      to="/egg"
      onClick={(evt) => {
        evt.preventDefault();
        history.push('/egg', { backUrl });
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

  return (
    <div
      className={classNames({
        'img-bg': true,
        [wrapperClassName]: !!wrapperClassName,
      })}
    >
      <img
        tabIndex="0"
        className={className}
        src={url}
        alt={url}
        onLoad={onLoad}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
      />
    </div>
  );
};

export const LegendDesc = ({ children }) => (
  <span className="desc">{children}</span>
);

export const LegendEntry = ({ descText, keyClassName, keyText }) => (
  <span>
    <LegendKey className={keyClassName}>{keyText}</LegendKey> <LegendDesc>{descText}</LegendDesc>
  </span>
);

export const LegendKey = ({ children, className }) => (
  <span className={classNames({ key: true, [className]: !!className })}>
    {children}
  </span>
);

export const LegendHotKeys = () => (
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
              const expName = localStorage.getItem('name');
              localStorage.clear();
              await firebase.auth().signOut();
              const saveName = typeof expName === 'string'
                ? expName.replace('?', '')
                : expName;
              localStorage.setItem('name', saveName);
              history.push('/');
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
        timeout={3000}
      />
    </div>
  );
};

export const TaglineAction = React.forwardRef((props, ref) => {
  const {
    handleAction,
    isLoading,
    nextText,
    skipText,
    taglineText,
    userDidAction,
  } = props;

  return (
    <div className="title-wrapper">
      <span className="title">
        {taglineText}
      </span>

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
        {!isLoading && userDidAction && nextText}
        {!isLoading && !userDidAction && skipText}
      </button>
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
