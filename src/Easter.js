import React from 'react';

import { BackHeader } from './components';

import modelBattle from './modelbattle.png';


const Easter = () => (
  <div className="header-page">
    <BackHeader />

    <div className="easter">
      <div className="egg">
        <img className="modelbattle" src={modelBattle} alt="modelbattle" />

        <code>
          What do you know about ML models? Well…
          <br />
          <br />
          When ML models fight, it’s called an ML model battle. And when they battle in a puddle, it’s an  ML model puddle battle.
          <br />
          <br />
          AND when ML models battle with paddles in a puddle, they call it an ML model puddle paddle battle. AND…
          <br />
          <br />
          When models battle models in a puddle paddle battle and the model battle puddle is a puddle in a bottle, they call this an ML model bottle puddle paddle battle muddle. AND…
          <br />
          <br />
          When models fight these battles in a bottle with their paddles and the bottle’s on a poodle and the poodle’s eating noodles, they call this a muddle puddle  poodle ML model noodle bottle paddle battle. AND…
        </code>
      </div>
    </div>
  </div>
);

export default Easter;
