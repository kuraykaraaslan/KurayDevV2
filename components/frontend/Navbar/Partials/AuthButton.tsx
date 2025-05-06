'use client'
import React, { useEffect } from "react";
import { faGear, faRightFromBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import useGlobalStore from "@/libs/zustand";
import { UserRole } from "@prisma/client";

const AuthButton = () => {
    const { user } = useGlobalStore();


    if (!user) {
        return (
            <Link href="/auth/login" className="bg-primary text-white rounded-full p-2 w-10 h-10 flex items-center justify-center hidden md:flex">
                <div className="">
                    <FontAwesomeIcon icon={faUser} className="" />
                </div>
            </Link>
        );
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
