import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { listExperiments, setActiveExperiment } from 'types';

import { getExperimentsIds, getExperimentsActiveId } from 'selectors';

import { ArrowButton } from 'components';

const Choose = (props) => {
  const {
    activeId,
    experimentIds,
    history,
    onListExperiments,
    onSetActiveExperiment,
  } = props;

  React.useEffect(() => {
    onListExperiments();
  }, [onListExperiments]);

  if (activeId) {
    history.push(`/exp?n=${activeId}`);
  }

  return (
    <div className="choose-exp">
      <span className="title">Available experiments:</span>

      <br />

      <div className="choose-btns">
        {experimentIds.map((id) => {
          return (
            <ArrowButton
              key={id}
              onClick={() => {
                onSetActiveExperiment(id);
              }}
              name={id}
            />
          );
        })}
      </div>
    </div>
  );
};

const mapStateToProps = createStructuredSelector({
  activeId: getExperimentsActiveId,
  experimentIds: getExperimentsIds,
});

const mapDispatchToProps = {
  onListExperiments: listExperiments.trigger,
  onSetActiveExperiment: setActiveExperiment.trigger,
};

export default connect(mapStateToProps, mapDispatchToProps)(Choose);
