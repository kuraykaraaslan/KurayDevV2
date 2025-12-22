'use client'
import {Project} from '@prisma/client';
import Link from 'next/link';
import Image from 'next/image';
import axiosInstance from '@/libs/axios';
import { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";

const ProjectTable = () => {
    const { t } = useTranslation();

    const [search, setSearch] = useState('');
    const [projects, setProjects] = useState<Partial<Project>[]>([]);
    const [page, setPage] = useState(0);
    const [pageSize, _setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    useEffect(() => {

        axiosInstance.get("/api/projects" + `?page=${page}&pageSize=${pageSize}&search=${search}&sort=desc`)
            .then((response) => {
                setProjects(response.data.projects);
                setTotal(response.data.total);
            })
            .catch((error) => {
                console.error(error);
            });
    }
        , [page, pageSize, search]);

    const deleteProject = async (projectId: string) => {
        //confirm
        if (!confirm(t('admin.projects.confirm_delete'))) {
            return;
        }

        //delete
        try {
            await axiosInstance.delete(`/api/projects/${projectId}`);
            setProjects(projects.filter(project => project.projectId !== projectId));
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="container mx-auto">
            <div className="flex justify-between md:items-center flex-col md:flex-row">
                <h1 className="text-3xl font-bold h-16 md:items-center">{t('admin.projects.title')}</h1>
                <div className="flex gap-2 h-16 w-full md:w-auto md:flex-none">
                    <input type="text" placeholder={t('admin.projects.search_placeholder')} className="input input-bordered flex-1 md:flex-none" value={search} onChange={(e) => setSearch(e.target.value)} />
                    <Link className="btn btn-primary btn-sm h-12" href="/admin/projects/create">
                        {t('admin.projects.create_project')}
                    </Link>
                </div>
            </div>

            <div className="overflow-x-auto w-full bg-base-200 mt-4 rounded-lg min-h-[400px]">
                <table className="table">
                    {/* head */}
                    <thead className="bg-base-300 h-12">
                        <tr className="h-12">
                            <th className="w-16">
                            </th>
                            <th>
                                Title
                            </th>
                            <th className="max-w-20">
                                {t('admin.projects.tech_stack')}
                            </th>
                            <th className="max-w-16">
                                {t('admin.projects.slug')}</th>
                            <th>Status</th>
                            <th>{t('admin.projects.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {projects.map((project, index) => (
                            <tr key={index} className="h-12 hover:bg-primary hover:bg-opacity-10">
                                <td>
                                    {project.image ?
                                        <Image width={32} height={32} src={project.image} className="h-8 w-8 rounded-full" alt={project.title as string} />
                                        :
                                        <div className="h-8 w-8 bg-base-300 rounded-full"></div>
                                    }
                                </td>
                                <td>{project.title}</td>
                                <td>{project.technologies && project.technologies.join(', ')}</td>
                                <td>{project.slug}</td>
                                <td>{project.status}</td>
                                <td className="flex gap-2">
                                    <Link href={`/admin/projects/${project.projectId}`} className="btn btn-sm btn-primary">{t('admin.projects.edit')}</Link>
                                    <Link href={`/project/${project.slug}`} className="btn btn-sm btn-secondary">{t('admin.projects.view')}</Link>
                                    <button onClick={() => deleteProject(project.projectId as string)} className="btn btn-sm bg-red-500 text-white hidden md:flex">{t('admin.projects.delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-between items-center mt-4">
                <div>
                    <span>{t('admin.projects.showing', { count: projects.length, total: total })}</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setPage(page - 1)} disabled={page === 0} className="btn btn-sm btn-secondary h-12">{t('admin.projects.previous')}</button>
                    <button onClick={() => setPage(page + 1)} disabled={(page + 1) * pageSize >= total} className="btn btn-sm btn-secondary h-12">{t('admin.projects.next')}</button>
                </div>
            </div>
        </div>
    );
};

export default ProjectTable;