import { faFilePdf, faShield } from '@fortawesome/free-solid-svg-icons';
import { faGithub, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import MenuItem from '@/types/MenuItem';

const MenuItems = [
        { id: "home", page: '/', name: 'home' },
        { id: "portfolio", page: '/', name: 'portfolio' },
        { id: "timeline", page: '/', name: 'experience' },
        { id: "contact", page: '/#contact', name: 'contact' },
        { id: null, page: '/blog', name: 'blog' },
        //{ id: "freelance", page: '/freelance', name: 'freelance' },
        { id: "backend", page: '/backend', name: 'backend' , onlyAdmin: true , hideTextOnDesktop: true , icon: faShield , textColour: 'text-primary' },
        { id: "github", page: 'https://github.com/kuraykaraaslan', name: 'github', external: true , icon: faGithub , hideTextOnDesktop: true },
        { id: "linkedin", page: 'https://www.linkedin.com/in/kuraykaraaslan/', name: 'linkedin', external: true , icon: faLinkedin , hideTextOnDesktop: true , textColour: 'text-[#0a66c2]' },
        { id: "resume", page: 'https://drive.google.com/file/d/17Ya5AC2nvcvccN-bS2pFsKFIm5v8dcWN/view', name: 'resume', external: true , icon: faFilePdf , hideTextOnDesktop: true , textColour: 'text-[#b24020]' },
    ] as MenuItem[];

export default MenuItems;