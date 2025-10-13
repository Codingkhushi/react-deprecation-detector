import React from "react";

class ComplexConstructor extends React.Component {
    constructor(props: any) {
        super(props);
        
        // Existing state
        this.state = {loading,true,data,null,error,null};
        
        // Bindings
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        console.log('clicked');
    }
    
    render() {
        return <div>Complex</div>;
    }
}