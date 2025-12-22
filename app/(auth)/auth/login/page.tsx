'use client';
import axiosInstance from '@/libs/axios';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Link from 'next/link';
import { MouseEvent, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useGlobalStore } from '@/libs/zustand';
import { useRouter, useSearchParams } from 'next/navigation';
import { OTPActionEnum, OTPMethod } from '@/types/UserSecurityTypes';
import OTPConfirmModal from '@/components/frontend/Features/Settings/Tabs/OTPTab/partials/OTPConfirmModal';

const LoginPage = () => {

    const emailRegex = /\S+@\S+\.\S+/;
    const passwordRegex = /^.{6,}$/;

    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const { setUser } = useGlobalStore();

    const router = useRouter();
    const searchParams = useSearchParams();

    const [_availableMethods, setAvailableMethods] = useState<OTPMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<OTPMethod | null>(null);

    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);


    const otpInputRef = useRef<HTMLInputElement>(null);



    const handleSubmit = async (e: MouseEvent<HTMLButtonElement>) => {
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
            email,
            password,
        }).then(async (res) => {

            const userSecurity = res.data.userSecurity;

            console.log('userSecurity', userSecurity);

            const { user } = res.data;
            setUser(user);

            if (userSecurity.otpMethods.length > 0) {
                setAvailableMethods(userSecurity.otpMethods);
                setSelectedMethod(userSecurity.otpMethods[0]);
                setOtpModalOpen(true);
                return;
            }
            toast.success('Login successful');
            router.push('/');

        }).catch((err) => {
            toast.error(err.response?.data?.error || 'Login failed');
        });




    }

    const onSentOtp = async () => {
        if (!selectedMethod) return;

        try {
            setSendingOtp(true);
            await axiosInstance.post('/api/auth/login/send', {
                method: selectedMethod,
                action: OTPActionEnum.Enum.authenticate,
            });
            setOtpSent(true);
            toast.success('OTP gönderildi');
            setTimeout(() => otpInputRef.current?.focus(), 100);
        } catch {
            toast.error('OTP gönderilemedi');
        } finally {
            setSendingOtp(false);
        }
    }

    const onVerifyOtp = async () => {
        if (!selectedMethod) return;

        try {
            setVerifyingOtp(true);

            console.log('Verifying OTP with method:', selectedMethod, 'and code:', otpCode);

            await axiosInstance.post('/api/auth/login/verify', {
                method: selectedMethod,
                otpToken: otpCode,
                action: OTPActionEnum.Enum.authenticate,
            }).then(() => {
                toast.success('OTP doğrulandı');
                router.push(searchParams.get('redirect') || '/');
            });

        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'OTP doğrulanamadı');
        } finally {
            setVerifyingOtp(false);
        }
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
                        <Link className="absolute inset-y-0 right-2 pl-3 flex items-center" href="/auth/forgot-password">
                            <button
                                type="button"
                                className="text-primary hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-md text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faQuestion} />
                            </button>
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

            <OTPConfirmModal
                open={otpModalOpen}
                otpSent={otpSent}
                otpCode={otpCode}
                sendingOtp={sendingOtp}
                verifying={verifyingOtp}
                otpInputRef={otpInputRef as React.RefObject<HTMLInputElement>}

                onSendOtp={onSentOtp}
                onVerify={onVerifyOtp}
                onChangeCode={setOtpCode}
                onClose={() => setOtpModalOpen(false)}

            />


        </>
    );
};

LoginPage.layout = "auth";

export default LoginPage;