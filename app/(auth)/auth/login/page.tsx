'use client';
import axiosInstance from '@/libs/axios';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useGlobalStore } from '@/libs/zustand';
import { useRouter } from 'next/navigation';

const LoginPage = () => {

    const emailRegex = /\S+@\S+\.\S+/;
    const passwordRegex = /^.{6,}$/;

    const [email, setEmail] = useState<String>("");
    const [password, setPassword] = useState<String>("");

    const { setUser } = useGlobalStore();

    const router = useRouter();


    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        if (!email) {
            return;
        }

        if (!password) {
            return;
        }

        if (typeof email !== "string") {
            toast.error("Invalid email address.");
            return;
        }

        if (typeof password !== "string") {
            toast.error("Password must contain at least 6 characters.");
            return;
        }

        if (!emailRegex.test(email)) {
            toast.error("Invalid email address.");
            return;
        }

        if (!passwordRegex.test(password)) {
            toast.error("Password must contain at least 8 characters, one uppercase, one lowercase, one number.");
            return;
        }

        await axiosInstance.post(`/api/auth/login`, {
            email: email,
            password: password
        }).then(async (res) => {
            if (res.data.error) {
                toast.error(res.data.error);
            } else {
                toast.success(res.data.message);
            }

            const { user } = res.data;
            setUser(user);

            router.push("/");
        }
        ).catch((err) => {
            console.error(err);
            toast.error(err.response.data.error);
        });



    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <Link href="/auth/register"
                        type="button"
                        className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
                    >
                        <span className="flex items-center justify-center">
                            Create an account
                        </span>
                    </Link>
                </div>
                <div className="flex items-center justify-center">
                    <span className="text-sm font-semibold">Or</span>
                </div>
                <div>
                    <div className="mt-2">
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
                    <div className="relative mt-2">
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
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={!email || !password}
                        className="block w-full py-2.5 bg-primary font-semibold rounded-lg shadow-md text-white"
                    >
                        Sign in
                    </button>
                </div>

            </div>
        </>
    );
};

LoginPage.layout = "auth";

export default LoginPage;