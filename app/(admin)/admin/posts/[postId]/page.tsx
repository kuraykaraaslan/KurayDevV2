'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { Editor } from '@tinymce/tinymce-react';
import { toast } from 'react-toastify';
import CategorySelect from '@/components/admin/Selects/CategorySelect';
import UserSelect from '@/components/admin/Selects/UserSelect';
import ImageLoad from '@/components/common/ImageLoad';
import AIPrompt from '@/components/admin/AIPrompt';

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

const SinglePost: React.FC = () => {
  // Route param (tek kaynak)
  const params = useParams<{ postId: string }>();
  const routePostId = params?.postId;
  const router = useRouter();

  // Mode, paramdan türetiliyor (state değil)
  const mode: 'create' | 'edit' = useMemo(
    () => (routePostId === 'create' ? 'create' : 'edit'),
    [routePostId]
  );

  const [loading, setLoading] = useState(true);

  // Model fields
  const [title, setTitle] = useState('');
  const [image, setImage] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [authorId, setAuthorId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<PostStatus>('DRAFT');
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const [views, setViews] = useState<number>(0);

  // Slug üretimi (sadece create modda ve loading bittiyse)
  useEffect(() => {
    if (mode === 'edit' || loading) return;
    if (!title) return;

    const invalidChars = /[^\w\s-]/g;
    let slugifiedTitle = title.replace(invalidChars, '');
    slugifiedTitle = slugifiedTitle.replace(/\s+/g, '-');
    slugifiedTitle = slugifiedTitle.replace(/--+/g, '-');
    slugifiedTitle = slugifiedTitle.toLowerCase();

    const month = createdAt.getMonth() + 1;
    const year = createdAt.getFullYear();
    const monthString = month < 10 ? `0${month}` : String(month);

    setSlug(`${slugifiedTitle}-${monthString}${year}`);
  }, [title, mode, loading, createdAt]);

  // Postu yükle (edit modda)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Param yoksa
      if (!routePostId) {
        setLoading(false);
        return;
      }
      // Create mod
      if (routePostId === 'create') {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get('/api/posts', {
          params: { postId: routePostId, status: 'ALL' },
        });

        const posts = res.data?.posts ?? [];
        const post = posts.find((p: any) => p.postId === routePostId);
        if (!post) {
          toast.error('Post not found');
          return;
        }
        if (cancelled) return;

        setTitle(post.title ?? '');
        setImage(post.image ?? '');
        setContent(post.content ?? '');
        setDescription(post.description ?? '');
        setSlug(post.slug ?? '');
        setKeywords(Array.isArray(post.keywords) ? post.keywords : []);
        setAuthorId(post.authorId ?? '');
        setCategoryId(post.categoryId ?? '');
        setStatus((post.status as PostStatus) ?? 'DRAFT');
        setCreatedAt(post.createdAt ? new Date(post.createdAt) : new Date());
        setViews(typeof post.views === 'number' ? post.views : 0);
      } catch (error: any) {
        console.error(error);
        toast.error(error?.response?.data?.message ?? 'Failed to load post');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [routePostId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Güvenli zorunlu alan kontrolü (eval YOK)
    const errors: string[] = [];
    const required: Record<string, unknown> = {
      title,
      content,
      description,
      slug,
      authorId,
      categoryId,
    };

    for (const [key, val] of Object.entries(required)) {
      if (typeof val === 'string' && val.trim() === '') {
        errors.push(`${key} is required`);
      }
      if (Array.isArray(val) && val.length === 0) {
        errors.push(`${key} is required`);
      }
    }

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg));
      return;
    }

    const body = {
      postId: routePostId !== 'create' ? routePostId : undefined,
      title,
      content,
      description,
      slug,
      keywords,
      authorId,
      categoryId,
      status,
      createdAt,
      views,
      image,
    };

    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/posts', body);
        toast.success('Post created successfully');
      } else {
        await axiosInstance.put('/api/posts', body); // trailing slash kaldırıldı
        toast.success('Post updated successfully');
      }
      router.push('/admin/posts');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed');
    }
  };

  return (
    <>
      <div className="container mx-auto">
        <div className="flex justify-between items-center flex-row">
          <h1 className="text-3xl font-bold h-16 items-center">
            {mode === 'create' ? 'Create Post' : 'Edit Post'}
          </h1>
          <div className="flex gap-2 h-16">
            <AIPrompt
              setTitle={setTitle}
              setContent={setContent}
              setDescription={setDescription}
              setKeywords={setKeywords}
              setSlug={setSlug}
              setCreatedAt={setCreatedAt}
              toast={toast}
            />
            <Link className="btn btn-primary btn-sm h-12" href="/admin/posts">
              Back to Posts
            </Link>
          </div>
        </div>

        <form className="bg-base-200 p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              placeholder="Title"
              className="input input-bordered"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered"
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus)}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Category</span>
            </label>
            <CategorySelect
              setSelectedCategoryId={setCategoryId}
              selectedCategoryId={categoryId}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Created At</span>
            </label>
            <input
              type="date"
              placeholder="Created At"
              className="input input-bordered"
              value={isNaN(createdAt.getTime()) ? '' : createdAt.toISOString().split('T')[0]}
              onChange={(e) => setCreatedAt(new Date(e.target.value))}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Views</span>
            </label>
            <input
              type="number"
              placeholder="Views"
              className="input input-bordered"
              value={views}
              onChange={(e) => setViews(Number(e.target.value))}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Content</span>
            </label>
            <Editor
              init={{
                height: 500,
                menubar: false,
                plugins: [
                  'advlist autolink lists link image charmap print preview anchor',
                  'searchreplace visualblocks code fullscreen',
                  'insertdatetime media table paste code help wordcount',
                ],
                toolbar:
                  'undo redo | formatselect | bold italic backcolor | ' +
                  'alignleft aligncenter alignright alignjustify | ' +
                  'bullist numlist outdent indent | removeformat | help',
              }}
              apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
              value={content}
              onEditorChange={(val) => setContent(val)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              placeholder="Description"
              className="textarea textarea-bordered"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Slug</span>
            </label>
            <input
              type="text"
              placeholder="Slug"
              className="input input-bordered"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Keywords</span>
            </label>
            <input
              type="text"
              placeholder="Keywords (comma separated)"
              className="input input-bordered"
              value={keywords.join(',')}
              onChange={(e) =>
                setKeywords(
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                )
              }
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Author</span>
            </label>
            {/* key ekleyerek param değişiminde remount sağlıyoruz */}
            <UserSelect
              key={routePostId}
              setSelectedUserId={setAuthorId}
              selectedUserId={authorId}
            />
          </div>

          <div className="form-control mb-4 mt-4">
            <label className="label">
              <span className="label-text">Image</span>
            </label>
            <ImageLoad
              image={image}
              setImage={setImage}
              uploadFolder="projects"
              toast={toast}
            />
          </div>

          <button type="submit" className="btn btn-primary block w-full mt-4" disabled={loading}>
            {loading ? 'Loading...' : mode === 'create' ? 'Create Post' : 'Update Post'}
          </button>
        </form>
      </div>
    </>
  );
};

export default SinglePost;
