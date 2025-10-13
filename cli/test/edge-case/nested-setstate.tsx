import React from "react";

class NestedSetState extends React.Component {
    componentWillMount() {
        this.setState({ 
        user: { name: 'John', age: 30 },
        config: { theme: 'dark' }
        });
    }
    
    render() {
        return <div>Nested</div>;
    }
}