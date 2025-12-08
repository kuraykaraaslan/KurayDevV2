import { faGithub, faInstagram, faLinkedin, faTiktok, faTwitch, faXTwitter, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faSnowman } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';

const links = [
  { href: '/', title: 'Blog' , icon: faSnowman, color: 'bg-primary', textColor: 'text-white'},
  { href: 'https://github.com/kuraykaraaslan', title: 'Github', icon: faGithub, color: 'bg-[#333]', textColor: 'text-white'},
  { href: 'https://linkedin.com/in/kuraykaraaslan', title: 'Linkedin', icon: faLinkedin, color: 'bg-[#0077b5]', textColor: 'text-white'},
  { href: 'https://www.youtube.com/channel/UC-EzbpSWTrO97CejgrUyQXQ', title: 'Youtube', icon: faYoutube, color: 'bg-[#FF0000]', textColor: 'text-white'},
  { href: 'https://www.instagram.com/kuraykaraaslan/', title: 'Instagram', icon: faInstagram, color: 'bg-[#E1306C]', textColor: 'text-white'},
  { href: 'https://x.com/kuraykaraaslan', title: 'X', icon: faXTwitter, color: 'bg-black', textColor: 'text-white'},
  { href: 'https://www.twitch.tv/kuraykaraaslan', title: 'Twitch', icon: faTwitch, color: 'bg-[#6441A4]', textColor: 'text-white'},
  { href: 'https://www.tiktok.com/@kuraykaraaslan', title: 'Tiktok', icon: faTiktok, color: 'bg-[#000000]', textColor: 'text-white'},

];


export default function MyLinks() {
  return (
    <div className="p-4 rounded-lg shadow-md space-y-3">
        {links.map((link, index) => (
          <Link href={link.href} key={index}
           className={`btn btn-block space-x-2 font-bold py-0 text-sm ${link.color} ${link.textColor}`}>
            <FontAwesomeIcon icon={link.icon} className="w-4 h-4" />
            <span>{link.title}</span>
          </Link>
        ))}
    </div>
  );
}
