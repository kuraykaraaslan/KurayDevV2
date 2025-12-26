import { Post } from "@/types/content/BlogTypes";
import DOMPurify from "isomorphic-dompurify";

const NEXT_PUBLIC_APPLICATION_HOST = process.env.APPLICATION_HOST;

export default function Article(post: Partial<Post>) {
    const image = post.image ?? null;

    const safeHTML = DOMPurify.sanitize(post.content ?? "", {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
            "p", "b", "i", "em", "strong", "a",
            "ul", "ol", "li",
            "h1", "h2", "h3", "h4",
            "blockquote", "code", "pre",
            "img", "br"
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel"]
    });

    return (
        <div className="max-w-none justify-center text-left mx-auto prose mb-8">
            {image && (
                <img
                    src={image ?? `${NEXT_PUBLIC_APPLICATION_HOST}/api/posts/${post.postId}/cover.jpeg`}
                    alt={post.title ?? ""}
                    className="w-full h-64 object-cover"
                />
            )}

            <div dangerouslySetInnerHTML={{ __html: safeHTML }} className="prose mt-4" />
        </div>
    );
}
