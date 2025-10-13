import React from 'react';
import ReactDOM from 'react-dom';

const App = () => <div>App</div>;

// Deprecated React 18 pattern
ReactDOM.render(<App />, document.getElementById('root'));

// Also deprecated
ReactDOM.hydrate(<App />, document.getElementById('root'));

// And this
ReactDOM.unmountComponentAtNode(document.getElementById('root')!);