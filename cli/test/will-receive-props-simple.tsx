import React from "react";

class SimpleReceiveProps extends React.Component {
    componentDidUpdate(prevProps: any) {
        console.log('Props changed:', prevProps);
        console.log('Debug info');
    }
    
    render() {
        return <div>Test</div>;
    }
}