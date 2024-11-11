import React from "react";
import { faGear, faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import useAuthStore from "@/libs/zustand";

const AuthButton = () => {
    const { session } = useAuthStore();
    const user = session?.user;
    
    if (!user) {
        return (
            <Link href="/auth/login" className="bg-primary text-white rounded-full p-2 w-10 h-10 flex items-center justify-center">
                <div className="">
                    <FontAwesomeIcon icon={faUser} className="" />
                </div>
            </Link>
        );
    }

    if (user.role === "ADMIN") {
        <Link href={`/backend`}>
            <div className="bg-primary text-white rounded-full p-2 w-10 h-10 flex items-center justify-center">
                <FontAwesomeIcon icon={faGear} className="mr-2" />
            </div>
        </Link>
    }

    return (
        <Link href="/auth/logout" className="bg-primary text-white rounded-full p-2 w-10 h-10 flex items-center justify-center">
            <div className="">
                <FontAwesomeIcon icon={faRightFromBracket} className="" />
            </div>
        </Link>
    );
};

export default AuthButton;
