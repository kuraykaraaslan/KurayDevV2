import { Post } from "@/types/content/BlogTypes";
import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import { addHeadingIds } from "@/helpers/tocUtils";

export default function Article(post: Partial<Post>) {
    const image = post.image ?? null;

    const sanitizedHTML = DOMPurify.sanitize(post.content ?? "", {
        USE_PROFILES: { html: true },
        ALLOWED_TAGS: [
            "p", "b", "i", "em", "strong", "a",
            "ul", "ol", "li",
            "h1", "h2", "h3", "h4",
            "blockquote", "code", "pre",
            "img", "br"
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "id"]
    });

    // Add IDs to headings for anchor links
    const safeHTML = addHeadingIds(sanitizedHTML);

    return (
        <div className="max-w-none justify-center text-left mx-auto prose mb-8 max-w-none">
            {image && (
                <div className="relative w-full h-64 mb-12 -mt-8">
                    <Image
                        src={image ?? `/api/posts/${post.postId}/cover.jpeg`}
                        alt={`Featured image for article: ${post.title ?? "Blog post"}`}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 1200px"
                    />
                </div>
            )}

            <div dangerouslySetInnerHTML={{ __html: safeHTML }} className="prose mt-4 max-w-none" />
        </div>
    );
}
