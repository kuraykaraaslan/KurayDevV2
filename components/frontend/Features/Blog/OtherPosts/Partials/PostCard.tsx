'use client';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { PostWithData } from '@/types/BlogTypes';

const PostCard = ({post}: { post: PostWithData }) => {

    const { title, slug, createdAt, category, image } = post;

    const [dateText, setDateText] = useState("");

    useEffect(() => {
        if (!createdAt) {
            return;
        
        }

        if (isNaN(new Date(createdAt).getTime())) {
            setDateText("N/a");
            return;
        }

        try {

            const now = new Date();
            const diff = now.getTime() - new Date(createdAt).getTime();

            const diffSeconds = diff / 1000;
            const diffMinutes = diffSeconds / 60;
            const diffHours = diffMinutes / 60;
            const diffDays = diffHours / 24;

            console.log(typeof createdAt, createdAt, new Date(createdAt).toDateString(), diffDays);

            if (diffDays > 365) {
                setDateText(createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A");
            } else if (diffDays > 7 && diffDays <= 365) {
                setDateText(createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : "N/A");
            } else if (diffDays > 1) {
                setDateText(`${Math.floor(diffDays)} days ago`);
            } else if (diffDays === 1) {
                setDateText("Yesterday");
            } else if (diffHours > 1) {
                setDateText(`${Math.floor(diffHours)} hours ago`);
            } else if (diffHours === 1) {
                setDateText("An hour ago");
            } else if (diffMinutes > 1) {
                setDateText(`${Math.floor(diffMinutes)} minutes ago`);
            } else if (diffMinutes === 1) {
                setDateText("A minute ago");
            } else {
                setDateText("Just now");
            }
       
        } catch (error) {
            console.error(error);
            setDateText("N/A");
        }
    }, [createdAt]);


    return (
        <div className={"bg-base-300 shadow-md rounded-lg min-w-[296px]"}>
            <Link
                href={"/blog/" + category.slug + "/" + slug}
                className="block h-32 border-b-2 border-base-300 overflow-hidden rounded-t-lg"
            >
            <img
                        src={image!}
                        width={1920}
                        height={1080}
                        alt="feed image"
                        className="w-full h-full object-cover"
                    />

            </Link>
            <div className="p-4">
                <Link href={"/blog/" + category.slug + "/" + slug}>
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
