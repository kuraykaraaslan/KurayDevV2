import Newsletter from '@/components/frontend/Newsletter';
import Feed from '@/components/frontend/Feed';
import CategoryBullets from '@/components/frontend/CategoryBullets';
import type { Metadata } from 'next';
import MetadataHelper from '@/helpers/MetadataHelper';

const APPLICATION_HOST = process.env.APPLICATION_HOST;

const BlogPage = ({
}) => {

    const metadata: Metadata = {
        title: 'Blog | Kuray Karaaslan',
        description: 'Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!',
        openGraph: {
            title: 'Blog | Kuray Karaaslan',
            description: 'Welcome to my tech blog! I’m Kuray Karaaslan, a frontend, backend, and mobile developer skilled in React, Next.js, Node.js, Java, and React Native. I share practical coding tutorials, industry insights, and UI/UX tips to help developers and tech enthusiasts excel. Stay updated, solve problems, and grow your tech expertise with me!',
            type: 'website',
            url: `${APPLICATION_HOST}/blog`,
            images: [
                `${APPLICATION_HOST}/assets/img/og.png`,
            ],
        },
    };

    return (
        <>
            {MetadataHelper.generateElements(metadata)}
            <Feed category={null} />
            <CategoryBullets />
            <Newsletter />
        </>
    );
};

export default BlogPage;
