'use client'
import Table, {
    TableProvider,
    TableHeader,
    TableBody,
    TableFooter,
    ImageCell,
    ColumnDef,
    ActionButton
} from '@/components/admin/UI/Tables/DynamicTable';
import { Post } from '@/types/content/BlogTypes';
import axiosInstance from '@/libs/axios';
import { useTranslation } from 'react-i18next';

const PostPage = () => {
    const { t } = useTranslation();

    const columns: ColumnDef<Post>[] = [
        { key: 'image', header: 'Image', className: 'w-16', accessor: (p) => <ImageCell src={p.image} alt={p.title} /> },
        { key: 'title', header: 'Title', accessor: (p) => p.title },
        { key: 'slug', header: 'admin.posts.slug', accessor: (p) => p.slug },
        { key: 'status', header: 'admin.posts.status', accessor: (p) => p.status },
    ];

    const actions: ActionButton<Post>[] = [
        { label: 'admin.posts.edit', href: (p) => `/admin/posts/${p.postId}`, className: 'btn-primary' },
        { label: 'admin.posts.view', href: (p) => `/blog/${p.slug}`, className: 'btn-secondary' },
        { 
            label: 'admin.posts.delete', 
            onClick: async (p) => {
                if (!confirm(t('admin.posts.confirm_delete'))) return;
                await axiosInstance.delete(`/api/posts/${p.postId}`);
            },
            className: 'text-danger',
            hideOnMobile: true,
        },
    ];

    return (
        <TableProvider<Post>
            apiEndpoint="/api/posts"
            dataKey="posts"
            idKey="postId"
            columns={columns}
            actions={actions}
            additionalParams={{ sort: 'desc', status: 'ALL' }}
        >
            <Table>
                <TableHeader
                    title="admin.posts.title"
                    searchPlaceholder="admin.posts.search_placeholder"
                    buttonText="admin.posts.create_post"
                    buttonLink="/admin/posts/create"
                />
                <TableBody />
                <TableFooter
                    showingText="admin.posts.showing"
                    previousText="admin.posts.previous"
                    nextText="admin.posts.next"
                />
            </Table>
        </TableProvider>
    );
}

export default PostPage;