'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useGlobalStore } from '@/libs/zustand';
import i18n from "@/libs/localize/localize";
import {  IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MenuItem from '@/types/MenuItem';
import MenuItems from '../MenuItems';

const Menu = ({isSidebar = false}) => {

    const { t } = i18n;

    const router = useRouter();
    const pathname = usePathname();

    const { user } = useGlobalStore();
    const isAdmin = user?.userRole === 'ADMIN' || user?.userRole === 'SUPER_ADMIN';

    const getYpositionOfElementById = (id: string) => {
        const additionalOffset = 100;
        const element = document.getElementById(id);

        if (element) {
            return element.getBoundingClientRect().top + window?.scrollY - additionalOffset;
        }
        return null;
    }

    const scrollOrRedirect = (item: MenuItem) => {

        if (item.external) {
            window?.open(item.page, '_blank');
            return;
        }


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
                    window?.scrollTo({ top: yPosition, behavior: 'smooth' });
                }

            }, 700);

            return;
        }

        window?.scrollTo({ top: yPosition, behavior: 'smooth' });

    }


    return (
        <>
            {MenuItems.map((item) => (
                <li key={item.id}
                    style={{ display: item.onlyAdmin && !isAdmin ? 'none' : 'block', 
                        
                    marginLeft: '1px', marginTop: '4px' }}
                    onClick={() => scrollOrRedirect(item)}

                    className={(item.textColour ? item.textColour : "text-base-content") + " " + (item.backgroundColour ? item.backgroundColour : " ") + " rounded-md"}>
                    <div className="flex items-center gap-2">
                        {item.icon && <FontAwesomeIcon icon={item.icon as IconDefinition} className="w-4 h-4" />}
                        <span className={(item.hideTextOnDesktop && !isSidebar ? 'hidden' : 'block')} >{t("navigation." + item.name)}</span>
                    </div>
                </li>
            ))}
        </>
    );
};

export default Menu;