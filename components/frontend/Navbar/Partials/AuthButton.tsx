
import { faRightFromBracket, faRightToBracket, faUser } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { is } from "@react-three/fiber/dist/declarations/src/core/utils";
import Link from "next/link";
import User from "@prisma/client";
import { auth } from "@/libs/auth";

const AuthButton = async () => {

    const session = await auth();

    const isLoggedIn = session?.user ? true : false;

    console.log(session);

    return (
        <div className="w-10 h-10 bg-base-100 rounded-full flex items-center justify-center  border-2 border-primary">
            {!isLoggedIn ?     
            <Link href="/auth/login" className="flex items-center justify-center w-8 h-8">
                <FontAwesomeIcon icon={faUser} className="text-primary w-6 h-6" />
            </Link>
            :
            <Link href="/auth/login" className="flex items-center justify-center w-8 h-8">
                {session?.user?.image ?
                <img src={session?.user?.image} alt="User Image" className="w-8 h-8 rounded-full" />
                :
                <span className="text-primary">{session?.user?.name?.charAt(0).toUpperCase()}</span>
                }
            </Link>
            }
        </div>
    );
}

export default AuthButton;