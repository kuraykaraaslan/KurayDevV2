'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/libs/zustand';
import i18n from "@/libs/localize/localize";

const Menu = () => {


    const { t } = i18n;

    const router = useRouter();
    const pathname = usePathname();

    const { session } = useAuthStore();

    const user = session?.user;
    const isAdmin = user?.role === "ADMIN";

    const getYpositionOfElementById = (id: string) => {
        const additionalOffset = 100;
        const element = document.getElementById(id);

        if (element) {
            return element.getBoundingClientRect().top + window.scrollY - additionalOffset;
        }
        return null;
    }

    const scrollOrRedirect = (item: { id: string | null, page: string, name: string }) => {
        const { id, page } = item;
        if (!id) {
            router.push(page); // Use the 'page' field for navigation
            return;
        }
        const yPosition = getYpositionOfElementById(id);

        if (yPosition === null) {
            const currentPage = pathname;

            router.push(page); // Use the 'page' field for navigation
            // wait for the page to load and try again maks 2 seconds
            setTimeout(() => {
                const yPosition = getYpositionOfElementById(id);
                if (yPosition !== null) {
                    window.scrollTo({ top: yPosition, behavior: 'smooth' });
                }

            }, 700);

            return;
        }

        window.scrollTo({ top: yPosition, behavior: 'smooth' });

    }


    const itemsWithScroll = [
        { id: "home", page: '/', name: 'home' },
        { id: "portfolio", page: '/', name: 'portfolio' },
        { id: "timeline", page: '/', name: 'experience' },
        { id: "contact", page: '/#contact', name: 'contact' },
        { id: null, page: '/blog', name: 'blog' },
        { id: "freelance", page: '/freelance', name: 'freelance' },
    ];

    return (
        <>
            {itemsWithScroll.map(item => (
                <li key={item.id}>
                    <button onClick={() => scrollOrRedirect(item)}>{t('navigation.' + item.name)}</button>
                </li>
            ))}
            {isAdmin && (
                <li>
                    <Link href="/backend" className="flex items-center rounded-lg py-2 px-4 text-base-100 bg-primary hover:text-gray-800">
                        <span>{t('navigation.backend')}</span>
                    </Link>
                </li>
            )}
        </>
    );
};

export default Menu;