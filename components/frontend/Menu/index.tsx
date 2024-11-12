'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/libs/zustand';

const Menu = () => {

    const router = useRouter();
    const { session } = useAuthStore();

    const user = session?.user;
    const isAdmin = user?.role === "ADMIN";

    const getYpositionOfElementById = (id : string) => {
        const additionalOffset = 100;
        const element = document.getElementById(id);
        
        if (element) {
            return element.getBoundingClientRect().top + window.scrollY - additionalOffset;
        }
        return null;
    }

    const scrollOrRedirect = (item : { id: string, page: string, name: string }) => {
        const { id, page } = item;
        const yPosition = getYpositionOfElementById(id);
        console.log(yPosition);

        if (yPosition === null) {
            router.push(page); // Use the 'page' field for navigation
            return;
        } 
           
        window.scrollTo({ top: yPosition, behavior: 'smooth' });
        
    }
    

    const itemsWithScroll = [
        { id: "home", page: '/' , name: 'Home'},
        { id: "portfolio", page: '/', name: 'Portfolio'},
        { id: "timeline", page: '/', name: 'Experience'},
        { id: "contact", page: '/#contact', name: 'Contact'},
        { id: "blog", page: '/blog', name: 'Blog'},
        { id: "freelance", page: '/freelance', name: 'Freelance'},
    ];

    return (
            <>
                {itemsWithScroll.map(item => (
                    <li key={item.id}>
                       <button onClick={() => scrollOrRedirect(item)}>{item.name}</button>
                    </li>
                ))}
                {isAdmin && (
                    <li>
                        <Link href="/backend" className="flex items-center rounded-lg py-2 px-4 text-base-100 bg-primary hover:text-gray-800">
                            Backend
                        </Link>
                    </li>
                )}
            </>
    );
};

export default Menu;