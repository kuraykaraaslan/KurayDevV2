import { Project } from "@prisma/client";

export default function SingleProject(post: Partial<Project>) {

    return (
        <div className="max-w-none justify-center text-left mx-auto px-4 lg:px-8 prose mb-8 pt-8 md:pt-0">
            <div dangerouslySetInnerHTML={{ __html: post.content as string }}></div>
        </div>
    );
}