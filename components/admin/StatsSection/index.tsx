'use client';
import { useEffect, useState } from "react";
import StatCard from "./Partials/StatCard";
import { faUserAlt, faBlog, faEye, faFolder, faComment} from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "@/libs/axios";
import { StatFrequency } from "@/types/StatTypes";

const StatsSection = () => {

  const [frequency, setFrequency] = useState<StatFrequency>("all-time");
  
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({
    totalPosts: 0,
    totalCategories: 0,
    totalUsers: 0,
    totalViews: 0,
    totalComments: 0
  });

  async function getStats() {
    await axiosInstance.post(`/api/stats`, {
      frequency: frequency
    }).then((res) => {
      setValues(res.data.values);
    }).catch(() => {
    });
  }

  useEffect(() => {
    setLoading(true);
    getStats().finally(() => {
      setLoading(false);
    });
  }, [frequency]);



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
      <div className="col-span-1 md:col-span-2 lg:col-span-3 mb-4">
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as StatFrequency)}
          className="p-2 border border-primary rounded"
        >
          <option value="fiveMin">Last 5 Minutes</option>
          <option value="hourly">Last Hour</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
          <option value="all-time">All Time</option>
        </select>
      </div>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsSection;