import { useState } from 'react';
import axiosInstance from '@/libs/axios';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const AIPrompt = ({
    setTitle,
    setContent,
    setDescription,
    setKeywords,
    setSlug,
    setCreatedAt,
    toast
}: {
    setTitle: (title: string) => void,
    setContent: (content: string) => void,
    setDescription: (description: string) => void,
    setKeywords: (keywords: string[]) => void,
    setSlug: (slug: string) => void,
    setCreatedAt: (createdAt: Date) => void,
    toast: any
}) => {

    const [internalContent, setInternalContent] = useState('');

    const prompt = `
        create a post for this prompt: \n
    
        ${internalContent}
    
        format: {
            title: xxx,
            description: xxx,
            keywords: xxx, 
            content: xxx, //wysiwyg content
            createdAt: xxx, //a date recommended for the post if that post published on related date
        }
    
        `;

    const generatePost = async () => {
        await axiosInstance.post('/api/ai/gpt-4o', {
            prompt
        }).then((res) => {

            if (res.data.error || res.status !== 200) {
                toast.error(res.data.error.message);
                return;
            }

            try {
                const text = res.data.text;
                setTitle(text.title);
                setContent(text.content);
                setDescription(text.description);
                setSlug(text.slug);
                setCreatedAt(text.createdAt);

                if (text.keywords) {
                    //check if it is a string or an array
                    if (typeof text.keywords === 'string') {
                        setKeywords(text.keywords.split(','));
                    } else {
                        setKeywords(text.keywords);
                    }
                }


            } catch (error) {
                toast.error('Error while parsing the response');
            }
        }).catch((response) => {
            toast.error(response.error.message);
        });
    }

    const openModal = () => {
        if (document.getElementById('my_modal_4')) {
            // @ts-ignore
            document.getElementById('my_modal_4')?.showModal();
        }
    }

    return (
        <>
            <dialog id="my_modal_4" className="modal">
                <div className="modal-box w-11/12 max-w-5xl">
                    <h3 className="font-bold text-lg">OpenAI GPT-4 Post Generator</h3>
                    <div className="modal-body w-full">
                        <textarea className="textarea h-64 w-full mt-4" value={internalContent} onChange={(e) => setInternalContent(e.target.value)}></textarea>
                        <button className="btn btn-primary mt-2" onClick={generatePost}>Generate Post</button>
                    </div>
                    <div className="modal-action">
                        <form method="dialog">
                            {/* if there is a button, it will close the modal */}
                            <button className="btn">Close</button>
                        </form>
                    </div>
                </div>
            </dialog>
            <button className="btn bg-yellow-400" onClick={openModal}>
                <FontAwesomeIcon icon={faRobot} className="mr-2" /> AI Prompt
            </button>
        </>
    );
};

export default AIPrompt;