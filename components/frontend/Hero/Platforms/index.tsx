'use client';
import React from 'react';
import SinglePlatform from './Partials/SinglePlatform';


const Platforms = () => {



    const  platforms = [
        {
            name: "Fiveer",
            icon: "/assets/svg/fiverr.svg",
            url: "https://www.fiverr.com/kuraykaraaslan",
            bgColor: "bg-white",
        },
        {
            name: "Upwork",
            icon: "/assets/svg/upwork.svg",
            url: "https://www.upwork.com/freelancers/~01694c65c4ad50b809",
            bgColor: "bg-white",
        },
        {
            name: "bionluk",
            icon: "/assets/svg/bionluk.svg",
            url: "https://bionluk.com/uye/kuraykaraaslan",
            bgColor: "bg-white",
            zoom: 2,
        },
        {
            name: "armut",
            icon: "/assets/img/armut.png",
            url: "https://armut.com",
            bgColor: "bg-white",
        }
    ];


    return (
        <section className="py-12 bg-base-200 ">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-20 text-center">
                    <span className="text-center font-medium mb-4 block">Active on different platforms</span>
                    <h1 className="text-4xl text-center font-bold">I'm available on the following platforms. You can hire me on any of these platforms.</h1>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
                    {platforms.map((platform) => (
                        <SinglePlatform key={platform.name} {...platform} />
                    ))}
                    
                </div>
            </div>
        </section>

    );
};

export default Platforms;