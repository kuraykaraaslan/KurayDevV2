import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <div className="absolute bottom-0 right-0">
                <div className="flex flex-col justify-between items-center p-4">
                    <div className="text-sm text-base-500">Made with ❤️ by Kuray Karaaslan</div>
                </div>
            </div>
    );
};

export default Footer;