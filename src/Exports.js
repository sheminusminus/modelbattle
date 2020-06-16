import React from 'react';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { RoutePath } from 'const';

import { groupByPublic } from 'helpers';

import { listExperiments, setActiveExperiment } from 'types';

import { getExperimentsById, getExperimentsIds, getExperimentsActiveId } from 'selectors';

import { ArrowButton } from 'components';

const Exports = (props) => {
  const {
    activeId,
    experiments,
    history,
    onListExperiments,
    onSetActiveExperiment,
  } = props;

  React.useEffect(() => {
    onListExperiments();
  }, [onListExperiments]);

  if (activeId) {
    history.push(RoutePath.singleExperiment(activeId));
  }

  const { pub, priv } = groupByPublic(Object.values(experiments));

  return (
    <div className="choose-exp">
      <span className="title">Available experiments:</span>

      <br />

      <div className="choose-btns">
        {pub.map((exp) => {
          return (
            <ArrowButton
              key={exp.id}
              onClick={() => {
                onSetActiveExperiment(exp.id);
              }}
              name={exp.id}
            />
          );
        })}

        {priv.map((exp) => {
          return (
            <ArrowButton
              key={exp.id}
              onClick={() => {
                onSetActiveExperiment(exp.id);
              }}
              name={exp.id}
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
  experiments: getExperimentsById,
});

const mapDispatchToProps = {
  onListExperiments: listExperiments.trigger,
  onSetActiveExperiment: setActiveExperiment.trigger,
};

export default connect(mapStateToProps, mapDispatchToProps)(Exports);
