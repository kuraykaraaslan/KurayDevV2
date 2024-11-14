'use client';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { extend } from '@react-three/fiber';
import PostWithCategory from '@/types/PostWithCategory';
// Path: components/Feed/FeedCard.tsx

export interface FeedCardProps extends PostWithCategory {
    className?: string;
}

const FeedCardImage = (props: FeedCardProps) => {

    console.log("FeedCardI", props);

    const [dateText, setDateText] = useState("");
    const [image, setImage] = useState("");

    useEffect(() => {
        if (!props.createdAt) {
            return;
        }
        const today = new Date();
        const diff = today.getTime() - new Date(props.createdAt).getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            setDateText(props.createdAt.toDateString());
            return;
        } else if (days > 1) {
            setDateText(`${days} days ago`);
            return;
        } else if (days === 1) {
            setDateText("Yesterday");
            return;
        } else if (hours > 1) {
            setDateText(`${hours} hours ago`);
            return;
        } else if (hours === 1) {
            setDateText("An hour ago");
            return;
        } else if (minutes > 1) {
            setDateText(`${minutes} minutes ago`);
            return;
        } else if (minutes === 1) {
            setDateText("A minute ago");
            return;
        }
        setDateText("Just now");
    }
        , [props.createdAt]);

   
    useEffect(() => {
        setImage(props.image! || props.Category.image! || "");
    } , [props.image]);


    return (
        <div className={"bg-base-100 grid grid-row-2 grid-cols-12 gap-4 shadow-md rounded-lg  bg-base-200"
            + (props.className || "")}>
            <div className="col-span-12 justify-center flex border-b-2 border-base-300 rounded-t-lg select-none">
                {image ? <img src={image} 
                alt="feed image" className="w-full h-60 object-cover rounded-t-lg" /> :
                    <div className="relative w-full h-60 bg-primary rounded-t-lg flex justify-center items-center bg-opacity-10">
                        {/*<img src="/assets/img/blog-empty.png" alt="feed image" className="absolute h-full left-8 top-0 object-cover rounded-t-lg" />*/}
                    </div>}
            </div>
            <div className="col-span-12 justify-center px-4">
                <Link href={"/blog/" + props.Category.slug + "/" + props.slug} className="text-primary">
                    <h3 className="text-xl font-bold">{props.title || "Title"}</h3>
                </Link>
                <p className="text-base mt-2">{props.description?.substring(0, 200) || "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}</p>
            </div>
            <div className="col-span-12 justify-between flex  px-4 pb-4">
                <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendar} className="text-gray-500 w-4"
                    />
                    <p className="text-gray-500 text-sm ml-2">{props.createdAt ? new Date(props.createdAt).toDateString() : dateText}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Link href={"/blog/" + props.Category.slug + "/" + props.slug}
                        className="text-primary">Read More</Link>
                    <FontAwesomeIcon icon={faCaretRight} className="text-primary mt-1" style={{ height: '1rem', width: '1rem' }} />
                </div>
            </div>
        </div>
    );
};

export default FeedCardImage;