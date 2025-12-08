'use client';
import { useState, useRef } from 'react';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';
import i18n from "@/libs/localize/localize";

const Newsletter = ({ backgroundColor }: { backgroundColor?: string }) => {
    const emailRegex = /\S+@\S+\.\S+/;

    const [email, setEmail] = useState<string>("");
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const { t } = i18n;

    const fireButtonConfetti = () => {
        if (!buttonRef.current) return;

        const rect = buttonRef.current.getBoundingClientRect();

        confetti({
            particleCount: 120,
            spread: 60,
            startVelocity: 30,
            origin: {
                x: (rect.left + rect.width / 2) / window.innerWidth,
                y: (rect.top + rect.height / 2) / window.innerHeight,
            },
        });
    };

    const subscribe = async () => {
        try {
            if (!email || email === "") return;
            if (!emailRegex.test(email)) return;

            const response = await axiosInstance.post("/api/contact/subscription", { email });

            toast.success(response.data.message);

            // 🎉 Buton çevresinde mini confetti patlat
            fireButtonConfetti();

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={"py-16 px-6" + (backgroundColor ? " " + backgroundColor : " bg-base-200")}>
            <div className="max-w-5xl mx-auto text-center">
                <h2 className="text-5xl font-bold mb-6">{t("newsletter.title")}</h2>
                <p className="text-base">{t("newsletter.description")}</p>

                <div className="mt-12 flex items-center overflow-hidden rounded-md max-w-xl mx-auto">
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder={t("newsletter.email_placeholder")}
                        className="w-full bg-transparent py-3.5 px-4 text-base focus:outline-none bg-base-100 border border-primary rounded"
                    />

                    <button
                        ref={buttonRef}
                        onClick={subscribe}
                        className="button bg-primary text-white text-base font-bold rounded-r-md h-12 px-6 border-primary border-l-0"
                    >
                        {t("newsletter.subscribe")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Newsletter;
