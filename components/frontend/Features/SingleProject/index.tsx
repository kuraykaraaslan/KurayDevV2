import { Project } from "@/types/content/ProjectTypes";
import DOMPurify from "isomorphic-dompurify";

export default function SingleProject(post: Partial<Project>) {

    const safeHTML = DOMPurify.sanitize(post.content ?? "", {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
            "p", "b", "i", "em", "strong",
            "a", "ul", "ol", "li",
            "h1", "h2", "h3", "h4",
            "blockquote", "code", "pre",
            "img", "br"
        ],
        ALLOWED_ATTR: [
            "href", "src", "alt",
            "title", "target", "rel"
        ]
    });

    return (
        <div className="max-w-none justify-center text-left mx-auto px-4 lg:px-8 prose mb-8 pt-8 md:pt-0">
            <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
        </div>
    );
}
