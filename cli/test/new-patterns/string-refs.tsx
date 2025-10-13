import React from 'react';

class StringRefsComponent extends React.Component {
    componentDidMount() {
        // @ts-ignore
        console.log(this.refs.myInput);
        // @ts-ignore
        this.refs.myDiv.focus();
    }
    
    render() {
        return (
        <div>
            <input ref="myInput" />
            <div ref="myDiv">Hello</div>
        </div>
        );
    }
    }

export default StringRefsComponent;