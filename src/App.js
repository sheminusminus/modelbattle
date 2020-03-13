import React from 'react';

import Routes from './Routes';

import { useInitExperimentName } from './hooks';

const App = () => {
  const [name, setName] = React.useState(null);

  useInitExperimentName({ name, setName });

  const handleSetName = React.useCallback((n) => {
    const saveName = n.replace('?', '');
    localStorage.setItem('name', saveName);
    setName(saveName);
    window.location.replace(`/exp?n=${saveName}`);
  }, []);

  return (
    <Routes handleSetName={handleSetName} name={name} />
  );
};

export default App;
