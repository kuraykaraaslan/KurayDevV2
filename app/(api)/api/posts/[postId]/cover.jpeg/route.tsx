import React from 'react';
import { ImageResponse } from 'next/og';
import PostService from '@/services/PostService';
import { NextRequest } from 'next/server';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { notFound } from 'next/navigation';

export async function GET(request: NextRequest,
    { params }: { params: { postId: string } }) {
    const post = await PostService.getPostById(params.postId);

    //if there is no post, return 404

    if (!post) {
        return notFound();
    }

    //if there is a image, return the image
    if (post.image) {
        return new ImageResponse(<img src={post.image} />, {    
            width: 1200,
            height: 630,
        });
    }

    const header = (
        <div style={{
            width: 1200,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center', // Center horizontally
            alignItems: 'center', // Center vertically
            textAlign: 'center',
            padding: '50px',
            position: 'absolute',
            top: 0,
            left: '50%', // Move it to the center of the screen
            transform: 'translateX(-50%)', // Offset it back by half its width
            fontWeight: 'bold',
            fontSize: post.title.length > 50 ? 40 : 60,
        }}>
            <h1 style={{ fontStyle: 'italic' }}>{post.title}</h1>
        </div>
    );

    
    
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
                    backgroundColor: '#c3c8d7',
                }}
            >
                
                {header}
            </div>
        ),
        {
            width: 1200,
            height: 630,
            headers: {
                'Cache-Control': 'public, max-age=3600',
                'Content-Type': 'image/jpeg',
            },
        }
    );
}
