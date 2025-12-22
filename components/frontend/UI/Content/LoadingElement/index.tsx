interface LoadingElementProps {
    title?: string;
}

const LoadingElement = ({ title }: LoadingElementProps) => (
    <div className="flex items-center justify-center h-[200px]">
        Loading {title ? title : '...'}
    </div>
);

export default LoadingElement;