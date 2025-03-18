//default article

import React from "react";
import { Post } from "@prisma/client";
import Image from "next/image";


const NEXT_PUBLIC_APPLICATION_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST;

export default function Article(post: Partial<Post>) {

    const image = post.image ? post.image : null;
    
    return (
        <div className="max-w-none justify-center text-left mx-auto prose mb-8">
            {image && <img src={image ? image : `${NEXT_PUBLIC_APPLICATION_HOST}/api/posts/${post.postId}/cover.jpeg`}
            alt={post.title} className="w-full h-60 object-cover rounded-lg" />}
            <div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
        </div>
    );
}