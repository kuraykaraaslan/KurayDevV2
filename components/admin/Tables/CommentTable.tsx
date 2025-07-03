'use client'
import React from 'react';
import PostWithData from '@/types/PostWithData';
import Link from 'next/link';
import Image from 'next/image';
import axiosInstance from '@/libs/axios';
import { Category } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { CommentWithData } from '@/types/CommentWithData';

const CommentTable = ({ post }: { post?: PostWithData }) => {

    const [search, setSearch] = React.useState('');
    const [comments, setComments] = React.useState<Partial<CommentWithData>[]>([]);
    const [page, setPage] = React.useState(0);
    const [pageSize, setPageSize] = React.useState(10);
    const [total, setTotal] = React.useState(0);

    const router = useRouter();

    React.useEffect(() => {

        axiosInstance.get("/api/comments" + `?page=${page + 1}&pageSize=${pageSize}&search=${search}&sort=desc&pending=true` + (post ? `&postId=${post.postId}` : ''))
            .then((response) => {
                setComments(response.data.comments);
                setTotal(response.data.total);
            })
            .catch((error) => {
                console.error(error);
            });
    }
        , [page, pageSize, search]);

    const deleteComment = async (commentId: string) => {
        //confirm
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        //delete
        try {
            await axiosInstance.delete(`/api/comments/${commentId}`);
            setComments(comments.filter(comment => comment.commentId !== commentId));
        } catch (error) {
            console.error(error);
        }
    }

    const approveComment = async (commentId: string) => {
        //confirm
        if (!confirm('Are you sure you want to approve this post?')) {
            return;
        }

        //approve
        try {
            await axiosInstance.put(`/api/comments`, { commentId, status: "APPROVED" });
            setComments(comments.map(comment => {
                if (comment.commentId === commentId) {
                    return { ...comment, status: 'APPROVED' };
                }
                return comment;
            }));
        } catch (error) {
            console.error(error);
        }
    }

    const rejectComment = async (commentId: string) => {

        //confirm
        if (!confirm('Are you sure you want to reject this post?')) {
            return;
        }

        //reject
        try {
            await axiosInstance.put(`/api/comments`, { commentId, status: "PENDING" });
            setComments(comments.map(comment => {
                if (comment.commentId === commentId) {
                    return { ...comment, status: 'PENDING' };
                }
                return comment;
            }));
        } catch (error) {
            console.error(error);
        }
    }


    return (
        <div className="container mx-auto">
            <div className="flex justify-between md:items-center flex-col md:flex-row">
                <h1 className="text-3xl font-bold h-16 md:items-center">{post ? post.title + " Comments" : "Comments"}</h1>
                <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
                    <input type="text" placeholder="Search" className="input input-bordered flex-1 md:flex-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr className="h-12">
                            <th className="grid-cols-2">
                                Post
                            </th>
                            <th className="grid-cols-1">
                                <p>Contact</p>
                            </th>
                            <th className="max-w-16">
                                Content
                            </th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comments.map((comment, index) => (
                            <tr key={index} className="h-12 hover:bg-primary hover:bg-opacity-10">
                                <td className="max-w-20 grid-cols-2">
                                    {comment.post?.title}
                                </td>
                                <td className="flex flex-col gap-1 max-w-20">
                                    <span>{comment.email}</span>
                                    <span>{comment.name}</span>
                                </td>
                                <td>{comment.content}</td>
                                <td className="max-w-16">
                                    {comment.status}
                                </td>
                                <td className="flex gap-2 max-w-16">
                                    <button onClick={() => deleteComment(comment.commentId as string)} className="btn btn-sm bg-red-500 text-white hidden md:flex">Delete</button>

                                    {comment.status === 'PENDING' ? (
                                        <button onClick={() => approveComment(comment.commentId as string)} className="btn btn-sm bg-green-500 text-white hidden md:flex">Approve</button>
                                    ) : (
                                        <button onClick={() => rejectComment(comment.commentId as string)} className="btn btn-sm bg-yellow-500 text-white hidden md:flex">Reject</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>Showing {comments.length} of {total} comments</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">Previous</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">Next</button>
                </div>
            </div>
        </div>
    );
};

export default CommentTable;