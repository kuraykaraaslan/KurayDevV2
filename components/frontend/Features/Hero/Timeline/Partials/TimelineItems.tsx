import { faBriefcase, faUniversity } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

const TimelineItems = () => {
  return (
    <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical pt-2">
      <li>
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
        </div>
        <div className="timeline-start mb-10 md:text-end mr-3 pl-3">
          <time className="font-mono italic">2024 Feb - Present</time>
          <div className="text-lg font-black">
            Software Developer <span className="text-sm italic font-normal">at</span> Roltek
            Technology
          </div>
          <span className="text-sm max-w-2xl">
            • Communication between IoT Devices and Servers using the MQTT, Websocket, SNMP, and
            REST. <br />
            • Developing serverside application with Java Spring, deploying and maintenance. <br />•
            Developing clientside application with Typescript React, deploying and maintenance.{' '}
            <br />
            • Network management and monitoring. <br />
          </span>
        </div>
        <hr />
      </li>
      <li>
        <hr />
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
        </div>
        <div className="timeline-end mb-10 ml-3">
          <time className="font-mono italic">2021 Dec - 2023 Sep</time>
          <div className="text-lg font-black">
            Structural Engineer <span className="text-sm italic font-normal">at</span> Kuray Yapı
            Construction
          </div>
          <span className="text-sm">
            • Developing turnkey construction projects. <br />
            • Building Information Modeling (BIM) projects. <br />
            • Architectural, Structural floor plans and details. <br />
            • Interior architectural projects and applying them to the project. <br />
            • Construction management and planning of the project. <br />
          </span>
        </div>
        <hr />
      </li>
      <li>
        <hr />
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faBriefcase} className="h-5 w-5" />
        </div>
        <div className="timeline-start mb-10 md:text-end pl-3">
          <time className="font-mono italic">2020 Dec - 2021 Dec</time>
          <div className="text-lg font-black">
            BIM Specialist <span className="text-sm italic font-normal">at</span> CADBIM
          </div>
          <span className="text-sm">
            • Building Information Modeling (BIM) consultancy services. <br />
            • Autodesk AutoCAD, Revit, Robot Structural Analysis Professional, Advance Steel. <br />
            • Application development with Autodesk API using C#, PHP Rest API. <br />
          </span>
        </div>
        <hr />
      </li>
      <li>
        <hr />
        <div className="timeline-middle bg-base-300 p-2 rounded-full">
          <FontAwesomeIcon icon={faUniversity} className="h-5 w-5" />
        </div>
        <div className="timeline-end mb-10 ml-3">
          <time className="font-mono italic">2015 Sep - 2021 Feb</time>
          <div className="text-lg font-black">
            Civil Engineering <span className="text-sm italic font-normal">at</span> Dokuz Eylül
            University
          </div>
        </div>
      </li>
    </ul>
  )
}

export default TimelineItems
