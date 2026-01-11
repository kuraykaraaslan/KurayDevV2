'use client';

import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle';

export default function AuthTab() {
    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Registration</h3>
                    <p className="text-sm text-base-content/60 mb-4">User registration settings</p>

                    <div className="space-y-4">
                        <DynamicToggle
                            label="Allow Registration"
                            description="Enable new user signups"
                            checked={false}
                            onChange={() => {}}
                            disabled
                        />

                        <DynamicToggle
                            label="Email Verification Required"
                            description="Require email verification before login"
                            checked={false}
                            onChange={() => {}}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Session</h3>
                    <p className="text-sm text-base-content/60 mb-4">Session and authentication settings</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="Session Duration (hours)"
                            type="number"
                            placeholder="24"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Max Login Attempts"
                            type="number"
                            placeholder="5"
                            value=""
                            setValue={() => {}}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">OAuth Providers</h3>
                    <p className="text-sm text-base-content/60 mb-4">Social login providers</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {['Google', 'GitHub', 'Microsoft', 'LinkedIn', 'Apple', 'Twitter'].map((provider) => (
                            <DynamicToggle
                                key={provider}
                                label={provider}
                                checked={false}
                                onChange={() => {}}
                                disabled
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
