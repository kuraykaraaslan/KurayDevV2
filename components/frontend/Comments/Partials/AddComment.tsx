'use client';
import axiosInstance from '@/libs/axios';
import { useState , FormEvent} from 'react';

const AddComment = ({ postId, parentId }: { postId: string, parentId?: string }) => {

    const [content, setContent] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');


    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Validate
        if (!content || !name || !email) {
            alert('Please fill all fields');
            return;
        }

        // check if email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            alert('Please enter a valid email');
            return;
        }

        // Name should be at least 3 characters and max 50 characters
        if (name.length < 3 || name.length > 50) {
            alert('Name should be at least 3 characters and max 50 characters');
            return;
        }

        // Content should be at least 5 characters
        if (content.length < 5) {
            alert('Content should be at least 5 characters');
            return;
        }

        // Submit
        axiosInstance.post('/api/comments', {
            postId,
            name,
            email,
            content,
            parentId
        })
            .then(() => {
                alert('Comment posted successfully');
                setContent('');
                setName('');
                setEmail('');
            })
            .catch((error) => {
                console.error(error);
                alert('An error occurred');
            }
        );

    };

    return (
        <>
            <div className="mb-4">
                <div className="flex flex-col md:flex-row mb-4 md:space-x-4 space-y-4 md:space-y-0">
                    <input type="text" className="w-full text-sm bg-base-100  rounded-lg rounded-t-lg border border-primary h-12"
                        value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Name" required />
                    <input type="email" className="w-full text-sm bg-base-100  rounded-lg rounded-t-lg border border-primary h-12"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email" required />
                </div>
                <textarea id="comment" rows={6}
                    value={content} onChange={(e) => setContent(e.target.value)}
                    className="w-full text-sm bg-base-100 rounded-lg rounded-t-lg border border-primary p-4"
                    placeholder="Write a comment..." required>
                </textarea>
            </div>
            <button type="submit"
                onClick={handleSubmit}
                className="btn btn-primary w-full md:w-auto h-12 md:h-12 text-sm font-medium text-center">
                Post comment
            </button>
        </>
    );
};

export default AddComment;