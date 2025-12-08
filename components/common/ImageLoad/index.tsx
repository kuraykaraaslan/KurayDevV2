'use client';
import { useState } from 'react';
import axiosInstance from '@/libs/axios';
interface ImageLoadProps {
    image: string;
    setImage: (value: string) => void;
    uploadFolder?: string;
    toast?: any;
}

const ImageLoad = ({ image, setImage, uploadFolder = 'default', toast }: ImageLoadProps) => {

    const [imageFile, setImageFile] = useState<File | null>(null);

    const uploadImage = async () => {
        if (!imageFile) {
            return;
        }

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', uploadFolder);

        await axiosInstance.post('/api/aws', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }).then((res) => {

            setImage(res.data.url);
            if (toast) { toast.success('Image uploaded successfully'); }

        }).catch((error) => {
            if (toast) { toast.error('Error uploading image'); } else { console.error(error); }
        });
    }


    return (
        <>
            <img src={image ? image as string : 'https://placehold.co/384x256'}
                width={384} height={256}
                alt="Image" className="h-64 w-96 object-cover rounded-lg" />
            <div className="relative flex justify-between items-center">
                <input
                    type="file"
                    placeholder="Image URL"
                    className="input input-bordered mt-2 p-4 flex-1 h-16"
                    //only jpg, jpeg, png
                    accept="image/jpeg, image/png"

                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setImageFile(file);
                            //setImageUrl(URL.createObjectURL(file));
                        }
                    }}
                />
                <div className="absolute right-2 top-2 p-2 rounded-lg">
                    <button type="button" className="h-12 p-2 rounded-lg bg-primary mr-2 text-white" onClick={uploadImage}>
                        Upload Image
                    </button>
                    <button type="button" className="h-12 p-2 rounded-lg bg-red-600 text-white" onClick={() => setImage('')}>
                        Remove Image
                    </button>
                </div>
            </div>
        </>
    );
};

export default ImageLoad;