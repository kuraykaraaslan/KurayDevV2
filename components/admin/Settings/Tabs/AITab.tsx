'use client';

import DynamicText from '@/components/admin/UI/Forms/DynamicText';
import DynamicSelect from '@/components/admin/UI/Forms/DynamicSelect';
import DynamicToggle from '@/components/admin/UI/Forms/DynamicToggle';

export default function AITab() {
    return (
        <div className="space-y-6">
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">OpenAI Configuration</h3>
                    <p className="text-sm text-base-content/60 mb-4">GPT and DALL-E settings</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="API Key"
                            type="password"
                            placeholder="sk-..."
                            value=""
                            setValue={() => {}}
                            className="md:col-span-2"
                            disabled
                        />

                        <DynamicSelect
                            label="Default Model"
                            selectedValue=""
                            onValueChange={() => {}}
                            options={[
                                { value: 'gpt-4o', label: 'gpt-4o' },
                                { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
                                { value: 'gpt-4-turbo', label: 'gpt-4-turbo' },
                                { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
                            ]}
                            disabled
                        />

                        <DynamicText
                            label="Max Tokens"
                            type="number"
                            placeholder="4096"
                            value=""
                            setValue={() => {}}
                            disabled
                        />
                    </div>

                    <DynamicToggle
                        label="Enable AI Features"
                        description="Allow AI-powered translations and content generation"
                        checked={false}
                        onChange={() => {}}
                        className="mt-4"
                        disabled
                    />
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Anthropic Configuration</h3>
                    <p className="text-sm text-base-content/60 mb-4">Claude API settings</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="API Key"
                            type="password"
                            placeholder="sk-ant-..."
                            value=""
                            setValue={() => {}}
                            className="md:col-span-2"
                            disabled
                        />

                        <DynamicSelect
                            label="Default Model"
                            selectedValue=""
                            onValueChange={() => {}}
                            options={[
                                { value: 'claude-3-5-sonnet-latest', label: 'claude-3-5-sonnet-latest' },
                                { value: 'claude-3-5-haiku-latest', label: 'claude-3-5-haiku-latest' },
                                { value: 'claude-3-opus-latest', label: 'claude-3-opus-latest' },
                            ]}
                            disabled
                        />
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h3 className="card-title text-lg">Usage Limits</h3>
                    <p className="text-sm text-base-content/60 mb-4">AI usage restrictions</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DynamicText
                            label="Daily Request Limit"
                            type="number"
                            placeholder="1000"
                            value=""
                            setValue={() => {}}
                            disabled
                        />

                        <DynamicText
                            label="Monthly Token Budget"
                            type="number"
                            placeholder="1000000"
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
