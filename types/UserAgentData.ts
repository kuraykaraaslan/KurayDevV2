interface UserAgentData {
    os: string | null;
    device: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    ip?: string | null;
    browser?: string | null;
}

export type { UserAgentData };