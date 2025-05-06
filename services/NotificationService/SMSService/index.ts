import Logger from '@/libs/logger';
import { Queue, Worker } from 'bullmq';
import redisInstance from '@/libs/redis';
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber';

// Providers
import BaseProvider from './BaseProvider';
import TwilloService from './TwilloService';
import NetGSMService from './NetGSMService';
//import ClickatellService from './ClickatellService';
//import NexmoService from './NexmoService';

export default class SMSService {
    static _initialized = false;

    static readonly phoneLibInstance = PhoneNumberUtil.getInstance();

    static readonly QUEUE_NAME = 'smsQueue';
    static readonly RATE_LIMIT_SECONDS = parseInt(process.env.RATE_LIMIT_SECONDS || '60', 10);
    static readonly RATE_LIMIT_PREFIX = 'sms:rate-limit:';

    static readonly ALLOWED_COUNTRIES = process.env.ALLOWED_COUNTRIES?.split(',');
    
    static readonly PROVIDER_MAP = new Map<string, BaseProvider>([
        ['TR', NetGSMService],
        ['US', TwilloService],
        ['GB', TwilloService],
        ['DE', TwilloService],
    ]);

    static readonly DEFAULT_PROVIDER = TwilloService;


    static readonly QUEUE = new Queue(SMSService.QUEUE_NAME, {
        connection: redisInstance,
    });

    static readonly WORKER = new Worker(
        SMSService.QUEUE_NAME,
        async (job) => {
            const { to, body } = job.data;
            Logger.info(`SMS /SMSService/Worker ${job.id} processing...`);
            await SMSService._sendShortMessage({ to, body });
        },
        {
            connection: redisInstance,
        }
    );

    static {
        if (!SMSService._initialized) {
            SMSService.WORKER.on('completed', (job) => {
                Logger.info(`SMS /SMSService/Worker ${job.id} completed`);
            });

            SMSService.WORKER.on('failed', (job, err) => {
                Logger.error(`SMS /SMSService/Worker ${(job?.id ?? 'unknown')} failed: ${err.message}`);
            });

            SMSService._initialized = true;
        }
    }

    static readonly APPLICATION_NAME = process.env.APPLICATION_NAME || 'Express Boilerplate';

    static async sendShortMessage({ to, body }: { to: string; body: string }): Promise<void> {
        if (!to?.trim() || !body?.trim()) {
            Logger.warn('SMSService: Missing phone number or message body.');
            return;
        }

        const rateLimitKey = `${SMSService.RATE_LIMIT_PREFIX}${to}`;
        const existing = await redisInstance.get(rateLimitKey);

        if (existing) {
            Logger.warn(`SMSService: Rate limit hit for ${to}. Message not queued.`);
            return;
        }

        // Set rate-limit key with expiration
        await redisInstance.set(rateLimitKey, '1', 'EX', SMSService.RATE_LIMIT_SECONDS);

        await SMSService.QUEUE.add('sendShortMessage', { to, body });
        Logger.info(`SMSService: Queued SMS to ${to}`);
    }

    static async _sendShortMessage({ to, body }: { to: string; body: string }): Promise<void> {
        if (!to?.trim() || !body?.trim()) {
            Logger.warn('SMSService: Missing phone number or message body.');
            return;
        }

        const { number, regionCode } = SMSService.getCountryCode(to) || {};

        if (!number || !regionCode) {
            Logger.error(`SMSService: Invalid phone number format for ${to}`);
            return;
        }


        // if the allowed countries are set or not empty 
        if (!SMSService.isAllowedCountry(regionCode)) {
            Logger.error(`SMSService: Country ${regionCode} is not allowed for number: ${to}`);
            return;
        }

        const service = SMSService.getServiceProvider(regionCode);

        if (!service) {
            Logger.error(`SMSService: No service provider found for region code: ${regionCode}`);
            return;
        }

        service.sendShortMessage(to, body);
    }

    static getCountryCode(phoneNumber: string): { number: string; regionCode: string } | null {
        try {

            const parsedNumber = SMSService.phoneLibInstance.parse(phoneNumber);
            const regionCode = SMSService.phoneLibInstance.getRegionCodeForNumber(parsedNumber);

            if (!regionCode) {
                Logger.error(`SMSService: Unable to get region code for number: ${phoneNumber}`);
                return null;
            }

            const number = SMSService.phoneLibInstance.format(parsedNumber, PhoneNumberFormat.E164);

            return { number, regionCode };
        } catch (error) {
            Logger.error(`SMSService: Error parsing phone number ${phoneNumber}: ${error}`);
            return null;
        }
    }

    static isAllowedCountry(regionCode: string): boolean {
        if (!SMSService.ALLOWED_COUNTRIES || SMSService.ALLOWED_COUNTRIES.length === 0) {
            return true; // No restrictions
        }
        return SMSService.ALLOWED_COUNTRIES.includes(regionCode);
    }

    /*
    * Returns the service provider based on the region code.
    * @param regionCode - The region code of the phone number.
    * @returns The service provider ('twilio' or 'netgsm') or null if not found.
    */

    static getServiceProvider(regionCode: string): BaseProvider {
        const provider = SMSService.PROVIDER_MAP.get(regionCode);

        if (provider) {
            return provider;
        }

        // Fallback to default provider if no specific provider is found
        Logger.warn(`SMSService: No specific provider found for ${regionCode}. Using default provider.`);
        return SMSService.DEFAULT_PROVIDER;
    }

}
