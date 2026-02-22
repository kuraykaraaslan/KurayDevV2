import { ImageResponse } from 'next/og'
import PostService from '@/services/PostService'

export async function GET(_request: NextRequest) {
  const { posts } = await PostService.getAllPosts({ page: 1, pageSize: 10, search: undefined })

  // Convert posts to JSX list items
  const listItems = posts.slice(0, 10).map((post, index) => (
    <div
      key={post.title}
      style={{
        fontSize: 15,
        width: 850,
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        padding: '20px',
        position: 'absolute',
        top: index * 30,
      }}
    >
      &#8226; {post.title.length > 100 ? post.title.substring(0, 100) + '...' : post.title}
    </div>
  ))

  return new ImageResponse(
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
      <ul style={{ padding: 0 }}>{listItems}</ul>
    </div>,
    {
      width: 900,
      height: 350,
    }
  )
}
