'use cache';
// @ts-ignore
import PostService from "@/services/PostService";
import ProjectService from "@/services/ProjectService";
import { truncate } from "fs/promises";
import { MetadataRoute } from 'next'
import { NextRequest } from 'next/server'
const APP_URL = process.env.APP_URL

export default async function sitemap(request : NextRequest) : Promise<MetadataRoute.Sitemap> {

  const { projects } = await ProjectService.getAllProjects({ page: 1, pageSize: 1000});

  return projects.map(projects => {
    return {
      url: `${APP_URL}/project/${projects.slug}`,
      lastModified: projects.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7
    }
  });

}
