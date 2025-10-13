// cli/test/real-world/mixed-patterns.tsx
import React from "react";

class MixedPatterns extends React.Component {
    componentDidMount() {
        // Initial state
        this.setState({ count: 0 });
        
        // Also do async
        fetch('/api/config')
        .then(res => res.json())
        .then(config => this.setState({ config }));
    }
    
    render() {
        return <div>Mixed</div>;
    }
}