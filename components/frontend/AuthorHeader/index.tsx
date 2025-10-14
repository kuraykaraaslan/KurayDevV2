// AuthorHeader.tsx
import React from "react";
import { SafeUser } from "@/types/UserTypes";

export default function AuthorHeader(author: Partial<SafeUser>) {
  const coverImage = author.headerImage
    ? author.headerImage
    : "/assets/img/heros/welcome4.webp";
  const profilePicture = author.profilePicture
    ? author.profilePicture
    : "/assets/img/emptyuser.png";

  return (
    <div className="relative max-w-none text-left mx-auto prose mb-8">
      {/* Cover */}
      <div className="relative h-48">
        <img
          src={coverImage}
          alt="Cover"
          className="w-full h-full object-cover "
        />

        {/* Profil resmi + yazı */}
        <div className="absolute -bottom-12 left-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
          <img
            src={profilePicture}
            alt={author.name || "Author"}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-md object-cover bg-base-100 drop-shadow"
          />
          <div>
            <h2 className="text-lg md:text-2xl font-bold drop-shadow text-base-200">
              {author.name}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
