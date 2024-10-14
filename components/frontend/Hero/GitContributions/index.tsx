import React from "react";
import Link from "next/link";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import HeatMap from "./Partial/HeatMap";


const GitContributions = () => {

    return (
        <>
            <div className="hero min-h-screen bg-base-100 hidden lg:flex items-center justify-center">
                <div className="hero-content text-center">
                    <div className="">
                        <h1 className="text-5xl font-bold">
                        a unstoppable developer
                        </h1>
                        <p className="py-6">
                        After switching to the software industry, I continued to develop without a break. 
                        </p>
                        <HeatMap />
                        <div className="flex justify-center py-6">
                            <Link href="https://github.com/kuraykaraaslan">
                                <button className="btn btn-primary">
                                   <FontAwesomeIcon icon={faGithub} className="mr-2 text-xl" height="20" width="20" />
                                    View my GitHub profile
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GitContributions;
