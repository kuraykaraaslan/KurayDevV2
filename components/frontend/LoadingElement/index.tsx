import React from "react";

interface LoadingElementProps {
    title?: string;
}

const LoadingElement: React.FC<LoadingElementProps> = ({ title }) => (
    <div className="flex items-center justify-center h-[200px]">
        Loading {title ? title : '...'}
    </div>
);

export default LoadingElement;