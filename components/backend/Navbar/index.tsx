'use client';
import { faBars, faCaretDown, faTicket, faUser, faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react"
import {createHash} from "crypto";

import ThemeButton from "./Partials/ThemeButton";

const Navbar = () => {

    const { data: session } = useSession()

    const user = session?.user;
    const email = user?.email;
    const hash = createHash('sha256').digest('hex');
    const gravitarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon`;


    const [isFeaturesMenuOpen, setIsFeaturesMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleFeaturesMenu = () => {
        setIsFeaturesMenuOpen(!isFeaturesMenuOpen);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const menu = [
        {
            name: "Home",
            href: "/",
        },
        {
            name: "Categories",
            href: "/backend/categories",
        },
        {
            name: "Posts",
            href: "/backend/posts",
        },
        {
            name: "Users",
            href: "/backend/users",
        },
        {
            name: "Settings",
            href: "/backend/settings",
        }
    ];

    return (
        <>
        <div className="">
            <nav className="mx-auto flex items-stretch items-center justify-between lg:px-8 bg-base-300 text-primary" aria-label="Global">
                <div className="py-4 pl-4 lg:pl-0 flex items-center gap-2">
                    <Link href="/backend" className="flex items-center">
                        <FontAwesomeIcon icon={faCode} className="w-8 h-8 mr-2" />
                        <span className="text-2xl font-bold">kuray.dev</span>
                    </Link>
                    <ThemeButton />
                </div>
                <div className="flex lg:hidden">
                    <button type="button" className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 p-6 mr-2" aria-controls="mobile-menu" aria-expanded="false" onClick={toggleMobileMenu}>
                        <span className="sr-only">Open main menu</span>
                        <FontAwesomeIcon
                            icon={faBars}
                            className="h-6 w-6"
                            aria-hidden="true"
                        />
                    </button>
                </div>
                <div className="hidden lg:flex lg:flex-1 lg:justify-center">
                    {menu.map((item, index) => (
                        <Link key={index} href={item.href} className="relative group inline-flex items-center justify-center text-base font-medium px-6">
                            <div className="text-sm leading-6">{item.name}</div>
                        </Link>
                    ))}
                </div>
                <div className="hidden lg:flex lg:justify-end justify-center items-center">
                    <Link href="#" className="flex items-center justify-center border-2 border-primary rounded-full">
                        <img src={session?.user?.image ? session?.user?.image : gravitarUrl} alt="User Image" className="w-12 h-12 rounded-full" />
                    </Link>
                </div>
            </nav>
        </div>
        {/* Mobile menu, show/hide based on mobile menu state. with dimming overlay */}
        <div className={`${isMobileMenuOpen ? "block" : "hidden"} lg:hidden`} id="mobile-menu" style={{ position: "fixed" , zIndex: 100}}>
            <div className="fixed inset-0 z-40 flex">
                <div className="fixed inset-0" onClick={toggleMobileMenu}>
                    <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
                </div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center justify-center">
                            <Link href="/backend" className="flex items-center">
                                <FontAwesomeIcon icon={faCode} className="text-primary w-8 h-8 mr-2" />
                                <span className="text-primary text-2xl font-bold">kuray.dev</span>
                            </Link>
                        </div>
                        <nav className="mt-5 px-2 space-y-1">
                            {menu.map((item, index) => (
                                <Link key={index} href={item.href} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-50">
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex justify-center pb-4">
                        <Link href="/auth/login" className="btn text-sm font-semibold leading-6 bg-primary text-base rounded-s">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
        </>

    )
};

export default Navbar;