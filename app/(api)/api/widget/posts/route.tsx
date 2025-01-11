import React from 'react';
import { ImageResponse } from 'next/og';
import PostService from '@/services/PostService';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { posts } = await PostService.getAllPosts({ page: 1, pageSize: 10, search: undefined });

    // Convert posts to JSX list items
    const listItems = posts.map((post, index) => (
        <li key={post.title} style={{ marginTop: index * 20 , position: 'absolute' }}>
            {post.title}
        </li>
    ));

    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 15,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '20px',
                    position: 'relative',
                }}
            >
                <ul style={{  padding: 0 }}>{listItems}</ul>
            </div>
        ),
        {
            width: 1200,
            height: 600,
        }
    );
}
