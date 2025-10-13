import React from "react";

class AsyncComponent extends React.Component {
    componentDidMount() {
        fetch('/api/data')
        .then(res => res.json())
        .then(data => this.setState({ data }));
    }
    
    render() {
        return <div>Async</div>;
    }
}