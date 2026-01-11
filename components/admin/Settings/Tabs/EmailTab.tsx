'use client';

import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect';

export default function EmailTab() {
    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">SMTP Configuration</h3>
                    <p className="text-sm text-base-content/60 mb-4">Email server settings</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="SMTP Host"
                            placeholder="smtp.example.com"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="SMTP Port"
                            type="number"
                            placeholder="587"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="SMTP Username"
                            placeholder="user@example.com"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="SMTP Password"
                            type="password"
                            placeholder="********"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicSelect
                            label="Encryption"
                            selectedValue=""
                            onValueChange={() => {}}
                            options={[
                                { value: 'tls', label: 'TLS' },
                                { value: 'ssl', label: 'SSL' },
                                { value: 'none', label: 'None' },
                            ]}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Email Defaults</h3>
                    <p className="text-sm text-base-content/60 mb-4">Default email settings</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="From Email"
                            type="email"
                            placeholder="noreply@example.com"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="From Name"
                            placeholder="My Website"
                            value=""
                            setValue={() => {}}
                            disabled
                        />
                    </div>

                    <div className="mt-4">
                        <button className="btn btn-outline btn-sm" disabled>
                            Send Test Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
