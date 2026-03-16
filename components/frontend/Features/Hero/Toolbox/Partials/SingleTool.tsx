import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Tool } from '@/types/ui/SkillTypes'

const SingleTool = ({ icon, title, description, hoverBgColor, hoverTextColor }: Tool) => {
  return (
    <div className="w-40 h-40 group  rounded-none">
      <div
        className={
          'relative card rounded-none w-40 h-40 from-base-100 to-base-300 bg-gradient-to-b relative select-none transition duration-500 transform group-hover:rotate-y-180 px-2 py-2 shadow-lg '
        }
      >
        <div className="flex flex-col items-center justify-center group-hover:hidden">
          <figure className="px-10 pt-5 -mb-3">
            <FontAwesomeIcon icon={icon} className="text-8xl" />
          </figure>
        </div>
        <div
          className={
            'flex flex-col items-center justify-center hidden group-hover:flex rotate-y-180 w-40 h-40 top-0 left-0 absolute group-hover:bg-primary group-hover:text-primary-content rounded-none '
          }
        >
          <figure className="px-10 pt-5 -mb-4">
            <FontAwesomeIcon
              icon={icon}
              className="text-4xl transition duration-500 hover:animate-spin"
            />
          </figure>
          <div className={'card-body items-center text-center duration-1000 ease-in-out '}>
            <h2 className="card-title">{title}</h2>
            <span className="text-xs">{description}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SingleTool
