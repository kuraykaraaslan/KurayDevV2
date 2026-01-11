'use client';
import { useState, useEffect, useMemo, FormEvent, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/libs/axios';
import { toast } from 'react-toastify';
import LanguageSelector, { SUPPORTED_LANGUAGES, TranslationStatus } from '@/components/admin/UI/Forms/LanguageSelector';
import {
    EditorTranslation,
    EditorTranslationsState,
    EMPTY_EDITOR_TRANSLATION
} from '@/types/content/BlogTypes';

const EditCategory = () => {

    const params = useParams<{ categoryId: string }>();
    const routeCategoryId = params.categoryId;

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
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const router = useRouter();

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

    // Image upload functions
    const uploadImage = async () => {
        if (!imageFile) {
            return;
        }

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('folder', 'categories');

        await axiosInstance.post('/api/aws', formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        ).then((res) => {
            setImageUrl(res.data.url);
            toast.success('Image uploaded successfully');
        }).catch((error) => {
            console.error(error);
            toast.error('Failed to upload image');
        });
    }

    const uploadFromUrl = async (url: string) => {
        await axiosInstance.post('/api/aws/from-url', {
            url,
            folder: 'categories'
        }
        ).then((res) => {
            setImageUrl(res.data.url);
            toast.success('Image uploaded successfully');
        }).catch((error) => {
            console.error(error);
        });
    }

    const generateImage = async () => {
        await axiosInstance.post('/api/ai/dall-e', {
            prompt: 'create a category image for title ' + title + ' and description ' + description + ' and keywords ' + keywords.join(','),
        }).then((res) => {
            toast.success('Image generated successfully');
            setImageUrl(res.data.url);
            return res;
        }).then((res) => {
            toast.success('Now uploading image to S3');
            uploadFromUrl(res.data.url);
        }).catch((error) => {
            console.error(error);
            toast.error('Failed to generate image');
        });
    }

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
                    setImageUrl(firstCategory.image);
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

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

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
            // Backward compatibility
            title: translations['en']?.title || title,
            description: translations['en']?.description || description,
            slug: translations['en']?.slug || slug,
            keywords: keywords,
            image: imageUrl,
            // New translations
            translations: translationsArray,
        };

        try {
            if (mode === 'create') {
                await axiosInstance.post('/api/categories', blogCategory);
                toast.success('Category created successfully');
                router.push('/admin/categories');
            } else {
                await axiosInstance.put('/api/categories/' + routeCategoryId, blogCategory);
                toast.success('Category updated successfully');
                router.push('/admin/categories');
            }
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
        <>
            <div className="container mx-auto max-w-4xl">
                <div className="flex justify-between items-center flex-row">
                    <h1 className="text-3xl font-bold h-16 items-center">
                        {mode === 'create' ? 'Create Category' : 'Edit Category'}
                    </h1>
                    <div className="flex gap-2 h-16">
                        <Link className="btn btn-primary btn-sm h-12" href="/admin/categories">
                            Back to Categories
                        </Link>
                    </div>
                </div>

                <form className="bg-base-200 p-6 rounded-lg shadow-md" onSubmit={handleSubmit}>

                        <LanguageSelector
                        currentLang={currentLang}
                        onLanguageChange={setCurrentLang}
                        activeLanguages={Object.keys(translations)}
                        onAddLanguage={addLanguage}
                        onRemoveLanguage={removeLanguage}
                        getTranslationStatus={getTranslationStatus}
                        cardBgClass="bg-base-100"
                        buttonBgClass="bg-base-200"
                    />

                    {/* Title */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Title ({currentLang.toUpperCase()})</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Title"
                            className="input input-bordered"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    {/* Description */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Description ({currentLang.toUpperCase()})</span>
                        </label>
                        <textarea
                            placeholder="Description"
                            className="textarea textarea-bordered"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Slug */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Slug ({currentLang.toUpperCase()})</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Slug"
                            className="input input-bordered"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                    </div>

                    <div className="divider">Common Fields / Ortak Alanlar</div>

                    {/* Keywords (common) */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Keywords</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Keywords (comma separated)"
                            className="input input-bordered"
                            value={keywords.join(',')}
                            onChange={(e) => setKeywords(e.target.value.split(',').map(k => k.trim()).filter(k => k))}
                        />
                    </div>

                    {/* Image (common) */}
                    <div className="form-control mb-4 mt-4">
                        <label className="label">
                            <span className="label-text">Image</span>
                        </label>
                        <img
                            src={imageUrl ? imageUrl as string : '/assets/img/og.png'}
                            width={384}
                            height={256}
                            alt="Category Image"
                            className="h-64 w-96 object-cover rounded-lg"
                        />
                        <div className="relative flex justify-between items-center mt-2">
                            <input
                                type="file"
                                placeholder="Image URL"
                                className="file-input file-input-bordered flex-1"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setImageFile(file);
                                    }
                                }}
                            />
                            <div className="flex gap-2 ml-2">
                                <button type="button" className="btn btn-primary btn-sm" onClick={uploadImage}>
                                    Upload
                                </button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={generateImage}>
                                    Generate AI
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Submit buttons */}
                    <div className="flex gap-2 mt-6">
                        <button type="submit" className="btn btn-primary flex-1">
                            {mode === 'create' ? 'Create Category' : 'Update Category'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => router.push('/admin/categories')}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

export default EditCategory;
