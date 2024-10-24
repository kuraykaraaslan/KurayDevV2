import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faCode } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import Menu from '../Menu';
import ThemeButton from './Partials/ThemeButton';
import Secondary from '../Menu/Secondary';

import dynamic from 'next/dynamic';
const AuthButton = dynamic(
    () => import('./Partials/AuthButton'),
    { ssr: false }
);

const Navbar = () => {
    return (
        <div className="fixed top-0 w-full md:px-6 md:pt-4"
            style={{ zIndex: 10 }}>
            <div className="navbar bg-base-300 w-full md:rounded-full md:shadow-lg">
                <div className="flex-none lg:hidden">
                    <label htmlFor="my-drawer" aria-label="open sidebar" className="btn btn-square btn-ghost">
                        <FontAwesomeIcon
                            icon={faBars}
                            style={{ width: "24px", height: "24px" }}
                        />
                    </label>
                </div>
                <div className="mx-2 flex-1 px-2 text-lg font-semibold">
                    <Link href="/" className="btn btn-ghost md:rounded-full">
                        <FontAwesomeIcon icon={faCode} className="w-6 h-6" />
                        <span className='text-lg'>kuray.dev</span>
                    </Link>
                    <div className="items-center gap-2 ml-1">
                        <ThemeButton />
                    </div>
                </div>
                <div className="hidden flex-none lg:block">
                    <ul className="menu menu-horizontal gap-1">
                        {/* Navbar menu content here */}
                        <Menu />
                        <div className="inline-block h-[36px] min-h-[1em] w-0.5 self-stretch bg-primary bg-opacity-50 mx-1" />
                        <Secondary />
                        <AuthButton />                            
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Navbar;