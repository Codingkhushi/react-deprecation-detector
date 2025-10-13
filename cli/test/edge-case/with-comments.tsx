import React from "react";

class WithComments extends React.Component {
    constructor(props: any) {
        super(props);
        this.state = {
            loading: true, // Show spinner,
            data: null     // Clear old data
          };
    }

    render() {
        return <div>Comments</div>;
    }
}