
import React from "react";

    class ApiIntegration extends React.Component {
    componentDidMount() {
        // This should move to componentDidMount
        fetch('/api/users')
        .then(res => res.json())
        .then(data => this.setState({ users: data }))
        .catch(err => this.setState({ error: err }));
    }
    
    render() {
        return <div>API</div>;
    }
}