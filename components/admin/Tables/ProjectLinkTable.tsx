'use client'
const ProjectLinkTable = ({ projectLinks, setProjectLinks }: { projectLinks: string[], setProjectLinks: (value: string[]) => void }) => {


    return (
        <div className="overflow-x-auto w-full bg-base-100 mt-4 rounded-lg min-h-[400px]">
            <table className="table w-full">
                <thead>
                    <tr>
                        <th>URL</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {projectLinks?.map((link : string, index: number) => {
                                            
                        return (
                            <tr key={index}>
                                <td className="">
                                    <input type="text" name="url" className="input input-bordered w-full"
                                    onChange={(e) => {
                                        setProjectLinks([...projectLinks.slice(0, index), e.target.value, ...projectLinks.slice(index + 1)]);
                                    }
                                    } value={link} />
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
