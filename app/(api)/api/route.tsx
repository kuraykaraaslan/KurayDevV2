import React from 'react';

const NotFoundPage: React.FC = () => {
    return (
        <div className="text-center">
        <p className="font-semibold text-5xl ">4d04</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Page not found</h1>
        <p className="mt-6 text-base leading-7">Sorry, we couldn’t find the page you’re looking for.</p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <a
            href="#"
            className="rounded-md py-2 px-4 font-semibold bg-primary"
          >
            Go back home
          </a>
        </div>
      </div>
    );
};

export default NotFoundPage;