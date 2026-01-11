'use client';

import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle';

export default function SecurityTab() {
    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Rate Limiting</h3>
                    <p className="text-sm text-base-content/60 mb-4">API rate limit configuration</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="Requests per Minute"
                            type="number"
                            placeholder="60"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Requests per Hour"
                            type="number"
                            placeholder="1000"
                            value=""
                            setValue={() => {}}
                            disabled
                        />
                    </div>

                    <DynamicToggle
                        label="Enable Rate Limiting"
                        description="Protect API from abuse"
                        checked={false}
                        onChange={() => {}}
                        className="mt-4"
                        disabled
                    />
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">CORS Settings</h3>
                    <p className="text-sm text-base-content/60 mb-4">Cross-origin resource sharing</p>

                    <DynamicText
                        label="Allowed Origins"
                        placeholder="https://example.com&#10;https://app.example.com"
                        value=""
                        setValue={() => {}}
                        isTextarea
                        rows={3}
                        disabled
                    />
                    <p className="text-xs text-base-content/60 mt-1">
                        One origin per line. Use * for all origins.
                    </p>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Security Headers</h3>
                    <p className="text-sm text-base-content/60 mb-4">HTTP security headers</p>

                    <div className="space-y-4">
                        <DynamicToggle
                            label="Strict-Transport-Security"
                            description="Force HTTPS connections"
                            checked={false}
                            onChange={() => {}}
                            disabled
                        />

                        <DynamicToggle
                            label="X-Content-Type-Options"
                            description="Prevent MIME type sniffing"
                            checked={false}
                            onChange={() => {}}
                            disabled
                        />

                        <DynamicToggle
                            label="X-Frame-Options"
                            description="Prevent clickjacking attacks"
                            checked={false}
                            onChange={() => {}}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">IP Blocking</h3>
                    <p className="text-sm text-base-content/60 mb-4">Block specific IP addresses</p>

                    <DynamicText
                        label="Blocked IPs"
                        placeholder="192.168.1.1&#10;10.0.0.0/8"
                        value=""
                        setValue={() => {}}
                        isTextarea
                        rows={3}
                        disabled
                    />
                    <p className="text-xs text-base-content/60 mt-1">
                        One IP or CIDR range per line
                    </p>
                </div>
            </div>
        </div>
    );
}
