//default article

import React from "react";
import { Project } from "@prisma/client";
import Image from "next/image";

export default function SingleProject(post: Partial<Project>) {

    const image = post.image || "/default-article.jpg";

    return (
        <div className="max-w-none justify-center text-left mx-auto px-4 lg:px-8 prose mb-8 pt-8">
            <div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
        </div>
    );
}