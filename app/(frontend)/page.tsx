'use client';
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const WelcomePage = () => {

  const router = useRouter();

  useEffect(() => {
    router.push('/en');
  }, []);

  return (
    <section className="h-screen flex items-center justify-center bg-base-100">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
          <p className="mb-4 text-lg font-light">Loading...</p>
        </div>
      </div>
    </section>
  );
}

export default WelcomePage;