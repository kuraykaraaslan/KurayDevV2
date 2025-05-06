'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Link from 'next/link';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { usePathname } from 'next/navigation';
import { faCode } from '@fortawesome/free-solid-svg-icons';
import { Suspense } from 'react';
import SSOLogin from '@/components/auth/SSOLogin';


export default function AuthLayout({ children, title }: { children: React.ReactNode, title: string }) {

  //Create a context to store the user's authentication status

  const pathname = usePathname();

  const titles = [
    {
      path: '/auth/login',
      title: 'Welcome back!'
    },
    {
      path: '/auth/register',
      title: 'Create an account'
    },
    {
      path: '/auth/forgot-password',
      title: 'Forgot Password'
    },
    {
      path: '/auth/reset-password',
      title: 'Reset Password'
    },
    {
      path: '/auth/logout',
      title: 'Logging out...'
    }
  ]

  return (
    <Suspense>
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-200">
        <div className="rounded-lg shadow-md w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 min-h-screen md:min-h-[600px] rounded-lg shadow-md bg-base-100 border border-base-300">
          <div className="col-span-1 hidden md:block rounded-l-lg">
            <div className="flex flex-col items-center justify-center  rounded-l-lg" style={{
              backgroundImage: 'url(/assets/img/kuraykaraaslan.jpg)',

              backgroundSize: 'cover', backgroundPosition: 'center', height: '100%'
            }}>
            </div>
          </div>
          <div className="col-span-1 flex flex-col items-center justify-center w-full p-8 pt-0">
            <div className="flex items-center justify-center mb-3">
              <Link href="/" className="flex items-center justify-center space-x-2 font-bold text-4xl">
                <FontAwesomeIcon icon={faCode} className="w-8 h-8" />
                <span className='text-xl'>kuray.dev</span>
              </Link>
            </div>
            <h1 className="text-2xl font-bold text-center mb-4">{titles?.find((item) => pathname?.startsWith(item.path))?.title}</h1>
            <div className="w-full">
              {children}
              <div className="flex items-center justify-center mt-4 mb-4">
                <span className="text-sm font-semibold">Or</span>
              </div>
              <SSOLogin />
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </Suspense>
  )
}
