import React from 'react';

const ABTestExperiment = (props) => {
  const { aIsFirst, imageA, imageB } = props;

  return (
    <div className="exp-image-wrap">
      {aIsFirst && (
        <React.Fragment>
          {imageA}
          {imageB}
        </React.Fragment>
      )}

      {!aIsFirst && (
        <React.Fragment>
          {imageB}
          {imageA}
        </React.Fragment>
      )}
    </div>
  );
};

export default ABTestExperiment;
