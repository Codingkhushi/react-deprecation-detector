
import React from "react";

class MultipleLifecycles extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {loading,true};
    }

    componentWillReceiveProps(nextProps: any) {
        if (nextProps.id !== this.props.id) {
        this.setState({ loading: true });
        }
    }
    
    componentDidUpdate(prevProps: any, prevState: any) {
        console.log('Updating');
    }
    
    render() {
        return <div>Multiple</div>;
    }
}