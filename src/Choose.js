import React from 'react';
import { Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { RoutePath } from 'const';

import { groupByPublic } from 'helpers';

import { listExperiments, setActiveExperiment } from 'types';

import { getExperimentsById, getExperimentsIds, getExperimentsActiveId } from 'selectors';

import { ArrowButton } from 'components';

const Choose = (props) => {
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

  const [showNSFW, setShowNSFW] = React.useState(false);

  if (activeId) {
    return <Redirect to={RoutePath.singleExperimentTags(activeId)} />;
  }

  const { pub, priv } = groupByPublic(Object.values(experiments));

  return (
    <div className="choose-exp">
      <span className="title">Available experiments:</span>

      <br />

      <div className="choose-btns">
        {!!pub && pub.map((exp) => {
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

        <hr style={{ marginTop: '30px', marginBottom: '30px' }} />

        <ArrowButton
          name={`${showNSFW ? 'Hide' : 'Show'} NSFW?`}
          onClick={() => {
            setShowNSFW(!showNSFW);
          }}
          style={{
            padding: '0.4rem',
            width: '200px',
            margin: `0 auto ${showNSFW ? '20px' : '0'}`,
          }}
        />

        {showNSFW && !!priv && priv.map((exp) => {
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

export default connect(mapStateToProps, mapDispatchToProps)(Choose);
