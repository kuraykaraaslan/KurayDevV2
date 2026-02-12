import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import Link from 'next/link'
import Image from 'next/image'

export type Url = {
  type?: 'GitHub' | 'Demo' | 'Other'
  title?: string
  icon?: IconDefinition
  url: string
}

export type Tag = {
  name: string
  color: string
  icon: IconDefinition
}

export type Service = {
  id: string
  image: string
  title: string
  description: string
  urls: Url[]
  tags: Tag[]
  bgColor?: string
  borderColor?: string
  textColor?: string
}

type SingleProjectProps = {
  service: Service
}

const SingleProject = ({ service }: SingleProjectProps) => {
  if (!service) {
    return null
  }

  return (
    <article
      id="services"
      className={`rounded-lg select-none border shadow-md min-h-80 ${service.bgColor ? service.bgColor : 'bg-base-200'} ${service.borderColor ? service.borderColor : 'border-base-200'} ${service.textColor ? service.textColor : 'text-base-900'}`}
    >
      <Image
        src={service.image}
        alt={service.title}
        className="w-full h-48 object-cover rounded-t-lg"
        width={1000}
        height={1000}
      />
      <div className="flex flex-col mt-5 p-6">
        <div className="mb-2 flex items-center text-black">
          {service.tags.map((tag) => (
            <span
              key={tag.name}
              className={`text-xs font-medium me-2 px-2.5 pt-0.5 pb-1 rounded flex items-center ${tag.color}`}
            >
              <FontAwesomeIcon
                icon={tag.icon}
                style={{
                  width: '1rem',
                  height: '1rem',
                  marginRight: '0.25rem',
                  paddingTop: '0.25rem',
                }}
              />
              <span className="text-sm hidden lg:block">{tag.name}</span>
            </span>
          ))}
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight">
          <Link href="#" style={{ pointerEvents: 'none' }}>
            {service.title}
          </Link>
        </h2>
        <p className="mb-5 font-light">{service.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {service.urls.map((url) => (
              <Link
                key={url.url}
                href={url.url}
                className="inline-flex items-center font-medium hover:underline"
              >
                <FontAwesomeIcon
                  icon={
                    url.icon
                      ? url.icon
                      : url.url.startsWith('https://github.com')
                        ? faGithub
                        : faGlobe
                  }
                  style={{
                    width: '1rem',
                    height: '1rem',
                    marginRight: '0.25rem',
                    paddingTop: '0.25rem',
                  }}
                />
                {url.title ? url.title : url.type === 'GitHub' ? 'GitHub' : 'Demo'}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

export default SingleProject
