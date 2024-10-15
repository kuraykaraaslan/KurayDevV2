'use client';
import React, { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";

const ScrollToTop = () => {

    useEffect(() => {
        const scrollToTopBtn = document.getElementById(
            "scrollToTop",
        ) as HTMLElement;
        const main = document.getElementById("main");

        //make the button appear slowly  when the user scrolls down 20px from the top to 500ms
        window.onscroll = () => {
            var totalWindowHeight = document.body.scrollHeight - window.innerHeight;
            var aligned = window.scrollY * 0.1 - 80;
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

            //if it is end of the page, for footer raise it up to 100px
            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 50
            ) {
                const diff =
                    window.innerHeight + window.scrollY - document.body.offsetHeight + 50;
                scrollToTopBtn.style.bottom = diff + 20 + "px";
            } else {
                scrollToTopBtn.style.bottom = "20px";
            }
        };
    });

    return (
        <div
          className="fixed transition duration-1000 ease-in-out bg-accent hover:bg-base-400 cursor-pointer p-4 shadow-lg rounded-full hover:rounded-box"
          style={{ zIndex: 100, right: "-80px", bottom: "20px" }}
          id="scrollToTop"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FontAwesomeIcon
            icon={faArrowUp}
            className="text-l font-black w-8 h-8 md:w-6 md:h-6"
          />
        </div>
        
    );
    }

export default ScrollToTop;