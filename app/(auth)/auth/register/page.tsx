'use client';
import axiosInstance from '@/libs/axios';
import { faInstagram, faTiktok, faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';


const RegisterPage = () => {    
    
    const emailRegex = /\S+@\S+\.\S+/;
    const passwordRegex = /^.{6,}$/;

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmpassword, setConfirmpassword] = useState<string>("");



    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        
        if (!email) {
            return;
        }

        if (!password) {
            return;
        }

        if (!confirmpassword) {
            toast.error("Please confirm your password.");
        }

        if (typeof email !== "string") {
            return;
        }

        if (typeof password !== "string") {
            return;
        }

        if (typeof confirmpassword !== "string") {
            return;
        }

        if (!emailRegex.test(email)) {
            toast.error("Invalid email address.");
            return;
        }

        if (!passwordRegex.test(password)) {
            toast.error("Password must contain at least 6 characters.");
            return;
        }

        if (password !== confirmpassword) {
            toast.error("Passwords do not match.");
            return;
        }

        toast.success("Registering...");

        const res = await axiosInstance.post(`/api/auth/register`, {
            email: email,
            password: password
        }).then((res) => {
            if (res.data.error) {
                toast.error(res.data.error);
                console.log(res.data.error);
            } else {
                toast.success(res.data.message);
            }
        }
        ).catch((err) => {
            console.log(err.response.data.error);
            toast.error(err.response.data.error);
        });

        
    }

    return (
        <>
            <div className="space-y-3">
                <div>
                    <Link href="/auth/login"
                        type="button"
                        className="block w-full py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md"
                    >
                        <span className="flex items-center justify-center">
                           Login
                        </span>
                    </Link>
                </div>
                <div className="flex items-center justify-center">
                    <span className="text-sm text-gray-400 font-semibold">Or</span>
                </div>
                <div>
                    <div className="">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={email as string}
                            onChange={(e) => setEmail(e.target.value)}
                            pattern='[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$'
                            placeholder="Email address"
                            className={"block w-full rounded-lg border-0 py-1.5 shadow-sm ring-1 ring-inset placeholder:text-primary sm:text-sm sm:leading-6 h-12"}
                        />
                    </div>
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
                        className="block w-full py-2.5 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
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