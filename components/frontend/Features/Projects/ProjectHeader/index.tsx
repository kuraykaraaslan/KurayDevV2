

'use client'
import { Project } from '@/types/content/ProjectTypes';
import SingleTag from '@/components/frontend/Features/Hero/Projects/Partials/SingleTag';
import SingleLink from '@/components/frontend/Features/Hero/Projects/Partials/SingleLink';

const ProjectHeader = (project: Partial<Project>) => {

  return (
    <div className='max-w-none justify-center text-left mx-auto prose mb-8'>
      <div className='flex items-center'>
        <h1 className='text-3xl font-bold text-left mt-4 mb-4 mr-4'>{project.title}</h1>
      </div>
      <div className='text-sm flex items-center space-x-2'>
        <span className='hidden md:inline'>
          {(project.technologies?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              {project.technologies?.map((tech, i) => (
                <SingleTag key={i} technology={tech} />
              ))}
            </div>
          )}
        </span>
        {(project.projectLinks?.length ?? 0) > 0 && (
          <>
            <span className="text-primary">•</span>
            <span className="flex items-center gap-3">
              {project.projectLinks?.map((link, i) => (
                <SingleLink key={i} url={link} />
              ))}
            </span>
          </>
        )}
        {(project.platforms?.length ?? 0) > 0 && (
          <>
            <span className="text-primary">•</span>
            <span className="text-primary capitalize">
              {project.platforms?.join(' / ')}
            </span>
          </>
        )}
      </div>

    </div>
  )
}

export default ProjectHeader
