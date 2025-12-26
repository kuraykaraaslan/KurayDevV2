import Link from "next/link";
import { Project } from "@/types/content/ProjectTypes";
import Image from 'next/image';
import SingleLink from "./SingleLink";
import SingleTag from "./SingleTag";

const SingleProject = ({ project }: { project: Project }) => {

  const url = project.slug.startsWith('http') ? project.slug : `/projects/${project.slug}`;

  return (
    <article
      className={`rounded-lg border from-base-100 to-base-300 bg-gradient-to-b shadow-lg border-base-200 text-base-900`}
    >
      <Link className="shadow-md rounded-t-lg" href={url} target="_blank">
        <Image
          width="1000"
          height="1000"
          unoptimized={true}
          src={project.image ? project.image : ""}
          alt={project.title}
          className="w-full h-48 object-cover object-top rounded-t-lg"
        /> 
      </Link>
      <div className="pt-6 px-6 flex items-center mb-5 text-black">
        {project.technologies.map((tag, index) => (
          <SingleTag technology={tag} key={index} />
        ))}
        
        </div>
      <h2 className="px-6 mb-2 text-2xl font-bold tracking-tight">
        <Link href={url} target="_blank">
          {project.title}
        </Link>
      </h2>
      <p className="px-6 mb-5 font-light">{project?.description!.substring(0, 250)}...</p>
      <div className="px-6 pb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          {project.projectLinks.map((link, index) => (
            <SingleLink  url={link} key={index} />
          ))}   
        </div>
      </div>
    </article>
  );
};

export default SingleProject;
