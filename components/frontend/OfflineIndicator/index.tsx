'use client'
import { useEffect, useState } from "react";
import { toast } from 'react-toastify';


const OfflineIndicator = () => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            toast.success("You are back online!");
        };

        const handleOffline = () => {
            setIsOnline(false);
            toast.error("You are offline!");
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial state
        if (!navigator.onLine) {
            setIsOnline(false);
            toast.error("You are offline!");
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return null;
};

export default OfflineIndicator;