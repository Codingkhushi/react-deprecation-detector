import React from "react";

class LegacyComponent extends React.Component {
    componentDidUpdate(prevProps: any) {
        console.log('Old props:', this.props);
        console.log('New props:', prevProps);
    }
    
    componentDidUpdate(prevProps: any, prevState: any) {
        console.log('About to update!');
    }
    
    render() {
        return <div>Legacy Component</div>;
    }
}