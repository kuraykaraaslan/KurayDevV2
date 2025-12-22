'use client';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { PostWithData } from '@/types/content';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';


const SingleArticle = (props: PostWithData) => {
    const { t } = useTranslation();
    const [dateText, setDateText] = useState("");
    const [image, setImage] = useState("");

    useEffect(() => {
        if (!props.createdAt) {
            return;
        }

        try {

            const today = new Date();
            if (props.createdAt.toDateString() === today.toDateString()) {
                setDateText(t('frontend.today'));
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
                setDateText(t('frontend.days_ago', { count: days }));
                return;
            } else if (days === 1) {
                setDateText(t('frontend.yesterday'));
                return;
            } else if (hours > 1) {
                setDateText(t('frontend.hours_ago', { count: hours }));
                return;
            } else if (hours === 1) {
                setDateText(t('frontend.an_hour_ago'));
                return;
            } else if (minutes > 1) {
                setDateText(t('frontend.minutes_ago', { count: minutes }));
                return;
            } else if (minutes === 1) {
                setDateText(t('frontend.a_minute_ago'));
                return;
            }
            setDateText(t('frontend.just_now'));
        } catch (error) {
            console.error(error);
            setDateText(t('frontend.just_now'));
        }
    }

        , [props.createdAt]);


    useEffect(() => {
        setImage(props.image! || props.category.image! || "");
    }, [props.image]);


    return (
        <div className={"from-base-100 to-base-300 bg-gradient-to-b grid grid-row-2 grid-cols-12 gap-4 shadow-md rounded-lg  bg-base-200 max-w-sm"}>
            <Link className="col-span-12 justify-center flex border-b-2 border-base-300 rounded-t-lg select-none h-60"
                href={"/blog/" + props.category.slug + "/" + props.slug}>
                {image ? <Image src={image}
                    width={1920} height={1080}
                    
                    alt="feed image" className="w-full object-cover rounded-t-lg" /> :
                    <div className="relative w-full h-60 bg-primary rounded-t-lg flex justify-center items-center bg-opacity-10">
                        {/*<Image src="/assets/img/blog-empty.png" alt="feed image" className="absolute h-full left-8 top-0 object-cover rounded-t-lg" />*/}
                    </div>}
            </Link>
            <div className="col-span-12 justify-center px-4">
                <Link className="text-primary" href={"/blog/" + props.category.slug + "/" + props.slug}>
                    <h3 className="text-xl font-bold">{props.title || "Title"}</h3>
                </Link>
                <p className="text-base mt-2">{props.description?.substring(0, 200) || "lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}</p>
            </div>
            <div className="col-span-12 justify-between flex  px-4 pb-4">
                <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendar} className="w-4"
                    />
                    <p className="text-sm ml-2">{props.createdAt ? new Date(props.createdAt).toDateString() : dateText}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Link href={"/blog/" + props.category.slug + "/" + props.slug}
                        className="text-primary">{t('frontend.read_more')}
                    <FontAwesomeIcon icon={faCaretRight} className="text-primary mt-1" style={{ height: '1rem', width: '1rem' }} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SingleArticle;