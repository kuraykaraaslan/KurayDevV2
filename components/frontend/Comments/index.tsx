import React from 'react';
import SingleComment from './Partials/SingleComment';
import { Comment } from '@prisma/client';
import crypto from 'crypto';
import AddComment from './Partials/AddComment';


const comments: Comment[] = [
    {
        commentId: '1',
        content: 'Not implemented yet comment feature. I will implement it soon.',
        createdAt: new Date(),
        postId: '',
        name: 'Kuray Karaaslan',
        email: "kuraykaraaslan@gmail.com",
        parentId: null
    }
];


const Comments = ({ postId }: { postId: string }) => {
    if (!postId) {
        return null;
    }

    return (
        <section className="antialiased">
            <div className="mx-auto">
                <div className="flex justify-between items-center mb-6">
                <h4 className="text-3xl font-bold text-left mt-4 mb-4">Comments</h4>
                </div>
                <div className="mb-6">
                    <AddComment  postId={postId} />
                </div>

                {comments.map((comment) => {
                    const hash256email = crypto.createHash('md5').update(comment.email || '').digest('hex');
                    const gravatarUrl = `https://www.gravatar.com/avatar/${hash256email}`;
                    comment.email = null;
                    return <SingleComment key={comment.commentId} comment={comment} 
                    gravatarUrl={gravatarUrl} />
                })}
            </div>
        </section>
    );
};

export default Comments;