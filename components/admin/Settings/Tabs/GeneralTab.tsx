'use client';

import DynamicText from '@/components/admin/UI/Forms/DynamicText';

export default function GeneralTab() {
    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Site Information</h3>
                    <p className="text-sm text-base-content/60 mb-4">Basic site configuration</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="Site Name"
                            placeholder="My Website"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Site URL"
                            type="url"
                            placeholder="https://example.com"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Site Description"
                            placeholder="A brief description of your site"
                            value=""
                            setValue={() => {}}
                            isTextarea
                            rows={3}
                            className="md:col-span-2"
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Branding</h3>
                    <p className="text-sm text-base-content/60 mb-4">Logo and visual identity</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="Logo URL"
                            type="url"
                            placeholder="https://example.com/logo.png"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Favicon URL"
                            type="url"
                            placeholder="https://example.com/favicon.ico"
                            value=""
                            setValue={() => {}}
                            disabled
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
