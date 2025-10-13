import React from 'react';
import PropTypes from 'prop-types';

class Parent extends React.Component {
    getChildContext() {
        return { theme: 'dark' };
    }
    
    render() {
        return <div>Parent</div>;
    }
    }

    Parent.childContextTypes = {
    theme: PropTypes.string
    };

    class Child extends React.Component {
    render() {
        return <div>Child</div>;
    }
    }

    Child.contextTypes = {
    theme: PropTypes.string
    };

export { Parent, Child };