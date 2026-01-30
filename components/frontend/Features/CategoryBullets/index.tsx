import Link from 'next/link';
import CategoryService from '@/services/CategoryService';
import { t } from 'i18next';

export default async function CategoryBullets() {

    const { categories } = await CategoryService.getAllCategories(0, 20);


    return (
        <section className="bg-base-300 py-12" id="categories">
            <div
                className="px-4 mx-auto max-w-screen-xl duration-1000"
            >
                <div className="mx-auto text-center">
                    <h2 className="mb-8 hidden sm:block text-3xl lg:text-4xl tracking-tight font-extrabold">
                        {t('frontend.categories')}
                    </h2>
                </div>
                <div className="flex flex-wrap justify-center">
                    {categories.map((category) => (
                        <Link
                            key={category.categoryId}
                            href={"/blog/" + category.slug}
                            className="m-2 px-4 py-2 bg-primary text-white rounded-md"
                        >
                            {category.title}
                        </Link>
                    ))}
                </div>
            </div>

            
        </section>
    );
};
