import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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
