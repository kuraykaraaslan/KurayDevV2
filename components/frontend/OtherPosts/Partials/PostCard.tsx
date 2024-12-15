'use client';
import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import PostWithCategory from '@/types/PostWithCategory';
import Image from 'next/image';

const PostCard = ({post}: { post: PostWithCategory }) => {

    const { title, slug, createdAt, Category, image } = post;

    if (!image && !Category.image) {
        return null;
    }

    const [dateText, setDateText] = useState("");

    useEffect(() => {
        if (!createdAt) {
            return;
        }

        try {
            const today = new Date();

            if (createdAt.toDateString() === today.toDateString()) {
                setDateText("Today");
                return;
            }
            const diff = today.getTime() - new Date(createdAt).getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 7) {
                setDateText(createdAt.toDateString());
            } else if (days > 1) {
                setDateText(`${days} days ago`);
            } else if (days === 1) {
                setDateText("Yesterday");
            } else if (hours > 1) {
                setDateText(`${hours} hours ago`);
            } else if (hours === 1) {
                setDateText("An hour ago");
            } else if (minutes > 1) {
                setDateText(`${minutes} minutes ago`);
            } else if (minutes === 1) {
                setDateText("A minute ago");
            } else {
                setDateText("Just now");
            }
        } catch (error) {
            console.error(error);
            setDateText("Just now");
        }
    }, [createdAt]);


    return (
        <div className={"bg-base-300 shadow-md rounded-lg min-w-[296px]"}>
            <Link
                href={"/blog/" + Category.slug + "/" + slug}
                className="block h-32 border-b-2 border-base-300 overflow-hidden rounded-t-lg"
            >
            <Image
                        src={image || Category.image || ""}
                        width={1920}
                        height={1080}
                        alt="feed image"
                        className="w-full h-full object-cover"
                    />

            </Link>
            <div className="p-4">
                <Link href={"/blog/" + Category.slug + "/" + slug}>
                    <h3 className="text-lg font-semibold text-primary hover:underline">
                        {title || "Title"}
                    </h3>
                </Link>
                <div className="mt-2 hidden lg:flex items-center text-sm gap-2">
                    <FontAwesomeIcon icon={faCalendar} className="w-4" />
                    <span>{dateText}</span>
                    <span className="text-primary">•</span>
                    <span className="text-primary">{post.views} views</span>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
