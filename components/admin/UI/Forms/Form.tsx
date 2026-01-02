import React from 'react';

type FormActionButton = {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
    className?: string;
    bodyClassName?: string;
};

type FormProps = {
    children: React.ReactNode;
    className?: string;
    bodyClassName?: string;
    actions?: FormActionButton[];
};

const Form = ({ children, actions, className }: FormProps) => {
    return (
        <div className={`container mx-auto gap-4 ${className || ''}`}>
            {children}

            {actions && actions.length > 0 && (
                <div className="flex justify-end mt-4 space-x-2">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className={`btn ${action.className || 'btn-primary'}`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Form;
