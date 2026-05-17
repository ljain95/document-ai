"use client";

// Higher-Order Component
function withFor(WrappedComponent: any) {
    return function WithForComponent({ data, ...props }:{data:any[]}) {
        return (
            <>
                {data.map((item, index) => (
                    <WrappedComponent key={index} item={item} index={index} {...props} />
                ))}
            </>
        );
    };
}

export default withFor;