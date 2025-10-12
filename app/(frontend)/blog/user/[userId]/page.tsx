import React from 'react';
import AuthorHeader from '@/components/frontend/AuthorHeader';
import PostService from '@/services/PostService';

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Comments from '@/components/frontend/Comments';
import OtherPosts from '@/components/frontend/OtherPosts';
import Newsletter from '@/components/frontend/Newsletter';
import PostHeader from '@/components/frontend/PostHeader';


import MetadataHelper from '@/helpers/MetadataHelper';
import UserSessionService from '@/services/AuthService/UserSessionService';
import UserService from '@/services/UserService';
import { ToastContainer } from 'react-toastify';
import Feed from '@/components/frontend/Feed';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

export default async function AuthorPage({ request, params }: { request: NextRequest, params: { userId: string } }) {
    try {

        const { userId } = await params;


        if (!userId) {
            notFound();
        }

        const response = await UserService.getById(userId);

        if (!response) {
            notFound();
        }

        const user = response;

        if (!user) {
            notFound();
        }

        if (user.userRole !== 'ADMIN') {
            notFound();
        }


        const metadata : Metadata = {
            title: `${user.name} | kuray.dev`,
            description: user.name ? `Posts by ${user.name}` : 'Author page',
            openGraph: {
                title: `${user.name} | kuray.dev`,
                description: user.biography || "No biography available",
                type: 'profile',
                url: `${APPLICATION_HOST}/author/${user.userId}`,
                images: [ user.profilePicture ? user.profilePicture : `${APPLICATION_HOST}/assets/img/og.png` ],
            },
        }

 
        return (
            <>
                {MetadataHelper.generateElements(metadata)}
                <Feed author={user} />
                <Newsletter />
                <ToastContainer />
            </>
        );

    } catch (error) {
        console.error('Error fetching post:', error);
        notFound();
    }
}
