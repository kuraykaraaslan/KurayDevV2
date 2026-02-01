'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import ImageLoad from '@/components/common/UI/Images/ImageLoad';
import FormHeader from '@/components/admin/UI/Forms/FormHeader';
import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import GenericElement from '@/components/admin/UI/Forms/GenericElement';
import Form from '@/components/admin/UI/Forms/Form';

const SingleCategory = () => {
  const localStorageKey = 'category_drafts';

  const params = useParams<{ categoryId: string }>();
  const routeCategoryId = params?.categoryId;
  const router = useRouter();

  const mode: 'create' | 'edit' = useMemo(
    () => (routeCategoryId === 'create' ? 'create' : 'edit'),
    [routeCategoryId]
  );

  const [loading, setLoading] = useState(true);

  // Model fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [image, setImage] = useState('');

  // Slug generation (only in create mode and after loading)
  useEffect(() => {
    if (mode === 'edit' || loading) return;
    if (!title) return;

    const invalidChars = /[^\w\s-]/g;
    let slugifiedTitle = title.replace(invalidChars, '');
    slugifiedTitle = slugifiedTitle.replace(/\s+/g, '-');
    slugifiedTitle = slugifiedTitle.replace(/--+/g, '-');
    slugifiedTitle = slugifiedTitle.toLowerCase();

    setSlug(slugifiedTitle);
  }, [title, mode, loading]);

  // Load category (in edit mode)
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!routeCategoryId) {
        setLoading(false);
        return;
      }
      if (routeCategoryId === 'create') {
        setLoading(false);
        return;
      }

      try {
        const res = await axiosInstance.get(`/api/categories/${routeCategoryId}`);
        const category = res.data?.category;

        if (!category) {
          toast.error('Category not found');
          return;
        }
        if (cancelled) return;

        setTitle(category.title ?? '');
        setDescription(category.description ?? '');
        setSlug(category.slug ?? '');
        setKeywords(Array.isArray(category.keywords) ? category.keywords : []);
        setImage(category.image ?? '');
      } catch (error: any) {
        console.error(error);
        toast.error(error?.response?.data?.message ?? 'Failed to load category');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [routeCategoryId]);

  // Auto Save Draft to LocalStorage
  useEffect(() => {
    if (loading) return;

    const draft = {
      title,
      description,
      slug,
      keywords,
      image,
    };

    try {
      const caches = localStorage.getItem(localStorageKey);
      let parsedCaches: Record<string, any> = {};

      try {
        parsedCaches = caches ? JSON.parse(caches) : {};
      } catch {
        parsedCaches = {};
      }

      parsedCaches[routeCategoryId] = draft;
      localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches));
    } catch (err) {
      console.error('Draft autosave error:', err);
    }
  }, [title, description, slug, keywords, image, loading, routeCategoryId]);

  // Load Draft from LocalStorage
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey);
      if (!caches) return;

      const parsed = JSON.parse(caches);
      const draft = parsed[routeCategoryId];
      if (!draft) return;

      setTitle(draft.title ?? '');
      setDescription(draft.description ?? '');
      setSlug(draft.slug ?? '');
      setKeywords(draft.keywords ?? []);
      setImage(draft.image ?? '');

      toast.info('Draft loaded from browser');
    } catch (err) {
      console.error('Draft load error', err);
    }
  }, []);

  const handleSubmit = async () => {
    const errors: string[] = [];
    const required: Record<string, unknown> = {
      title,
      description,
      slug,
    };

    for (const [key, val] of Object.entries(required)) {
      if (typeof val === 'string' && val.trim() === '') {
        errors.push(`${key} is required`);
      }
    }

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg));
      return;
    }

    const body = {
      categoryId: routeCategoryId !== 'create' ? routeCategoryId : undefined,
      title,
      description,
      slug,
      keywords,
      image,
    };

    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/categories', body);
        toast.success('Category created successfully');
      } else {
        await axiosInstance.put(`/api/categories/${routeCategoryId}`, body);
        toast.success('Category updated successfully');
      }
      router.push('/admin/categories');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed');
    }
  };

  return (
    <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
      actions={[
        {
          label: 'Save',
          onClick: handleSubmit,
          className: 'btn-primary',
        },
        {
          label: 'Cancel',
          onClick: () => router.push('/admin/categories'),
          className: 'btn-secondary',
        },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Create Category' : 'Edit Category'}
        className="my-4"
        actionButtons={[
          {
            text: 'Back to Categories',
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/categories'),
          },
        ]}
      />

      <DynamicText
        label="Title"
        placeholder="Title"
        value={title}
        setValue={setTitle}
        size="md"
      />

      <DynamicText
        label="Description"
        placeholder="Description"
        value={description}
        setValue={setDescription}
        size="md"
        isTextarea={true}
      />

      <DynamicText
        label="Slug"
        placeholder="Slug"
        value={slug}
        setValue={setSlug}
        size="md"
      />

      <DynamicText
        label="Keywords"
        placeholder="Keywords"
        value={keywords.join(',')}
        setValue={(val) =>
          setKeywords(
            val
              .split(',')
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          )
        }
        size="md"
      />

      <GenericElement label="Image">
        <ImageLoad
          image={image}
          setImage={setImage}
          uploadFolder="categories"
          toast={toast}
        />
      </GenericElement>
    </Form>
  );
};

export default SingleCategory;
