'use client';

import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect';
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle';

export default function SmsTab() {
    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">SMS Provider</h3>
                    <p className="text-sm text-base-content/60 mb-4">Select and configure SMS provider</p>

                    <div className="space-y-4">
                        <DynamicSelect
                            label="Provider"
                            selectedValue=""
                            onValueChange={() => {}}
                            options={[
                                { value: '', label: 'Select Provider' },
                                { value: 'twilio', label: 'Twilio' },
                                { value: 'netgsm', label: 'NetGSM' },
                                { value: 'nexmo', label: 'Nexmo' },
                                { value: 'clickatell', label: 'Clickatell' },
                            ]}
                            disabled
                        />

                        <DynamicToggle
                            label="Enable SMS"
                            description="Enable SMS notifications and OTP"
                            checked={false}
                            onChange={() => {}}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Provider Credentials</h3>
                    <p className="text-sm text-base-content/60 mb-4">API credentials for selected provider</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="API Key / Account SID"
                            type="password"
                            placeholder="********"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="API Secret / Auth Token"
                            type="password"
                            placeholder="********"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="From Number / Sender ID"
                            type="tel"
                            placeholder="+1234567890"
                            value=""
                            setValue={() => {}}
                            disabled
                        />
                    </div>

                    <div className="mt-4">
                        <button className="btn btn-outline btn-sm" disabled>
                            Send Test SMS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
