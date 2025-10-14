'use client';
import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  faTerminal } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/navigation";

const TerminalButton = () => {

    const router = useRouter();

    useEffect(() => {
        const scrollToTopBtn = document.getElementById(
            "terminalButton",
        ) as HTMLElement;
        //make the button appear slowly when the user scrolls down 20px from the top to 500ms

        window?.addEventListener("scroll", () => {

            let aligned = window?.scrollY * 0.1 - 100; // Moved 20px up by subtracting 20 more
            if (aligned > 20) {
                aligned = 20;
            }
            scrollToTopBtn.style.right = aligned + "px";
            if (
                document.body.scrollTop > 20 ||
                document.documentElement.scrollTop > 20
            ) {
                scrollToTopBtn.style.display = "flex";
            } else {
                scrollToTopBtn.style.display = "none";
            }

            //if it is end of the page, for footer raise it up to 150px
            if (
                window?.innerHeight + window?.scrollY >=
                document.body.offsetHeight - 70
            ) {
                const diff =
                    window?.innerHeight + window?.scrollY - document.body.offsetHeight + 70;
                scrollToTopBtn.style.bottom = diff + 170 + "px";
            } else {
                scrollToTopBtn.style.bottom = "170px";
            }
        });
    });

            
    return (
        <div
            className="fixed transition duration-1000 ease-in-out bg-black text-white cursor-pointer shadow-lg rounded-full"
            style={{ zIndex: 103, right: "-80px", bottom: "150px" }}
            id="terminalButton"
            onClick={() => router.push("/easter/terminal")}
        >
            <div className="relative transition duration-1000 ease-in-out bg-black cursor-pointer p-4 rounded-full group">
                <FontAwesomeIcon
                    icon={faTerminal}
                    className="text-l text-white w-8 h-8 md:w-6 md:h-6"
                />
            </div>
        </div>

    );
}

export default TerminalButton;