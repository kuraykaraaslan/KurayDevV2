'use client';
import { OTPMethod } from '@/types/UserSecurityTypes';
import axiosInstance from '@/libs/axios';
import { SafeUserSecurity, SafeUserSecurityDefault } from '@/types/UserSecurityTypes';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { useState, MouseEvent } from 'react';
import { toast } from 'react-toastify';


const OTPPage = () => {   
    
    const [userSecurity, setUserSecurity] = useState<SafeUserSecurity>(SafeUserSecurityDefault);
    const [otpMethod, setOtpMethod] = useState<OTPMethod | null>(null);

    const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
        
    }

    return (
        <>
            <div className="space-y-3">
                <div>
                    <div className="">
                        
                </div>
                <div>
                    <div className="flex items-center justify-between">
                    </div>
                    <div className="relative">
                        <Link className="absolute inset-y-0 right-2 pl-3 flex items-center pointer-events-none" href="/auth/forgot-password">
                            <FontAwesomeIcon icon={faQuestion} className="h-5 w-5 text-primary" aria-hidden="true" />
                        </Link>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password as string}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Password"
                            className={"block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12"}
                        />
                    </div>
                </div>
                 
                <div>
                    <div className="flex items-center justify-between">
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            name="confirmpassword"
                            type="password"
                            required
                            value={confirmpassword as string}
                            onChange={(e) => setConfirmpassword(e.target.value)}
                            autoComplete="current-password"
                            placeholder="Confirm Password"
                            className={"block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12"}
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
                    >
                        Create Account
                    </button>
                </div>

            
            </div>
        </>
    );
};

RegisterPage.layout = "auth";

export default RegisterPage;