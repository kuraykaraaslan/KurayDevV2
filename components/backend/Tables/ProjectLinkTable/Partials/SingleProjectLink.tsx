'use client';
import React from 'react';
import { ProjectLink } from '@prisma/client';


const SingleProjectLink = (props: ProjectLink) => {

    const [projectLink, setProjectLink] = React.useState<ProjectLink>(props);


    const deleteProjectLink = async (id: string) => {
        // Delete Project Link
    }

    const updateProjectLink = async (id: string) => {
        // Update Project Link
    }

    return (
        <tr>
            <td>
                <select name="icon" className="input input-bordered" onChange={(e) => setProjectLink({ ...projectLink, icon: e.target.value })}>
                    <option value="github" > GitHub </option>
                    < option value="demo" > Demo </option>
                    < option value="gitlab" > GitLab </option>
                    < option value="download" > Download </option>
                    < option value="link" > Link </option>
                    < option value="file" > File </option>
                </select>
            </td>
            < td >
                <input type="text" name="title" className="input input-bordered" onChange={(e) => setProjectLink({ ...projectLink, title: e.target.value })} />
            </td>
            < td >
                <input type="text" name="url" className="input input-bordered" onChange={(e) => setProjectLink({ ...projectLink, url: e.target.value })} />
            </td>
            < td >
                <button onClick={() => updateProjectLink(projectLink.linkId)} className="btn btn-primary"> Update </button>
                <button onClick={() => deleteProjectLink(projectLink.linkId)} className="btn btn-secondary"> Delete </button>
            </td>
        </tr>
    );
};

export default SingleProjectLink;