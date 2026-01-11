'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/libs/axios';
import Editor from '@/components/admin/UI/Forms/Editor';
import { toast } from 'react-toastify';
import ImageLoad from '@/components/common/UI/Images/ImageLoad';
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect';
import FormHeader from '@/components/admin/UI/Forms/FormHeader';
import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import GenericElement from '@/components/admin/UI/Forms/GenericElement';
import Form from '@/components/admin/UI/Forms/Form';
import LanguageSelector, { SUPPORTED_LANGUAGES, TranslationStatus, TranslateRequest } from '@/components/admin/UI/Forms/LanguageSelector';
import { TableBody, TableHeader, TableProvider } from '@/components/admin/UI/Forms/DynamicTable';
import {
    EditorTranslation,
    EditorTranslationsState,
    EMPTY_EDITOR_TRANSLATION
} from '@/types/content/BlogTypes';

// Project specific translation type (includes content)
interface ProjectEditorTranslation extends EditorTranslation {
    content: string;
}

const EMPTY_PROJECT_TRANSLATION: ProjectEditorTranslation = {
    ...EMPTY_EDITOR_TRANSLATION,
    content: '',
};

type ProjectTranslationsState = Record<string, ProjectEditorTranslation>;

const SingleProject = () => {
    const localStorageKey = 'project_drafts';

    const params = useParams<{ projectId: string }>();
    const routeProjectId = params?.projectId;
    const router = useRouter();

    const mode: 'create' | 'edit' = useMemo(
        () => (routeProjectId === 'create' ? 'create' : 'edit'),
        [routeProjectId]
    );

    const [loading, setLoading] = useState(true);

    // Current language for editing
    const [currentLang, setCurrentLang] = useState('en');

    // Translations state - stores content for each language
    const [translations, setTranslations] = useState<ProjectTranslationsState>({
        en: { ...EMPTY_PROJECT_TRANSLATION },
    });

    // Common fields (not translated)
    const [image, setImage] = useState('');
    const [status, setStatus] = useState<string>('PUBLISHED');
    const [platforms, setPlatforms] = useState<string[]>([]);
    const [technologies, setTechnologies] = useState<string[]>([]);
    const [projectLinks, setProjectLinks] = useState<string[]>([]);
    const [isTranslating, setIsTranslating] = useState(false);

    // Platform and technology options
    const allowedPlatforms = [
        'ui/ux', 'web', 'mobile', 'desktop', 'embedded',
        'other', 'iot', 'gaming', 'machine learning',
    ];

    const allowedTechnologies = [
        'react', 'react native', 'express', 'next', 'java',
        'python', 'c', 'c++', 'c#', 'aws', 'azure', 'gcp',
        'chrome extension', 'other'
    ];

    // Helper to get current translation
    const currentTranslation = translations[currentLang] || EMPTY_PROJECT_TRANSLATION;

    // Helper to update current translation
    const updateTranslation = useCallback((field: keyof ProjectEditorTranslation, value: string | string[]) => {
        setTranslations(prev => ({
            ...prev,
            [currentLang]: {
                ...(prev[currentLang] || EMPTY_PROJECT_TRANSLATION),
                [field]: value,
            },
        }));
    }, [currentLang]);

    // Shorthand setters for current language
    const setTitle = (val: string) => updateTranslation('title', val);
    const setContent = (val: string) => updateTranslation('content', val);
    const setDescription = (val: string) => updateTranslation('description', val);
    const setSlug = (val: string) => updateTranslation('slug', val);

    // Get values for current language
    const title = currentTranslation.title;
    const content = currentTranslation.content;
    const description = currentTranslation.description;
    const slug = currentTranslation.slug;

    // Slug generation (only in create mode)
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

    // Load project (edit mode) - load translations for all languages
    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            if (!routeProjectId) {
                setLoading(false);
                return;
            }
            if (routeProjectId === 'create') {
                setLoading(false);
                return;
            }

            try {
                const loadedTranslations: ProjectTranslationsState = {};

                // Load translations for all languages in parallel
                const requests = SUPPORTED_LANGUAGES.map(lang =>
                    axiosInstance.get('/api/projects', {
                        params: { projectId: routeProjectId, lang: lang.code },
                    }).then(res => ({ lang: lang.code, data: res.data }))
                        .catch(() => ({ lang: lang.code, data: null }))
                );

                const results = await Promise.all(requests);

                let firstProject: any = null;

                for (const result of results) {
                    const projects = result.data?.projects ?? [];
                    const project = projects.find((p: any) => p.projectId === routeProjectId);

                    if (project && project.title) {
                        loadedTranslations[result.lang] = {
                            title: project.title ?? '',
                            content: project.content ?? '',
                            description: project.description ?? '',
                            slug: project.slug ?? '',
                            keywords: [],
                        };

                        if (!firstProject) {
                            firstProject = project;
                        }
                    }
                }

                if (!firstProject) {
                    toast.error('Project not found');
                    return;
                }

                if (cancelled) return;

                // Set common fields from first found project
                setImage(firstProject.image ?? '');
                setStatus(firstProject.status ?? 'PUBLISHED');
                setPlatforms(firstProject.platforms ?? []);
                setTechnologies(firstProject.technologies ?? []);
                setProjectLinks(firstProject.projectLinks ?? []);

                // Update translations state
                setTranslations(loadedTranslations);

                // Select first available language
                const firstLang = Object.keys(loadedTranslations)[0] || 'en';
                setCurrentLang(firstLang);

            } catch (error: any) {
                console.error(error);
                toast.error(error?.response?.data?.message ?? 'Failed to load project');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [routeProjectId]);

    // Auto Save Draft to LocalStorage
    useEffect(() => {
        if (loading) return;

        const draft = {
            translations,
            status,
            platforms,
            technologies,
            projectLinks,
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

            parsedCaches[routeProjectId as string] = draft;
            localStorage.setItem(localStorageKey, JSON.stringify(parsedCaches));
        } catch (err) {
            console.error('Draft autosave error:', err);
        }
    }, [
        translations,
        status,
        platforms,
        technologies,
        projectLinks,
        image,
        loading,
        currentLang,
        routeProjectId,
    ]);

    // Load Draft from LocalStorage
    useEffect(() => {
        try {
            const caches = localStorage.getItem(localStorageKey);
            if (!caches) return;

            const parsed = JSON.parse(caches);
            const draft = parsed[routeProjectId as string];
            if (!draft) return;

            if (draft.translations) {
                setTranslations(draft.translations);
            }
            setStatus(draft.status ?? 'PUBLISHED');
            setPlatforms(draft.platforms ?? []);
            setTechnologies(draft.technologies ?? []);
            setProjectLinks(draft.projectLinks ?? []);
            setImage(draft.image ?? '');
            if (draft.currentLang) {
                setCurrentLang(draft.currentLang);
            }

            toast.info('Draft loaded from browser');
        } catch (err) {
            console.error('Draft load error', err);
        }
    }, [routeProjectId]);

    const handleSubmit = async () => {
        // At least one language must have content
        const filledTranslations = Object.entries(translations).filter(
            ([, t]) => t.title.trim() && t.content.trim() && t.slug.trim()
        );

        if (filledTranslations.length === 0) {
            toast.error('At least one language must have title, content, and slug');
            return;
        }

        // Validate current language required fields
        const errors: string[] = [];
        if (!title.trim()) errors.push(`Title is required for ${currentLang.toUpperCase()}`);
        if (!content.trim()) errors.push(`Content is required for ${currentLang.toUpperCase()}`);
        if (!slug.trim()) errors.push(`Slug is required for ${currentLang.toUpperCase()}`);
        if (platforms.length === 0) errors.push('At least one platform is required');

        if (errors.length) {
            errors.forEach((msg) => toast.error(msg));
            return;
        }

        // Convert translations to API format
        const translationsArray = Object.entries(translations)
            .filter(([, t]) => t.title.trim() || t.content.trim())
            .map(([lang, t]) => ({
                language: lang,
                title: t.title,
                content: t.content,
                description: t.description,
                slug: t.slug,
            }));

        const body = {
            projectId: routeProjectId !== 'create' ? routeProjectId : undefined,
            // Backward compatibility - default language values
            title: translations['en']?.title || title,
            content: translations['en']?.content || content,
            description: translations['en']?.description || description,
            slug: translations['en']?.slug || slug,
            // Common fields
            status,
            platforms,
            technologies,
            projectLinks,
            image,
            // New: translations array
            translations: translationsArray,
        };

        try {
            if (mode === 'create') {
                const response = await axiosInstance.post('/api/projects', body);
                toast.success('Project created successfully');
                router.push('/admin/projects/' + response.data.project.projectId);
            } else {
                await axiosInstance.put('/api/projects', body);
                toast.success('Project updated successfully');
            }

            // Clear draft from localStorage after successful save
            try {
                const caches = localStorage.getItem(localStorageKey);
                if (caches) {
                    const parsed = JSON.parse(caches);
                    delete parsed[routeProjectId as string];
                    localStorage.setItem(localStorageKey, JSON.stringify(parsed));
                    console.log('Draft cache cleared after save');
                }
            } catch (err) {
                console.error('Failed to clear cache after save:', err);
            }

            router.push('/admin/projects');
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Save failed');
        }
    };

    // Language management functions
    const addLanguage = (langCode: string) => {
        if (!translations[langCode]) {
            setTranslations(prev => ({
                ...prev,
                [langCode]: { ...EMPTY_PROJECT_TRANSLATION },
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
        if (t.title && t.content && t.slug) return 'complete';
        if (t.title || t.content || t.slug) return 'partial';
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
                    content: sourceTranslation.content,
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
                    ...(prev[targetLang] || EMPTY_PROJECT_TRANSLATION),
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

    // Cache clear function
    const clearDraftCache = () => {
        try {
            const caches = localStorage.getItem(localStorageKey);
            if (caches) {
                const parsed = JSON.parse(caches);
                delete parsed[routeProjectId as string];
                localStorage.setItem(localStorageKey, JSON.stringify(parsed));
                toast.success('Draft cache cleared');

                if (mode === 'edit') {
                    window.location.reload();
                } else {
                    setTranslations({ en: { ...EMPTY_PROJECT_TRANSLATION } });
                    setImage('');
                    setStatus('PUBLISHED');
                    setPlatforms([]);
                    setTechnologies([]);
                    setProjectLinks([]);
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
                    label: mode === 'create' ? 'Create Project' : 'Update Project',
                    onClick: handleSubmit,
                    className: 'btn-primary',
                },
                {
                    label: 'Cancel',
                    onClick: () => router.push('/admin/projects'),
                    className: 'btn-secondary',
                },
            ]}
        >
            <FormHeader
                title={mode === 'create' ? 'Create Project' : 'Edit Project'}
                className="my-4"
                actionButtons={[
                    {
                        text: 'Clear Cache',
                        className: 'btn-sm btn-warning',
                        onClick: clearDraftCache,
                    },
                    {
                        text: 'Back to Projects',
                        className: 'btn-sm btn-primary',
                        onClick: () => router.push('/admin/projects'),
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
                availableFields={['title', 'content', 'description', 'slug']}
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
                onValueChange={setStatus}
                options={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'PUBLISHED', label: 'Published' },
                    { value: 'ARCHIVED', label: 'Archived' },
                ]}
            />

            <GenericElement label={`Content (${currentLang.toUpperCase()})`}>
                <Editor
                    key={currentLang}
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

            <div className="divider">Common Fields / Ortak Alanlar</div>

            <GenericElement label="Platforms">
                <div className="flex flex-wrap gap-2">
                    {allowedPlatforms.map((platform) => (
                        <div key={platform} className="bg-base-100 p-2 rounded-lg">
                            <input
                                type='checkbox'
                                className='mr-2'
                                value={platform}
                                checked={platforms.includes(platform)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setPlatforms([...platforms, platform]);
                                    } else {
                                        setPlatforms(platforms.filter(p => p !== platform));
                                    }
                                }}
                            />
                            <span className='mt-2'>{platform}</span>
                        </div>
                    ))}
                </div>
            </GenericElement>

            <GenericElement label="Technologies">
                <div className="flex flex-wrap gap-2">
                    {allowedTechnologies.map((technology) => (
                        <div key={technology} className="bg-base-100 p-2 rounded-lg">
                            <input
                                type='checkbox'
                                className='mr-2'
                                value={technology}
                                checked={technologies.includes(technology)}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setTechnologies([...technologies, technology]);
                                    } else {
                                        setTechnologies(technologies.filter(t => t !== technology));
                                    }
                                }}
                            />
                            <span className='mt-2'>{technology}</span>
                        </div>
                    ))}
                </div>
            </GenericElement>

            <GenericElement label="Project Links">
                <TableProvider<{ id: number; link: string }>
                    localData={projectLinks.map((link, i) => ({ id: i, link }))}
                    idKey="id"
                    columns={[
                        {
                            key: 'link',
                            header: 'Link',
                            accessor: (item) => (
                                <input
                                    type="text"
                                    placeholder="Project Link"
                                    className="input input-bordered w-full"
                                    value={item.link}
                                    onChange={(e) => {
                                        const newLinks = [...projectLinks];
                                        newLinks[item.id] = e.target.value;
                                        setProjectLinks(newLinks);
                                    }}
                                />
                            ),
                        },
                    ]}
                    actions={[
                        {
                            label: 'Delete',
                            onClick: (item) => {
                                const newLinks = projectLinks.filter((_, i) => i !== item.id);
                                setProjectLinks(newLinks);
                            },
                            className: 'btn-error',
                            hideOnMobile: true,
                        },
                    ]}
                >
                    <TableHeader
                        className='p-2 -mb-8 rounded-t-lg'
                        title=""
                        actionButtonText='Add Link'
                        actionButtonEvent={() => setProjectLinks([...projectLinks, ''])}
                        titleTextClassName="text-sm font-normal"
                        searchClassName="hidden"
                    />
                    <TableBody
                        emptyText="No links added yet."
                    />
                </TableProvider>
            </GenericElement>

            <GenericElement label="Image">
                <ImageLoad
                    image={image}
                    setImage={setImage}
                    uploadFolder="projects"
                    toast={toast}
                />
            </GenericElement>
        </Form>
    );
};

export default SingleProject;
