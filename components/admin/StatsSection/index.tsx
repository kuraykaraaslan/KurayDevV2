'use client';
import React, { useEffect } from "react";
import StatCard from "./Partials/StatCard";
import { faUserAlt, faBlog, faEye, faFolder, faComment} from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "@/libs/axios";

const StatsSection = () => {

  const [loading, setLoading] = React.useState(true);
  const [values, setValues] = React.useState({
    totalPosts: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalViews: 0,
    totalComments: 0
  });

  async function getStats() {
    await axiosInstance.get(`/api/stats`).then((res) => {
      setValues(res.data.values);
    }).catch(() => {
    });
  }

  useEffect(() => {
    if (loading) {
      setLoading(false);
      getStats();
    }
  }, []);



  const stats = [
    {
      icon: faUserAlt,
      title: "Users",
      value: values.totalUsers,
      description: "Total users"
    },
    {
      icon: faBlog,
      title: "Posts",
      value: values.totalPosts,
      description: "Total posts"
    },
    {
      icon: faEye,
      title: "Views",
      value: values.totalViews,
      description: "Total views"
    },
    {
      icon: faFolder,
      title: "Categories",
      value: values.totalCategories,
      description: "Total categories"
    },
    {
      icon: faComment,
      title: "Comments",
      value: values.totalComments,
      description: "Total comments"
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