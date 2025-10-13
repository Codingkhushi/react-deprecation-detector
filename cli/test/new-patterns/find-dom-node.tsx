import React from 'react';
import ReactDOM from 'react-dom';

class FindDOMNodeComponent extends React.Component {
    componentDidMount() {
        const node = ReactDOM.findDOMNode(this);
        if (node) {
        console.log('Found node:', node);
        }
    }
    
    render() {
        return <div>Find DOM Node</div>;
    }
}

export default FindDOMNodeComponent;