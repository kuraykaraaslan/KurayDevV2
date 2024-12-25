'use client'
import React from 'react';
import { Project } from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import axiosInstance from '@/libs/axios';
import { Category } from '@prisma/client';
import { useRouter } from 'next/navigation';

import ProjectLink from '@/types/ProjectLink';
import { faGithub } from '@fortawesome/free-brands-svg-icons';

const ProjectLinkTable = ({ projectLinks, setProjectLinks }: { projectLinks: ProjectLink[], setProjectLinks: (value: ProjectLink[]) => void }) => {


    // New Project Link State
    const emptyProjectLink: ProjectLink = {
        icon: 'github',
        title: '',
        url: '',
    }   

    const allowedIconOptions = [
        { value: 'github', label: 'GitHub' },
        { value: 'demo', label: 'Demo' },
        { value: 'gitlab', label: 'GitLab' },
        { value: 'download', label: 'Download' },
        { value: 'link', label: 'Link' },
        { value: 'file', label: 'File' },
        { value: 'external-link', label: 'External Link' },
        { value: 'play', label: 'Play' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'twitter', label: 'Twitter' },
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'discord', label: 'Discord' },
    ];

    return (
        <div className="overflow-x-auto w-full bg-base-100 mt-4 rounded-lg min-h-[400px]">
            <table className="table w-full">
                <thead>
                    <tr>
                        <th>Icon</th>
                        <th>Title</th>
                        <th>URL</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {projectLinks?.map(({ icon, title, url }: ProjectLink, index: number) => {
                                            
                        return (
                            <tr>
                                <td>
                                    <select name="icon" className="input input-bordered" onChange={(e) => setProjectLinks([...projectLinks.slice(0, index), { ...projectLinks[index], icon: e.target.value }, ...projectLinks.slice(index + 1)])} value={icon}>
                                        {allowedIconOptions.map((option) => {
                                            return (
                                                <option value={option.value}>{option.label}</option>
                                            );
                                        })}
                                    </select>
                                </td>
                                <td>
                                    <input type="text" name="title" className="input input-bordered" onChange={(e) => setProjectLinks([...projectLinks.slice(0, index), { ...projectLinks[index], title: e.target.value }, ...projectLinks.slice(index + 1)])} value={title} />
                                </td>
                                <td>
                                    <input type="text" name="url" className="input input-bordered" onChange={(e) => setProjectLinks([...projectLinks.slice(0, index), { ...projectLinks[index], url: e.target.value }, ...projectLinks.slice(index + 1)])} value={url} />
                                </td>
                                <td>
                                    <button onClick={() => {
                                        setProjectLinks([...projectLinks.slice(0, index), ...projectLinks.slice(index + 1)]);
                                    }} className="btn btn-sm btn-error">Delete</button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

}


export default ProjectLinkTable;
