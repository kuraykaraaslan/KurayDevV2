'use cache';
// @ts-ignore
import PostService from "@/services/PostService";
import { MetadataRoute } from 'next'
import { NextRequest } from 'next/server'
const APP_URL = process.env.APP_URL

export default async function sitemap(request : NextRequest) : Promise<MetadataRoute.Sitemap> {

  const { posts } = await PostService.getAllPosts({ page: 1, pageSize: 1000, onlyPublished: true });

  return posts.map(post => {
    return {
      url: `${APP_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: 'daily',
      priority: 0.7
    }
  });

}
