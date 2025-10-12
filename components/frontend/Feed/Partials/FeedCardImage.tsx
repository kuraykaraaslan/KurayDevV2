'use client';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { PostWithData } from '@/types/BlogTypes';
import Image from 'next/image';

export interface FeedCardProps extends PostWithData {
    className?: string;
}

const FeedCardImage = (props: FeedCardProps) => {

    const [dateText, setDateText] = useState("");

    useEffect(() => {
        if (!props.createdAt) {
            return;
        }

        try {

            const today = new Date();
            if (props.createdAt.toDateString() === today.toDateString()) {
                setDateText("Today");
                return;
            }
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
        } catch (error) {
            console.error(error);
            setDateText("Just now");
        }
    }

        , [props.createdAt]);


    return (
        <div className={"bg-base-100 grid grid-row-2 grid-cols-12 gap-4 shadow-md rounded-lg  from-base-100 to-base-300 bg-gradient-to-b border-t-2 border-primary border-opacity-50 drop-shadow-lg "
            + (props.className || "")}>
            <Link className="col-span-12 justify-center flex border-b-2 border-base-300 rounded-t-lg select-none h-60"
                href={"/blog/" + props?.category?.slug + "/" + props.slug}>
                <img src={props.image!} alt={props.title}
                className="w-full object-cover rounded-t-lg" />
            </Link>
            <div className="col-span-12 justify-center px-4">
                <Link className="text-primary" href={"/blog/" + props.category?.slug + "/" + props.slug}>
                    <h3 className="text-xl font-bold">{props.title || "Title"}</h3>
                </Link>
                <p className="text-base mt-2">{props.description?.substring(0, 200) || "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}</p>
            </div>
            <div className="col-span-12 justify-between flex  px-4 pb-4 select-none">
                <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendar} className="w-4"
                    />
                    <p className="text-sm ml-2">{props.createdAt ? new Date(props.createdAt).toDateString() : dateText}</p>
                    <span className="text-primary ml-2 hidden xl:flex">•</span>
                    <span className="text-primary ml-2 hidden xl:flex">{props.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                    <Link href={"/blog/" + props.category.slug + "/" + props.slug}
                        className="text-primary">Read More
                    <FontAwesomeIcon icon={faCaretRight} className="text-primary mt-1" style={{ height: '1rem', width: '1rem' }} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default FeedCardImage;