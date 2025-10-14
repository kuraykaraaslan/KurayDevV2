'use client';
import React from 'react';
import Menu from '../Menu';

const Sidebar = () => {
  
  return (
    <div className="drawer-side"
      style={{ zIndex: 8 }}>
      <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
      <ul className="menu bg-base-200 w-80 pt-20 h-full">
        {/* Sidebar content here */}
        <Menu isSidebar={true} />
      </ul>
    </div>
  );
};

export default Sidebar;