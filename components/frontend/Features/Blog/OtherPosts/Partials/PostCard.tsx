'use client';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { PostWithData } from '@/types/content/BlogTypes';
import { useTranslation } from 'react-i18next';

const PostCard = ({post}: { post: PostWithData }) => {
    const { t } = useTranslation();
    const { title, slug, createdAt, category, image } = post;

    const [dateText, setDateText] = useState("");

    useEffect(() => {
        if (!createdAt) {
            return;
        
        }

        if (isNaN(new Date(createdAt).getTime())) {
            setDateText(t('frontend.no_date'));
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
                setDateText(createdAt ? new Date(createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : t('frontend.no_date'));
            } else if (diffDays > 7 && diffDays <= 365) {
                setDateText(createdAt ? new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : t('frontend.no_date'));
            } else if (diffDays > 1) {
                setDateText(t('frontend.days_ago', { count: Math.floor(diffDays) }));
            } else if (diffDays === 1) {
                setDateText(t('frontend.yesterday'));
            } else if (diffHours > 1) {
                setDateText(t('frontend.hours_ago', { count: Math.floor(diffHours) }));
            } else if (diffHours === 1) {
                setDateText(t('frontend.an_hour_ago'));
            } else if (diffMinutes > 1) {
                setDateText(t('frontend.minutes_ago', { count: Math.floor(diffMinutes) }));
            } else if (diffMinutes === 1) {
                setDateText(t('frontend.a_minute_ago'));
            } else {
                setDateText(t('frontend.just_now'));
            }
       
        } catch (error) {
            console.error(error);
            setDateText(t('frontend.no_date'));
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
                    <span className="text-primary">{t('frontend.views_count', { count: post.views })}</span>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
