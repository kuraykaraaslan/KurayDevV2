'use client';
import React, { useState } from 'react';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';



const Newsletter = ({ backgroundColor }: { backgroundColor?: string }) => {

    const emailRegex = /\S+@\S+\.\S+/;

    const [email, setEmail] = useState<string>("");

    const subscribe = async () => {
        try {

            if (!email || email === "") {
                return;
            }

            if (!emailRegex.test(email)) {
                return;
            }

            await axiosInstance.post("/api/contact/subscription", { email }).then((response) => {
                toast.success(response.data.message);
            });

        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className={"py-16 px-6" + (backgroundColor ? " " + backgroundColor : " bg-base-200")}>
            <div className="max-w-5xl mx-auto text-center">
                <h2 className="text-5xl font-bold mb-6">Subscribe to my newsletter</h2>
                <p className="text-base">Stay up to date! Get all the latest & greatest posts delivered straight to your inbox</p>
                <div className="mt-12 flex items-center overflow-hidden rounded-md max-w-xl mx-auto">
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email" placeholder="Enter your email" className="w-full bg-transparent py-3.5 px-4 text-base focus:outline-none bg-base-100 border border-primary focus:border-primary rounded p-12" />
                    <button
                        onClick={subscribe}
                        className="button bg-primary text-white text-base font-bold rounded-r-md h-12 px-6 border-primary border-l-0">
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Newsletter;