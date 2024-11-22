import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faLinkedin} from '@fortawesome/free-brands-svg-icons';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

const Secondary = () => {

    const items = [
        { id: 8, name: 'GitHub', link: 'https://github.com/kuraykaraaslan', icon: faGithub },
        { id: 9, name: 'LinkedIn', link: 'https://www.linkedin.com/in/kuraykaraaslan/' , icon: faLinkedin },
        { id: 10, name: 'Resume', link: 'https://drive.google.com/file/d/17Ya5AC2nvcvccN-bS2pFsKFIm5v8dcWN/view', icon: faFilePdf }
    ];


    return (
            <>
                {items.map(item => (
                    <li key={item.id} className="hidden xl:flex">
                        <Link href={item.link} target="_blank" className="flex items-center rounded-lg py-2 px-4 text-gray-600 hover:bg-gray-100 hover:text-gray-800">
                        <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                        <span className="ml-2 md:hidden">{item.name}</span>
                        </Link>
                    </li>
                ))}
            </>
    );
};

export default Secondary;