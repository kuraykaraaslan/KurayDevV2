
import React from "react";
import StatCard from "@/components/backend/StatCard";
import { faUserAlt, faBlog, faEye, faFolder, faComment, faStar, faHeart, faClock, faChartLine, faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const StatsSection = () => {


    const stats = [
        {
          icon: <FontAwesomeIcon icon={faUserAlt} size="2x" />,
          title: "Total Contacts",
          value: "0",
          description: "Total contact forms submitted"
        },
        {
          icon: <FontAwesomeIcon icon={faBlog} size="2x" />,
          title: "Posts Published",
          value: "876",
          description: "Articles published to date"
        },
        {
          icon: <FontAwesomeIcon icon={faEye} size="2x" />,
          title: "Page Views",
          value: "25,340",
          description: "Total page views this month"
        },
        {
          icon: <FontAwesomeIcon icon={faFolder} size="2x" />,
          title: "Categories",
          value: "12",
          description: "Total categories on the platform"
        },
        {
          icon: <FontAwesomeIcon icon={faComment} size="2x" />,
          title: "Comments",
          value: "5",
          description: "Comments posted by users"
        },
        {
          icon: <FontAwesomeIcon icon={faStar} size="2x" />,
          title: "Ratings",
          value: "4.8",
          description: "Average user rating across articles"
        },
        {
          icon: <FontAwesomeIcon icon={faHeart} size="2x" />,
          title: "Likes",
          value: "10,124",
          description: "Total likes on posts"
        },
        {
          icon: <FontAwesomeIcon icon={faClock} size="2x" />,
          title: "Time Spent",
          value: "1,032 hrs",
          description: "Time spent on the platform"
        },
        {
          icon: <FontAwesomeIcon icon={faChartLine} size="2x" />,
          title: "Growth Rate",
          value: "15%",
          description: "Month-over-month user growth"
        },
        {
          icon: <FontAwesomeIcon icon={faThumbsUp} size="2x" />,
          title: "Recommendations",
          value: "980",
          description: "Users who recommended the platform"
        }
      ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
        ))}
    </div>
  );
};

export default StatsSection;