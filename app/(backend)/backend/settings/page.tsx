'use client'
import React, { useState, useEffect, useCallback } from 'react';
import Link from "next/link";
import { Post } from "@prisma/client";
import axiosInstance from "@/libs/axios";
import PostWithCategory from '@/types/PostWithCategory';
import Image from 'next/image';
import { Setting } from '@prisma/client';


const Page = () => {

    const [settings, setSettings] = useState<Setting[]>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axiosInstance.get('/api/settings');
            setSettings(response.data);
        } catch (error) {
            console.error(error);
        }
    }


    const saveSettings = async () => {
        //implement save settings
    }



    

    return (
        <div className="container mx-auto">
            <div className="flex justify-between md:items-center flex-col md:flex-row">
                <h1 className="text-3xl font-bold h-16 md:items-center">Settings</h1>
                <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
                    <button className="btn btn-primary btn-sm h-12" onClick={() => saveSettings()}>
                        Save Settings
                    </button>
                </div>
            </div>


            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="card bordered">
                    <div className="card-body">
                        <h2 className="card-title">General Settings</h2>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Site Name</span>
                            </label>
                            <input type="text" placeholder="Site Name" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Site Description</span>
                            </label>
                            <input type="text" placeholder="Site Description" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Site Keywords</span>
                            </label>
                            <input type="text" placeholder="Site Keywords" className="input input-bordered" />
                        </div>
                    </div>
                </div>
                <div className="card bordered">
                    <div className="card-body">
                        <h2 className="card-title">SEO Settings</h2>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Meta Title</span>
                            </label>
                            <input type="text" placeholder="Meta Title" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Meta Description</span>
                            </label>
                            <input type="text" placeholder="Meta Description" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Meta Keywords</span>
                            </label>
                            <input type="text" placeholder="Meta Keywords" className="input input-bordered" />
                        </div>
                    </div>
                </div>

                <div className="card bordered">
                    <div className="card-body">
                        <h2 className="card-title">Social Media Settings</h2>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Facebook</span>
                            </label>
                            <input type="text" placeholder="Facebook" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Twitter</span>
                            </label>
                            <input type="text" placeholder="Twitter" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Instagram</span>
                            </label>
                            <input type="text" placeholder="Instagram" className="input input-bordered" />
                        </div>
                    </div>
                </div>
       
            </div>

        </div>
    );
}

export default Page;
