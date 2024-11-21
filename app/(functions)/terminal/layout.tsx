import React from 'react';
const Layout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    
    
    
    
    return (
        <div className="min-h-screen bg-black h-full">
        {children}
        </div>
    );
};

export default Layout;