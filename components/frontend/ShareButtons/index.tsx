'use client';

import React, { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faLinkedin, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faXTwitter } from '@fortawesome/free-brands-svg-icons'; // ✔ Doğru X ikonu

interface ShareButtonsProps {
  title?: string;
  description?: string;
  url?: string;
}

const ShareButtons = ({ title = "", description = "", url }: ShareButtonsProps) => {
  const currentUrl =
    url || (typeof window !== "undefined" ? window.location.href : "");

    // desc 100 karakterden uzun ise kısalt
  const shortDescription = description.length > 100 ? description.substring(0, 97) + "..." : description;
  const textToShare = useMemo(
    () => `${title}\n\n${shortDescription}\n\n${currentUrl}`,
    [title, shortDescription, currentUrl]
  );
   

  const shareLinks = useMemo(
    () => ({
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`,
    }),
    [currentUrl, textToShare]
  );

  return (
    <div className="flex gap-2">
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-primary"
      >
        <FontAwesomeIcon icon={faFacebook} size="lg" />
      </a>

      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-info"
      >
        <FontAwesomeIcon icon={faXTwitter} size="lg" /> {/* ✔ doğru X ikonu */}
      </a>

      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-accent"
      >
        <FontAwesomeIcon icon={faLinkedin} size="lg" />
      </a>

      <a
        href={shareLinks.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-circle btn-outline btn-sm hover:btn-success"
      >
        <FontAwesomeIcon icon={faWhatsapp} size="lg" />
      </a>
    </div>
  );
};

export default ShareButtons;
