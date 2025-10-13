import React from "react";

class SetStateComponent extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {loading : true, count : 0};
    }

    render() {
        return <div>State</div>;
    }
}