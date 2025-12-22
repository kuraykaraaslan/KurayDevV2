'use client';
import { useEffect, useState } from "react";
import StatCard from "./Partials/StatCard";
import { faUserAlt, faBlog, faEye, faFolder, faComment} from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "@/libs/axios";
import { StatFrequency } from "@/types/StatTypes";
import { useTranslation } from "react-i18next";

const StatsSection = () => {
  const { t } = useTranslation();

  const [frequency, setFrequency] = useState<StatFrequency>("all-time");
  
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
    getStats().finally(() => {
    });
  }, [frequency]);



  const stats = [
    {
      icon: faUserAlt,
      title: t('admin.stats.users'),
      value: values.totalUsers,
      description: t('admin.stats.total_users')
    },
    {
      icon: faBlog,
      title: t('admin.stats.posts'),
      value: values.totalPosts,
      description: t('admin.stats.total_posts')
    },
    {
      icon: faEye,
      title: t('admin.stats.views'),
      value: values.totalViews,
      description: t('admin.stats.total_views')
    },
    {
      icon: faFolder,
      title: t('admin.stats.categories'),
      value: values.totalCategories,
      description: t('admin.stats.total_categories')
    },
    {
      icon: faComment,
      title: t('admin.stats.comments'),
      value: values.totalComments,
      description: t('admin.stats.total_comments')
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
          <option value="fiveMin">{t('admin.stats.last_5_minutes')}</option>
          <option value="hourly">{t('admin.stats.last_hour')}</option>
          <option value="daily">{t('admin.stats.daily')}</option>
          <option value="weekly">{t('admin.stats.weekly')}</option>
          <option value="monthly">{t('admin.stats.monthly')}</option>
          <option value="yearly">{t('admin.stats.yearly')}</option>
          <option value="all-time">{t('admin.stats.all_time')}</option>
        </select>
      </div>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
};

export default StatsSection;