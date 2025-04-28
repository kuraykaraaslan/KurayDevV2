import 'react-toastify/dist/ReactToastify.css';
import { notFound } from 'next/navigation';

export default async function ({ params }: { params: { categorySlug: string } }) {


    // Disable this page for now
    return notFound();

    return (
        <>
        </>
    );
};
