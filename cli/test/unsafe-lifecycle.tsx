import React from "react";

class UnsafeLifecycle extends React.Component {
    UNSAFE_componentWillMount() {
        console.log('Using unsafe method');
    }
    
    render() {
        return <div>Unsafe</div>;
    }
}