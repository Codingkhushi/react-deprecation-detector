import React from 'react';

// Deprecated createFactory
const divFactory = React.createFactory('div');

function Component() {
    return divFactory({ className: 'container' }, 'Hello');
}

export default Component;