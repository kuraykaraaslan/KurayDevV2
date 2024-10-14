import React from 'react';
import Link from 'next/link';

const Menu = () => {

    const items = [
        { id: 1, name: 'Home', link: '/' },
        { id: 3, name: 'Experience', link: '/portfolio' },
        { id: 4, name: 'Projects', link: '/projects' },
        { id: 5, name: 'Blog', link: '/blog' },
        { id: 6, name: 'Freelance', link: '/freelance' },
        { id: 7, name: 'Contact', link: '/contact' },
    ];


    return (
            <>
                {items.map(item => (
                    <li key={item.id}>
                        <Link href={item.link}>{item.name}</Link>
                    </li>
                ))}
            </>
    );
};

export default Menu;