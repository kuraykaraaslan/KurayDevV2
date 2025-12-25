import { Category } from '@/types/content/BlogTypes';
import { ChangeEvent, useEffect, useState } from 'react';
import axiosInstance from '@/libs/axios';
import { useTranslation } from "react-i18next";

const CategorySelect = ({ selectedCategoryId, setSelectedCategoryId }: { selectedCategoryId: string, setSelectedCategoryId: (categoryId: string) => void }) => {
    const { t } = useTranslation();
    
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        axiosInstance.get('/api/categories?pageSize=100').then((response) => {
            const { categories } = response.data;
            setCategories(categories);
        });
    }, []);

    function onChange(e: ChangeEvent<HTMLSelectElement>) {
        const selectedCategory = categories.find((category) => category.categoryId === e.target.value);
        if (selectedCategory) {
            setSelectedCategoryId(selectedCategory.categoryId);
        }
    }

    return (
        <div>
            <select value={selectedCategoryId} onChange={onChange} className="select select-bordered w-full">
                <option value="">{t('admin.selects.select_category')}</option>
                {categories.map((category) => (
                    <option key={category.categoryId} value={category.categoryId}>
                        {category.title}
                    </option>
                ))}

            </select>
        </div >
    );
}

export default CategorySelect;