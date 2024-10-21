'use client';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
// Path: components/Feed/FeedCard.tsx

export interface FeedCardProps {
    index?: number;
    title: string;
    description: string;
    date: Date;
    slug: string;
    className?: string;
    image?: string;
    createdAt?: Date;
}

const FeedCardImage = (props: FeedCardProps) => {

    const [dateText, setDateText] = useState("");
    const [image, setImage] = useState("");

    useEffect(() => {
        if (!props.date) {
            return;
        }
        const today = new Date();
        const diff = today.getTime() - props.date.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 7) {
            setDateText(props.date.toDateString());
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

        //check if url is valid

        if (props.image) {
            const regex = new RegExp("^(http|https)://", "i");
            if (!regex.test(props.image)) {
                props.image = "/assets/img/og.png";
                console.error("Invalid image url");
            } else {
                setImage(props.image);
            }
        }
    }
        , [props.date]);



    return (
        <div className={"bg-base-100 grid grid-row-2 grid-cols-12 gap-4 shadow-md rounded-lg  bg-base-200"
            + (props.className || "")}>
            <div className="col-span-12 justify-center flex">
                <img src={image || "/assests/img/og.png"}


                    alt="feed image" className="w-full h-64 object-cover" />
            </div>
            <div className="col-span-12 justify-center px-4">
                <Link href={"/blog/" + (props.slug || "")} className="text-primary">
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
                    <Link href={"/blog/" + (props.slug || "")}
                        className="text-primary">Read More</Link>
                    <FontAwesomeIcon icon={faCaretRight} className="text-primary mt-1" style={{ height: '1rem', width: '1rem' }} />
                </div>
            </div>
        </div>
    );
};

export default FeedCardImage;