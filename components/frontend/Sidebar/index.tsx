'use client';
import React from 'react';
import styles from './Sidebar.module.css';
import Menu from '../Menu';
import Secondary from '../Menu/Secondary';


const Sidebar = () => {
  return (
    <div className="drawer-side"
      style={{ zIndex: 8 }}>
      <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
      <ul className="menu bg-base-200 w-80 pt-20 h-full">
        {/* Sidebar content here */}
        <Menu />
        <hr
          className="my-3 h-px border-t-0 bg-primary bg-opacity-50" />
        <Secondary />
      </ul>
    </div>
  );
};

export default Sidebar;