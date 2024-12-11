//default article

import React from "react";
import { Post } from "@prisma/client";
import Image from "next/image";

export default function Article(post: Partial<Post>) {

    const image = post.image || "/default-article.jpg";

    return (
        <div className="max-w-none justify-center text-left mx-auto px-4 lg:px-8 prose mb-8">
            <Image src={image}
                    width={1920} height={1080}
                    
                    alt="feed image" className="w-full h-60 object-cover rounded-t-lg" />
            <div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
        </div>
    );
}