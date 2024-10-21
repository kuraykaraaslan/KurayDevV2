import React from 'react';

const Newsletter: React.FC = () => {
    return (
        <div className="bg-base-300 py-16 px-6">
            <div className="max-w-5xl mx-auto text-center">
                <h2 className="text-5xl font-bold mb-6">Subscribe to my newsletter</h2>
                <p className="text-base">Stay up to date! Get all the latest & greatest posts delivered straight to your inbox</p>
                <div className="mt-12 flex items-center overflow-hidden rounded-md max-w-xl mx-auto">
                    <input type="email" placeholder="Enter your email" className="w-full bg-transparent py-3.5 px-4 text-base focus:outline-none" />
                    <button className="bg-primary text-white text-base tracking-wide py-3.5 px-6 hover:shadow-md hover:transition-transform transition-transform hover:scale-105 focus:outline-none">
                        Subscribe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Newsletter;