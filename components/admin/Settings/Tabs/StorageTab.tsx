'use client';

import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect';
import GenericElement from '@/components/admin/UI/Forms/GenericElement';

export default function StorageTab() {
    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Storage Provider</h3>
                    <p className="text-sm text-base-content/60 mb-4">File storage configuration</p>

                    <DynamicSelect
                        label="Provider"
                        selectedValue=""
                        onValueChange={() => {}}
                        options={[
                            { value: 'local', label: 'Local' },
                            { value: 's3', label: 'AWS S3' },
                            { value: 'gcs', label: 'Google Cloud Storage' },
                            { value: 'azure', label: 'Azure Blob' },
                            { value: 'r2', label: 'Cloudflare R2' },
                        ]}
                        className="max-w-xs"
                        disabled
                    />
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">S3 Configuration</h3>
                    <p className="text-sm text-base-content/60 mb-4">AWS S3 or compatible storage</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="Bucket Name"
                            placeholder="my-bucket"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Region"
                            placeholder="eu-central-1"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Access Key ID"
                            type="password"
                            placeholder="********"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Secret Access Key"
                            type="password"
                            placeholder="********"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <GenericElement label="Custom Endpoint (optional)" className="md:col-span-2">
                            <input
                                type="url"
                                placeholder="https://s3.custom-endpoint.com"
                                className="input input-md w-full"
                                disabled
                            />
                            <label className="label">
                                <span className="label-text-alt">For S3-compatible services like MinIO, R2</span>
                            </label>
                        </GenericElement>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Upload Limits</h3>
                    <p className="text-sm text-base-content/60 mb-4">File upload restrictions</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="Max File Size (MB)"
                            type="number"
                            placeholder="10"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Allowed Extensions"
                            placeholder="jpg,png,gif,pdf"
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
