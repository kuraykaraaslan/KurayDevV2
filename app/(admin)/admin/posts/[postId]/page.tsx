'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';
import Editor from '@/components/admin/UI/Forms/Editor';
import { toast } from 'react-toastify';
import ImageLoad from '@/components/common/UI/Images/ImageLoad';
import AIPrompt from '@/components/admin/Features/AIPrompt';
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect';
import useGlobalStore from '@/libs/zustand';
import FormHeader from '@/components/admin/UI/Forms/FormHeader';
import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import DynamicDate from '@/components/admin/UI/Forms/DynamicDate';
import GenericElement from '@/components/admin/UI/Forms/GenericElement';
import Form from '@/components/admin/UI/Forms/Form';
import LanguageSelector, { SUPPORTED_LANGUAGES, TranslationStatus } from '@/components/admin/UI/Forms/LanguageSelector';
import {
  PostStatus,
  EditorTranslation,
  EditorTranslationsState,
  EMPTY_EDITOR_TRANSLATION
} from '@/types/content/BlogTypes';

const SinglePost = () => {

  const { user } = useGlobalStore();

  const localStorageKey = 'post_drafts';
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

  // Current language for editing
  const [currentLang, setCurrentLang] = useState('en');

  // Translations state - stores content for each language
  const [translations, setTranslations] = useState<EditorTranslationsState>({
    en: { ...EMPTY_EDITOR_TRANSLATION },
  });

  // Common fields (not translated)
  const [image, setImage] = useState('');
  const [authorId, setAuthorId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<PostStatus>('DRAFT');
  const [createdAt, setCreatedAt] = useState<Date>(new Date());
  const [views, setViews] = useState<number>(0);

  // Helper to get current translation
  const currentTranslation = translations[currentLang] || EMPTY_EDITOR_TRANSLATION;

  // Helper to update current translation
  const updateTranslation = useCallback((field: keyof EditorTranslation, value: string | string[]) => {
    setTranslations(prev => ({
      ...prev,
      [currentLang]: {
        ...(prev[currentLang] || EMPTY_EDITOR_TRANSLATION),
        [field]: value,
      },
    }));
  }, [currentLang]);

  // Shorthand setters for current language
  const setTitle = (val: string) => updateTranslation('title', val);
  const setContent = (val: string) => updateTranslation('content', val);
  const setDescription = (val: string) => updateTranslation('description', val);
  const setSlug = (val: string) => updateTranslation('slug', val);
  const setKeywords = (val: string[]) => updateTranslation('keywords', val);

  // Get values for current language
  const title = currentTranslation.title;
  const content = currentTranslation.content;
  const description = currentTranslation.description;
  const slug = currentTranslation.slug;
  const keywords = currentTranslation.keywords;

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

  // Postu yükle (edit modda) - tüm dillerdeki çevirileri yükle
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
        // Tüm dillerdeki çevirileri yükle
        const loadedTranslations: EditorTranslationsState = {};

        // Her dil için ayrı istek at (paralel)
        const requests = SUPPORTED_LANGUAGES.map(lang =>
          axiosInstance.get('/api/posts', {
            params: { postId: routePostId, status: 'ALL', lang: lang.code },
          }).then(res => ({ lang: lang.code, data: res.data }))
            .catch(() => ({ lang: lang.code, data: null }))
        );

        const results = await Promise.all(requests);

        let firstPost: any = null;

        for (const result of results) {
          const posts = result.data?.posts ?? [];
          const post = posts.find((p: any) => p.postId === routePostId);

          if (post && post.title) {
            loadedTranslations[result.lang] = {
              title: post.title ?? '',
              content: post.content ?? '',
              description: post.description ?? '',
              slug: post.slug ?? '',
              keywords: Array.isArray(post.keywords) ? post.keywords : [],
            };

            if (!firstPost) {
              firstPost = post;
            }
          }
        }

        if (!firstPost) {
          toast.error('Post not found');
          return;
        }

        if (cancelled) return;

        // Ortak alanları ilk bulunan post'tan al
        setImage(firstPost.image ?? '');
        setAuthorId(firstPost.authorId ?? '');
        setCategoryId(firstPost.categoryId ?? '');
        setStatus((firstPost.status as PostStatus) ?? 'DRAFT');
        setCreatedAt(firstPost.createdAt ? new Date(firstPost.createdAt) : new Date());
        setViews(typeof firstPost.views === 'number' ? firstPost.views : 0);

        // Translations state'ini güncelle
        setTranslations(loadedTranslations);

        // İlk mevcut dili seç
        const firstLang = Object.keys(loadedTranslations)[0] || 'en';
        setCurrentLang(firstLang);

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

  // Auto Save Draft to LocalStorage
  useEffect(() => {
    if (loading) return;

    const draft = {
      translations,
      authorId,
      categoryId,
      status,
      image,
      currentLang,
    };

    try {
      const caches = localStorage.getItem(localStorageKey);
      let parsedCaches: Record<string, any> = {};

      try {
        parsedCaches = caches ? JSON.parse(caches) : {};
      } catch {
        parsedCaches = {};
      }

      parsedCaches[routePostId as string] = draft;
      localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches));
    } catch (err) {
      console.error('Draft autosave error:', err);
    }
  }, [
    translations,
    authorId,
    categoryId,
    status,
    image,
    loading,
    currentLang,
    routePostId,
  ]);


  // Load Draft from LocalStorage
  useEffect(() => {
    try {
      const caches = localStorage.getItem(localStorageKey);
      if (!caches) return;

      const parsed = JSON.parse(caches);
      const draft = parsed[routePostId as string];
      if (!draft) return;

      if (draft.translations) {
        setTranslations(draft.translations);
      }
      setAuthorId(draft.authorId ?? '');
      setCategoryId(draft.categoryId ?? '');
      setStatus(draft.status ?? 'DRAFT');
      setImage(draft.image ?? '');
      if (draft.currentLang) {
        setCurrentLang(draft.currentLang);
      }

      toast.info('Draft loaded from browser');
    } catch (err) {
      console.error('Draft load error', err);
    }
  }, [routePostId]);


  const handleSubmit = async () => {
    // En az bir dilde içerik olmalı
    const filledTranslations = Object.entries(translations).filter(
      ([, t]) => t.title.trim() && (typeof t.content === 'string' && t.content.trim()) && t.slug.trim()
    );

    if (filledTranslations.length === 0) {
      toast.error('At least one language must have title, content, and slug');
      return;
    }

    // Geçerli dilde zorunlu alanları kontrol et
    const errors: string[] = [];
    if (!authorId) errors.push('Author is required');
    if (!categoryId) errors.push('Category is required');

    // Mevcut dilde zorunlu alanlar
    if (!title.trim()) errors.push(`Title is required for ${currentLang.toUpperCase()}`);
    if (typeof content !== 'string' || !content.trim()) errors.push(`Content is required for ${currentLang.toUpperCase()}`);
    if (!slug.trim()) errors.push(`Slug is required for ${currentLang.toUpperCase()}`);

    if (errors.length) {
      errors.forEach((msg) => toast.error(msg));
      return;
    }

    // Translations'ı API formatına çevir
    const translationsArray = Object.entries(translations)
      .filter(([, t]) => t.title.trim() || (typeof t.content === 'string' && t.content.trim()))
      .map(([lang, t]) => ({
        language: lang,
        title: t.title,
        content: t.content,
        description: t.description,
        slug: t.slug,
        keywords: t.keywords,
      }));

    const body = {
      postId: routePostId !== 'create' ? routePostId : undefined,
      // Backward compatibility - varsayılan dildeki değerler
      title: translations['en']?.title || title,
      content: translations['en']?.content || content,
      description: translations['en']?.description || description,
      slug: translations['en']?.slug || slug,
      keywords: translations['en']?.keywords || keywords,
      // Common fields
      authorId,
      categoryId,
      status,
      createdAt,
      views,
      image,
      // New: translations array
      translations: translationsArray,
    };

    try {
      if (mode === 'create') {
        await axiosInstance.post('/api/posts', body);
        toast.success('Post created successfully');
      } else {
        await axiosInstance.put('/api/posts/', body);
        toast.success('Post updated successfully');
      }

      // Clear draft from localStorage after successful save
      try {
        const caches = localStorage.getItem(localStorageKey);
        if (caches) {
          const parsed = JSON.parse(caches);
          delete parsed[routePostId as string];
          localStorage.setItem(localStorageKey, JSON.stringify(parsed));
          console.log('Draft cache cleared after save');
        }
      } catch (err) {
        console.error('Failed to clear cache after save:', err);
      }

      router.push('/admin/posts');
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? 'Save failed');
    }
  };

  // Dil ekleme/kaldırma fonksiyonları
  const addLanguage = (langCode: string) => {
    if (!translations[langCode]) {
      setTranslations(prev => ({
        ...prev,
        [langCode]: { ...EMPTY_EDITOR_TRANSLATION },
      }));
    }
    setCurrentLang(langCode);
  };

  const removeLanguage = (langCode: string) => {
    if (Object.keys(translations).length <= 1) {
      toast.error('At least one language is required');
      return;
    }
    setTranslations(prev => {
      const newTranslations = { ...prev };
      delete newTranslations[langCode];
      return newTranslations;
    });
    // Başka bir dile geç
    const remainingLangs = Object.keys(translations).filter(l => l !== langCode);
    if (remainingLangs.length > 0) {
      setCurrentLang(remainingLangs[0]);
    }
  };

  // Çeviri durumunu kontrol et
  const getTranslationStatus = (langCode: string): TranslationStatus => {
    const t = translations[langCode];
    if (!t) return 'empty';
    if (t.title && t.content && t.slug) return 'complete';
    if (t.title || t.content || t.slug) return 'partial';
    return 'empty';
  };

  // Cache temizleme fonksiyonu
  const clearDraftCache = () => {
    try {
      const caches = localStorage.getItem(localStorageKey);
      if (caches) {
        const parsed = JSON.parse(caches);
        delete parsed[routePostId as string];
        localStorage.setItem(localStorageKey, JSON.stringify(parsed));
        toast.success('Draft cache cleared');

        // Sayfayı yeniden yükle
        if (mode === 'edit') {
          window.location.reload();
        } else {
          // Create modda state'leri sıfırla
          setTranslations({ en: { ...EMPTY_EDITOR_TRANSLATION } });
          setImage('');
          setAuthorId('');
          setCategoryId('');
          setStatus('DRAFT');
          setCreatedAt(new Date());
          setViews(0);
          setCurrentLang('en');
        }
      } else {
        toast.info('No draft cache found');
      }
    } catch (err) {
      console.error('Clear cache error:', err);
      toast.error('Failed to clear cache');
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
          onClick: () => router.push('/admin/posts'),
          className: 'btn-secondary',
        },
      ]}
    >
      <FormHeader
        title={mode === 'create' ? 'Create Post' : 'Edit Post'}
        className="my-4"
        actionButtons={[
          {
            element: (
              <AIPrompt
                setTitle={setTitle}
                setContent={setContent}
                setDescription={setDescription}
                setKeywords={setKeywords}
                setSlug={setSlug}
                setCreatedAt={setCreatedAt}
                toast={toast}
              />
            ),
          },
          {
            text: 'Clear Cache',
            className: 'btn-sm btn-warning',
            onClick: clearDraftCache,
          },
          {
            text: 'Back to Posts',
            className: 'btn-sm btn-primary',
            onClick: () => router.push('/admin/posts'),
          },
        ]}
      />

      <LanguageSelector
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeLanguages={Object.keys(translations)}
        onAddLanguage={addLanguage}
        onRemoveLanguage={removeLanguage}
        getTranslationStatus={getTranslationStatus}
      />

      <DynamicText
        label={`Title (${currentLang.toUpperCase()})`}
        placeholder='Title'
        value={title}
        setValue={setTitle}
        size="md"
      />

      <DynamicSelect
        label="Status"
        selectedValue={status}
        onValueChange={(value) => setStatus(value as PostStatus)}
        options={[
          { value: 'DRAFT', label: 'Draft' },
          { value: 'PUBLISHED', label: 'Published' },
          { value: 'ARCHIVED', label: 'Archived' },
        ]}
      />

      <DynamicSelect
        label="Category"
        endpoint="/api/categories"
        dataKey="categories"
        valueKey="categoryId"
        labelKey="title"
        searchKey="search"
        selectedValue={categoryId}
        onValueChange={setCategoryId}
        placeholder="Kategori Seçin"
        searchPlaceholder="Kategori ara..."
        debounceMs={400}
      />


      <DynamicDate
        label="Created At"
        value={createdAt}
        onChange={setCreatedAt}
      />

      <DynamicText
        label='Views'
        placeholder='Views'
        value={String(views)}
        setValue={(val) => setViews(Number(val))}
        size="md"
      />

      <GenericElement label={`Content (${currentLang.toUpperCase()})`}>
        <Editor
          key={currentLang} // Force re-render when language changes
          value={content || ''}
          onChange={(newValue) => setContent(newValue)}
        />
      </GenericElement>

      <DynamicText
        label={`Description (${currentLang.toUpperCase()})`}
        placeholder='Description'
        value={description}
        setValue={setDescription}
        size="md"
        isTextarea={true}
      />

      <DynamicText
        label={`Slug (${currentLang.toUpperCase()})`}
        placeholder='Slug'
        value={slug}
        setValue={setSlug}
        size="md"
      />

      <DynamicText
        label={`Keywords (${currentLang.toUpperCase()})`}
        placeholder='Keywords (comma separated)'
        value={keywords ? keywords.join(', ') : ''}
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

      <DynamicSelect
        label="Author"
        key={routePostId + '_author_select'}
        endpoint="/api/users"
        dataKey="users"
        valueKey="userId"
        labelKey={["userProfile.name", "email"]}
        searchKey="search"
        selectedValue={authorId}
        onValueChange={setAuthorId}
        placeholder="Select Author"
        searchPlaceholder="Search users..."
        debounceMs={400}
        disabled={user?.userRole !== 'ADMIN'}
        disabledError="You can only change if you are admin"
      />

      <GenericElement label="Image">
        <ImageLoad
          image={image}
          setImage={setImage}
          uploadFolder="posts"
          toast={toast}
        />
      </GenericElement>
    </Form>
  );
};

export default SinglePost;
