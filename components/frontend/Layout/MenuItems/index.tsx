import { faShield } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {MenuItem} from '@/types/ui/UITypes';

const MenuItems = [
        { id: "home", page: '/', name: 'home', external: false, onlyAdmin: false, hideTextOnDesktop: false },
        { id: "portfolio", page: '/', name: 'portfolio', external: false, onlyAdmin: false, hideTextOnDesktop: false },
        //{ id: "timeline", page: '/', name: 'experience', external: false, onlyAdmin: false, hideTextOnDesktop: false },
        { id: "contact", page: '/#contact', name: 'contact', external: false, onlyAdmin: false, hideTextOnDesktop: false },
        { id: null, page: '/blog', name: 'blog', external: false, onlyAdmin: false, hideTextOnDesktop: false },
        //{ id: "freelance", page: '/freelance', name: 'freelance', external: false, onlyAdmin: false, hideTextOnDesktop: false },
        { id: "backend", page: '/admin', name: 'backend', external: false, onlyAdmin: true, hideTextOnDesktop: true, icon: faShield, textColour: 'text-primary' },
        { id: "github", page: 'https://github.com/kuraykaraaslan', name: 'github', external: true, onlyAdmin: false, hideTextOnDesktop: true, icon: faGithub },
        //{ id: "linkedin", page: 'https://www.linkedin.com/in/kuraykaraaslan/', name: 'linkedin', external: true, onlyAdmin: false, hideTextOnDesktop: true, icon: faLinkedin, textColour: 'text-[#0a66c2]' },
        //{ id: "resume", page: 'https://drive.google.com/file/d/17Ya5AC2nvcvccN-bS2pFsKFIm5v8dcWN/view', name: 'resume', external: true, onlyAdmin: false, hideTextOnDesktop: true, icon: faFilePdf, textColour: 'text-[#b24020]' },
    ] as MenuItem[];

export default MenuItems;