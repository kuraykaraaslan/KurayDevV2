'use client';
import React, { useState } from 'react';

const AddComment = ({ postId }: { postId: string }) => {

    if (!postId) {
        return null;
    }
    
    const [comment, setComment] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle comment submission logic here
        setComment('');
    };

    return (
        <>
            <div className="py-2 px-4 mb-4 rounded-lg rounded-t-lg border border-primary">
                <label htmlFor="comment" className="sr-only">Your comment</label>
                <textarea id="comment" rows={6}
                    value={comment}
                    onChange={handleInputChange}
                    className="px-0 w-full text-sm bg-base-100 border-0 focus:ring-0 focus:outline-none focus:bg-base-100"
                    placeholder="Write a comment..." required></textarea>
            </div>
            <button type="submit"
                className="btn btn-primary w-full md:w-auto h-12 md:h-12 text-sm font-medium text-center">
                Post comment
            </button>
        </>
    );
};

export default AddComment;