import React from "react";

class ConstructorMerge extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {loading : true, count : 0, existing : true};
    }

    render() {
        return <div>Merge</div>;
    }
}