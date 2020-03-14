import React from 'react';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router'

import Routes from 'Routes';

import { useInitExperimentName } from 'hooks';

const App = ({ history, store }) => {
  const [name, setName] = React.useState(null);

  useInitExperimentName({ name, setName });

  const handleSetName = React.useCallback((n) => {
    const saveName = n.replace('?', '');
    localStorage.setItem('name', saveName);
    setName(saveName);
    window.location.replace(`/exp?n=${saveName}`);
  }, []);

  return (
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <Routes handleSetName={handleSetName} name={name} />
      </ConnectedRouter>
    </Provider>
  );
};

export default App;
