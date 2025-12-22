'use client';
import { faBars, faCode } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import Link from "next/link";
import ThemeButton from "./Partials/ThemeButton";
import { useRouter } from "next/navigation";
import Logo from "@/components/common/Layout/Logo";

import dynamic from "next/dynamic";

const NavbarAuthButton = dynamic(
    () => import('@/components/common/UI/Navigation/NavbarAuthButton'),
    { ssr: false }
);

const Navbar = () => {

    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const menu = [
        {
            name: "Home",
            href: "/admin",
        },
        {
            name: "Projects",
            href: "/admin/projects",
        },
        {
            name: "Categories",
            href: "/admin/categories",
        },
        {
            name: "Posts",
            href: "/admin/posts",
        },
        {
            name: "Comments",
            href: "/admin/comments",
        },
        {
            name: "Users",
            href: "/admin/users",
        },
        {
            name: "Slots",
            href: "/admin/slots",
        },
        {
            name: "Settings",
            href: "/admin/settings",
        },
        {
            name: "Logout",
            href: "/auth/logout",
        }
    ];

    return (
        <>
            <div className="">
                <nav className="relative mx-auto h-16 flex items-stretch items-center justify-between lg:px-8 from-base-100 to-base-300 bg-gradient-to-b shadow-lg text-primary" aria-label="Global">
                    <div className="py-4 pl-4 lg:pl-0 flex items-center gap-2">
                        <Logo href="/admin" />
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
                        <NavbarAuthButton />
                    </div>
                </nav>
            </div>
            {/* Mobile menu, show/hide based on mobile menu state. with dimming overlay */}
            <div className={`${isMobileMenuOpen ? "block" : "hidden"} lg:hidden`} id="mobile-menu" style={{ position: "fixed", zIndex: 100 }}>
                <div className="fixed inset-0 z-40 flex">
                    <div className="fixed inset-0" onClick={toggleMobileMenu}>
                        <div className="absolute inset-0 bg-base-200 opacity-75"></div>
                    </div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-base-100">
                        <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                            <div className="flex items-center justify-center">
                                <Link href="/admin" className="flex items-center">
                                    <FontAwesomeIcon icon={faCode} className="text-primary w-8 h-8 mr-2" />
                                    <span className="text-primary text-2xl font-bold">kuray.dev</span>
                                </Link>
                            </div>
                            <nav className="mt-5 px-2 space-y-1">
                                {menu.map((item, index) => (
                                    <button key={index} className="block px-3 py-2 rounded-md text-base font-medium"
                                        onClick={() => {
                                            router.push(item.href);
                                            toggleMobileMenu();
                                        }}>
                                        {item.name}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

        </>

    )
};

export default Navbar;