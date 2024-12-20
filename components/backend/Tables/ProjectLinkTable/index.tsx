'use client'
import React from 'react';
import {Project, ProjectLink} from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import axiosInstance from '@/libs/axios';
import { Category } from '@prisma/client';
import { useRouter } from 'next/navigation';
import SingleProjectLink from './Partials/SingleProjectLink';

const ProjectLinkTable = ({projectId}: {projectId: string}) => {

    const [ProjectLinks, setProjectLinks] = React.useState<ProjectLink[]>([]);

    // New Project Link State
    const [newProjectLink, setNewProjectLink] = React.useState<Partial<ProjectLink>>({
        projectId : '',
        icon: 'github',
        title: '',
        url: '',
    });

    const createProjectLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) {
            return;
        }

        if (!newProjectLink.icon || !newProjectLink.title || !newProjectLink.url) {
            return;
        }

        setProjectLinks([...ProjectLinks, newProjectLink as ProjectLink]);

        await axiosInstance.post('/api/project-links', {
            projectId,
            icon: newProjectLink.icon,
            title: newProjectLink.title,
            url: newProjectLink.url,
        }).then((response) => {
            setProjectLinks([...ProjectLinks, response.data]);
            setNewProjectLink({});
        });

    }

    const deleteProjectLink = async (projectLinkId: string) => {
        await axiosInstance.delete(`/api/project-links/${projectLinkId}`).then(() => {
            setProjectLinks(ProjectLinks.filter((link) => link.linkId !== projectLinkId));
        });
    }

    const updateProjectLink = async (projectLink: ProjectLink) => {
        await axiosInstance.put(`/api/project-links/${projectLink.linkId}`, projectLink).then(() => {
            setProjectLinks(ProjectLinks.map((link) => link.linkId === projectLink.linkId ? projectLink : link));
        });
    }

    if (!projectId) {
        return null;
    }

    if (projectId === 'create') {
        return (
            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
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
                        <tr>
                            <td colSpan={4} className="text-center">Before you can add links, you need to create a project first.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }

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
                        {ProjectLinks.map((link) => {
                            return (
                                <SingleProjectLink key={link.linkId} setProjectLinks={setProjectLinks} projectLink={link} />
                            );
                        })}
                        <tr>
                            <td>
                                <select name="icon" className="input input-bordered" onChange={(e) => setNewProjectLink({...newProjectLink, icon: e.target.value})}>
                                    <option value="github">GitHub</option>
                                    <option value="demo">Demo</option>
                                    <option value="gitlab">GitLab</option>
                                    <option value="download">Download</option>
                                    <option value="link">Link</option>
                                    <option value="file">File</option>
                                </select>
                            </td>
                            <td>
                                <input type="text" name="title" className="input input-bordered" onChange={(e) => setNewProjectLink({...newProjectLink, title: e.target.value})} />
                            </td>
                            <td>
                                <input type="text" name="url" className="input input-bordered" onChange={(e) => setNewProjectLink({...newProjectLink, url: e.target.value})} />
                            </td>
                            <td>
                                <button onClick={createProjectLink} className="btn btn-primary">Add</button>
                            </td>

                        </tr>
                    </tbody>
                </table>
            </div>
    );

}


export default ProjectLinkTable;
