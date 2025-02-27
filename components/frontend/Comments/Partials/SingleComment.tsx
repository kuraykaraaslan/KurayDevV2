'use client';
import React, { useEffect } from 'react';
import { Comment } from '@prisma/client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faMessage } from '@fortawesome/free-solid-svg-icons';
import useGlobalStore from '@/libs/zustand';
import axiosInstance from '@/libs/axios';


const SingleComment = ({comment, gravatarUrl} : {comment: Comment, gravatarUrl: string}) => {

    const { session } = useGlobalStore();

    const user = session?.user;
    const isAdmin = user?.role === "ADMIN";

    const { content, createdAt, parentId, name, email } = comment;


    const handleReply = () => {
    }

    const handleDelete = async () => {
        await axiosInstance.delete(`/api/comments`, {
            data: {
                commentId: comment.commentId
            }
        }).then((response) => {
        }).catch((error) => {
            console.error(error);
        });
    }

    useEffect(() => {
        //role
    } , [session]);


    return (
        <>
            <div className={"p-6 text-base rounded-lg " + (parentId ? 'bg-base-200' : 'bg-base-300')}>
                <footer className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <p className="inline-flex items-center mr-3 text-sm font-semibold"><img
                            className="mr-2 w-6 h-6 rounded-full"
                            src={gravatarUrl} alt={name || 'Anonymous'} />{name || 'Anonymous'}</p>
                        <p className="text-sm">
                            {new Date(createdAt).toLocaleDateString()} {new Date(createdAt).toLocaleTimeString()}
                        </p>
                    </div>
                    {true &&
                    <details className="dropdown dropdown-end">
                        <summary className="btn btn-primary m-1"><FontAwesomeIcon icon={faEllipsis} className='w-4 h-4' /></summary>
                        <ul className="menu dropdown-content bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                            <li><button onClick={handleReply}>Reply</button></li>
                            <li><button onClick={handleDelete}>Delete</button></li>
                        </ul>
                    </details>
                    }
                </footer>
                <p className="pt-4 pb-4">
                    {content}
                </p>

                <div className="flex items-center mt-4 space-x-4 hidden">
                    <button type="button"
                        className="flex items-center text-sm font-medium">
                        <FontAwesomeIcon icon={faMessage} className='w-4 h-4' />
                        <span className="ml-1">Reply</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default SingleComment;