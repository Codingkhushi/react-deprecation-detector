import React from "react";

class SimpleUpdate extends React.Component {
    componentDidUpdate(prevProps: any, prevState: any) {
        console.log('About to update');
    }
    
    render() {
        return <div>Test</div>;
    }
}