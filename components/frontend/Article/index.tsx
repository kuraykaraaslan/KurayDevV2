//default article

import React from "react";
import { Post } from "@prisma/client";

const NEXT_PUBLIC_APPLICATION_HOST = process.env.APPLICATION_HOST;

export default function Article(post: Partial<Post>) {

    const image = post.image ? post.image : null;
    
    return (
        <div className="max-w-none justify-center text-left mx-auto prose mb-8">
            {image && <img src={image ? image : `${NEXT_PUBLIC_APPLICATION_HOST}/api/posts/${post.postId}/cover.jpeg`}
            alt={post.title} className="w-full h-64 object-cover" />}
            <div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
        </div>
    );
}