'use client';
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Menu from '../Menu';
import dynamic from 'next/dynamic';
import Logo from '@/components/common/Logo';
import ReadingProgressBar from '../ReadingProgressBar';
import SearchButton from './Partials/SearchButton';
import { MenuItem } from '@/types/UITypes';

const AuthButton = dynamic(
    () => import('./Partials/AuthButton'),
    { ssr: false }
);

const LanguageModal = dynamic(
    () => import('./Partials/LanguageModal'),
    { ssr: false }
);

const ThemeButton = dynamic(
    () => import('./Partials/ThemeButton'),
    { ssr: false }
);


const Navbar = ({ menuItems }: { menuItems: MenuItem[] }) => {
    const [isTopReached, setIsTopReached] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (window?.scrollY > 40) {
                setIsTopReached(false);
            } else {
                setIsTopReached(true);
            }
        };

        window?.addEventListener("scroll", handleScroll);

        return () => {
            window?.removeEventListener("scroll", handleScroll);
        };
    }
        , []);



    const scrollTo100IfNot = () => {
        if (window?.scrollY < 60) {
            window?.scrollTo(0, 60);
        }
    }


    return (
        <div
            className={"fixed top-0 z-50 w-full transition-all duration-300 ease-in-out " +
                (isTopReached ? " pl-2  sm:px-6 lg:px-8 pt-3 pb-6" : " px-0 pt-0 pb-6")}

            style={{ zIndex: 60, width: "100%" }}
        >
            <div
                className={
                    "navbar rounded-full shadow-lg border border-base-200 self-center	" +
                    (isTopReached ? " rounded-full bg-transparent backdrop-blur-lg" : " rounded-none from-base-100 to-base-300 bg-gradient-to-b")
                }
            >
                <div className="flex-none xl:hidden">
                    <label htmlFor="my-drawer" aria-label="open sidebar" className="btn btn-circle btn-ghost" onClick={scrollTo100IfNot}>
                        <FontAwesomeIcon
                            icon={faBars}
                            style={{ width: "24px", height: "24px" }}
                        />
                    </label>
                </div>
                <div className="mx-2 flex-1 px-2 text-lg font-semibold">
                    <Logo />

                    <div className="flex items-center gap-2">
                        <ThemeButton />
                        <LanguageModal />
                        <SearchButton />

                    </div>
                </div>
                <div className="hidden flex-none xl:block">
                    <ul className="menu menu-horizontal gap-1 hidden lg:flex">
                        {/* Navbar menu content here */}
                        <Menu menuItems={menuItems} />
                    </ul>
                </div>
                <div className="">
                    <ul className="menu menu-horizontal gap-1">
                        <AuthButton />
                    </ul>
                </div>
            </div>
            <ReadingProgressBar />

        </div >
    );
};

export default Navbar;