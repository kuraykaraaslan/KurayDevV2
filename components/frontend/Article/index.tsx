//default article

import React from "react";
import { Post } from "@prisma/client";

export default function Article(post: Partial<Post>) {
    return (
        <div className="max-w-7xl justify-center text-left mx-auto px-4 lg:px-8 prose mb-8">
            <div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
        </div>
    );
}