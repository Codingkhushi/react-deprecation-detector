import React from "react";

class ModernComponent extends React.Component {
    componentDidMount() {
        console.log('Mounted!');
    }
    
    render() {
        return <div>Modern Component</div>;
    }
}