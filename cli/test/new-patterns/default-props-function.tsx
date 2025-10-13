import React from 'react';

// Function component with defaultProps (deprecated in React 19)
function MyComponent({ name, age }: { name?: string; age?: number }) {
    return <div>{name} - {age}</div>;
}

MyComponent.defaultProps = {
    name: 'Unknown',
    age: 0
};

export default MyComponent;