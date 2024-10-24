'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode, faSnowman } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePathname } from 'next/navigation';


export default function AuthLayout({ children, title }: { children: React.ReactNode, title: string }) {

  //Create a context to store the user's authentication status

  const pathname = usePathname();

  const titles = [
    {
      path: '/auth/login',
      title: 'Sign In'
    }
  ]

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-red min-h-screen">
        <div className="sm:mx-auto w-full sm:max-w-sm">
          <Link className="flex items-center justify-center select-none" href="/">
            <FontAwesomeIcon icon={faCode} className="w-12 h-12 mr-2" style={{ width: '3rem', height: '3rem' }} />
            <span className="text-3xl font-bold">kuray.dev</span>
          </Link>
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
            {titles.map((titleObj) => {
              if (pathname === titleObj.path) {
                return titleObj.title
              }
              return null;
            })}
          </h2>
        </div>

        <div className="mt-10 mx-auto w-full sm:max-w-sm bg-base-200 p-4 rounded-md shadow-md">
          {children}
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
         This application does not allow registration.
        </p>
      </div>
      <ToastContainer />
    </>
  )
}
