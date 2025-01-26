'use client';
import React , { useState , useEffect } from 'react';
import SingleComment from './Partials/SingleComment';
import { Comment } from '@prisma/client';
import crypto from 'crypto';
import AddComment from './Partials/AddComment';
import axiosInstance from '@/libs/axios';


const Comments = ({ postId }: { postId: string }) => {
    

    const [comments, setComments] = useState<Comment[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const fetchComments = async () => {
        // Fetch comments for the post
        await axiosInstance.get(`/api/comments?postId=${postId}&page=${page +1}&pageSize=${pageSize}`).then((response) => {
            setComments(prevComments => [...prevComments, ...response.data.comments]);
            console.log(response.data.comments); 
        }).catch((error) => {
            console.error(error);
        });
    };


    useEffect(() => {

        fetchComments();
    }, [postId, page, pageSize]);


    return (
        <section className="antialiased">
            <div className="mx-auto">
                <div className="flex justify-between items-center mb-6">
                <h4 className="text-3xl font-bold text-left mt-4 mb-4">Comments ({comments.length})</h4>
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