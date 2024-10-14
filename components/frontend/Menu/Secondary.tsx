import React from 'react';
import Link from 'next/link';

const Secondary = () => {

    const items = [
        { id: 8, name: 'GitHub', link: 'https://github.com/kuraykaraaslan' },
        { id: 9, name: 'LinkedIn', link: 'https://www.linkedin.com/in/kuraykaraaslan/' },
        { id: 10, name: 'Resume', link: 'https://drive.google.com/file/d/17Ya5AC2nvcvccN-bS2pFsKFIm5v8dcWN/view' }
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

export default Secondary;