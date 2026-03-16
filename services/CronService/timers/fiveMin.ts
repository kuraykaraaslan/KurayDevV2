import { flushClickBuffer } from '../jobs/flushClickBuffer'

export const fiveMinJobs: Array<{ name: string; handler: () => Promise<void> }> = [
    { name: 'flushClickBuffer', handler: flushClickBuffer },
]
