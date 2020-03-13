import React from 'react';

import firebase from './firebase';

import { ArrowButton } from './components';

const db = firebase.database();

const Choose = ({ setName }) => {
  const [names, setNames] = React.useState([]);

  React.useEffect(() => {
    const getExperiments = async () => {
      const snap = await db.ref('meta').once('value');
      const expData = snap.val();
      return Object.keys(expData || {});
    };

    getExperiments().then((names) => {
      setNames(names);
    });
  }, []);

  return (
    <div className="choose-exp">
      <span className="title">Available experiments:</span>

      <br />

      <div className="choose-btns">
        {names.map((n) => {
          const saveName = n.replace('?', '');

          return (
            <ArrowButton
              key={n}
              onClick={() => {
                localStorage.setItem('name', saveName);
                setName(n);
                window.location.assign(`/exp?n=${saveName}`);
              }}
              name={n}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Choose;
