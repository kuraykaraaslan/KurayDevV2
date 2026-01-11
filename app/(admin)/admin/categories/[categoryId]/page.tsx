'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import LanguageSelector, { SUPPORTED_LANGUAGES, TranslationStatus, TranslateRequest } from '@/components/admin/UI/Forms/LanguageSelector';
import FormHeader from '@/components/admin/UI/Forms/FormHeader';
import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import GenericElement from '@/components/admin/UI/Forms/GenericElement';
import Form from '@/components/admin/UI/Forms/Form';
import ImageLoad from '@/components/common/UI/Images/ImageLoad';
import {
    EditorTranslation,
    EditorTranslationsState,
    EMPTY_EDITOR_TRANSLATION
} from '@/types/content/BlogTypes';

const EditCategory = () => {
    const localStorageKey = 'category_drafts';

    const params = useParams<{ categoryId: string }>();
    const routeCategoryId = params.categoryId;
    const router = useRouter();

    const mode: 'create' | 'edit' = useMemo(
        () => (routeCategoryId === 'create' ? 'create' : 'edit'),
        [routeCategoryId]
    );

    const [loading, setLoading] = useState(true);

    // Current language for editing
    const [currentLang, setCurrentLang] = useState('en');

    // Translations state
    const [translations, setTranslations] = useState<EditorTranslationsState>({
        en: { ...EMPTY_EDITOR_TRANSLATION },
    });

    // Common fields (not translated)
    const [keywords, setKeywords] = useState<string[]>([]);
    const [image, setImage] = useState<string>('');
    const [isTranslating, setIsTranslating] = useState(false);

    // Helper to get current translation
    const currentTranslation = translations[currentLang] || EMPTY_EDITOR_TRANSLATION;

    // Helper to update current translation
    const updateTranslation = useCallback((field: keyof EditorTranslation, value: string) => {
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
    const setDescription = (val: string) => updateTranslation('description', val);
    const setSlug = (val: string) => updateTranslation('slug', val);

    // Get values for current language
    const title = currentTranslation.title;
    const description = currentTranslation.description;
    const slug = currentTranslation.slug;

    // Load category data (edit mode)
    useEffect(() => {
        if (routeCategoryId === 'create') {
            setLoading(false);
            return;
        }

        const fetchCategory = async () => {
            try {
                // Load translations for all languages
                const loadedTranslations: EditorTranslationsState = {};

                const requests = SUPPORTED_LANGUAGES.map(lang =>
                    axiosInstance.get(`/api/categories/${routeCategoryId}`, {
                        params: { lang: lang.code }
                    }).then(res => ({ lang: lang.code, data: res.data }))
                        .catch(() => ({ lang: lang.code, data: null }))
                );

                const results = await Promise.all(requests);

                let firstCategory: any = null;

                for (const result of results) {
                    const category = result.data?.category;

                    if (category && category.title) {
                        loadedTranslations[result.lang] = {
                            title: category.title ?? '',
                            description: category.description ?? '',
                            slug: category.slug ?? '',
                        };

                        if (!firstCategory) {
                            firstCategory = category;
                        }
                    }
                }

                if (firstCategory) {
                    setKeywords(firstCategory.keywords || []);
                    setImage(firstCategory.image || '');
                    setTranslations(loadedTranslations);

                    // Select first available language
                    const firstLang = Object.keys(loadedTranslations)[0] || 'en';
                    setCurrentLang(firstLang);
                }

                setLoading(false);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load category');
                setLoading(false);
            }
        };

        fetchCategory();
    }, [routeCategoryId]);

    // Auto-generate slug from title (create mode only)
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

    // Auto Save Draft to LocalStorage
    useEffect(() => {
        if (loading) return;

        const draft = {
            translations,
            keywords,
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

            parsedCaches[routeCategoryId as string] = draft;
            localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches));
        } catch (err) {
            console.error('Draft autosave error:', err);
        }
    }, [
        translations,
        keywords,
        image,
        loading,
        currentLang,
        routeCategoryId,
    ]);

    // Load Draft from LocalStorage
    useEffect(() => {
        try {
            const caches = localStorage.getItem(localStorageKey);
            if (!caches) return;

            const parsed = JSON.parse(caches);
            const draft = parsed[routeCategoryId as string];
            if (!draft) return;

            if (draft.translations) {
                setTranslations(draft.translations);
            }
            setKeywords(draft.keywords ?? []);
            setImage(draft.image ?? '');
            if (draft.currentLang) {
                setCurrentLang(draft.currentLang);
            }

            toast.info('Draft loaded from browser');
        } catch (err) {
            console.error('Draft load error', err);
        }
    }, [routeCategoryId]);

    // Language management functions
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
        const remainingLangs = Object.keys(translations).filter(l => l !== langCode);
        if (remainingLangs.length > 0) {
            setCurrentLang(remainingLangs[0]);
        }
    };

    const getTranslationStatus = (langCode: string): TranslationStatus => {
        const t = translations[langCode];
        if (!t) return 'empty';
        if (t.title && t.description && t.slug) return 'complete';
        if (t.title || t.description || t.slug) return 'partial';
        return 'empty';
    };

    // Translation handler
    const handleTranslateRequest = async (request: TranslateRequest) => {
        const { sourceLang, targetLang, fields } = request;
        const sourceTranslation = translations[sourceLang];

        if (!sourceTranslation) {
            toast.error('Source language has no content');
            return;
        }

        setIsTranslating(true);

        try {
            const response = await axiosInstance.post('/api/ai/translate', {
                content: {
                    title: sourceTranslation.title,
                    description: sourceTranslation.description,
                    slug: sourceTranslation.slug,
                },
                fields,
                sourceLang,
                targetLang,
            });

            const translated = response.data.translated;

            // Update target language with translated content
            setTranslations(prev => ({
                ...prev,
                [targetLang]: {
                    ...(prev[targetLang] || EMPTY_EDITOR_TRANSLATION),
                    ...translated,
                },
            }));

            // Switch to target language
            setCurrentLang(targetLang);

            toast.success(`Translated ${fields.length} field(s) successfully`);
        } catch (error: any) {
            console.error('Translation error:', error);
            toast.error(error?.response?.data?.message || 'Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    // Cache temizleme fonksiyonu
    const clearDraftCache = () => {
        try {
            const caches = localStorage.getItem(localStorageKey);
            if (caches) {
                const parsed = JSON.parse(caches);
                delete parsed[routeCategoryId as string];
                localStorage.setItem(localStorageKey, JSON.stringify(parsed));
                toast.success('Draft cache cleared');

                // Sayfayı yeniden yükle
                if (mode === 'edit') {
                    window.location.reload();
                } else {
                    // Create modda state'leri sıfırla
                    setTranslations({ en: { ...EMPTY_EDITOR_TRANSLATION } });
                    setImage('');
                    setKeywords([]);
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

    const handleSubmit = async () => {
        // Validate at least one complete translation
        const filledTranslations = Object.entries(translations).filter(
            ([, t]) => t.title.trim() && t.slug.trim()
        );

        if (filledTranslations.length === 0) {
            toast.error('At least one language must have title and slug');
            return;
        }

        // Validate current language
        if (!title.trim()) {
            toast.error(`Title is required for ${currentLang.toUpperCase()}`);
            return;
        }

        if (!slug.trim()) {
            toast.error(`Slug is required for ${currentLang.toUpperCase()}`);
            return;
        }

        // Build translations array
        const translationsArray = Object.entries(translations)
            .filter(([, t]) => t.title.trim())
            .map(([lang, t]) => ({
                language: lang,
                title: t.title,
                description: t.description,
                slug: t.slug,
            }));

        const blogCategory = {
            categoryId: mode === 'edit' ? routeCategoryId : undefined,
            // Backward compatibility
            title: translations['en']?.title || title,
            description: translations['en']?.description || description,
            slug: translations['en']?.slug || slug,
            keywords: keywords,
            image: image || null,
            // New translations
            translations: translationsArray,
        };

        try {
            if (mode === 'create') {
                await axiosInstance.post('/api/categories', blogCategory);
                toast.success('Category created successfully');
            } else {
                await axiosInstance.put('/api/categories', blogCategory);
                toast.success('Category updated successfully');
            }

            // Clear draft from localStorage after successful save
            try {
                const caches = localStorage.getItem(localStorageKey);
                if (caches) {
                    const parsed = JSON.parse(caches);
                    delete parsed[routeCategoryId as string];
                    localStorage.setItem(localStorageKey, JSON.stringify(parsed));
                    console.log('Draft cache cleared after save');
                }
            } catch (err) {
                console.error('Failed to clear cache after save:', err);
            }

            router.push('/admin/categories');
        } catch (error: any) {
            console.error(error);
            toast.error(error?.response?.data?.message || 'Failed to save category');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto flex justify-center items-center h-64">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <Form
      className="mx-auto mb-8 bg-base-300 p-6 rounded-lg shadow max-w-7xl"
            actions={[
                {
                    label: mode === 'create' ? 'Create Category' : 'Update Category',
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
                        text: 'Clear Cache',
                        className: 'btn-sm btn-warning',
                        onClick: clearDraftCache,
                    },
                    {
                        text: 'Back to Categories',
                        className: 'btn-sm btn-primary',
                        onClick: () => router.push('/admin/categories'),
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
                onTranslateRequest={handleTranslateRequest}
                isTranslating={isTranslating}
                availableFields={['title', 'description', 'slug']}
            />

            <DynamicText
                label={`Title (${currentLang.toUpperCase()})`}
                placeholder="Title"
                value={title}
                setValue={setTitle}
                size="md"
            />

            <DynamicText
                label={`Description (${currentLang.toUpperCase()})`}
                placeholder="Description"
                value={description}
                setValue={setDescription}
                size="md"
                isTextarea={true}
            />

            <DynamicText
                label={`Slug (${currentLang.toUpperCase()})`}
                placeholder="Slug"
                value={slug}
                setValue={setSlug}
                size="md"
            />

            <DynamicText
                label="Keywords"
                placeholder="Keywords (comma separated)"
                value={keywords.join(', ')}
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
}

export default EditCategory;
