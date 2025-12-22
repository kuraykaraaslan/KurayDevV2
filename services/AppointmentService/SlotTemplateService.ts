import { Day, Slot, SlotTemplate } from '@/types/features';

import redisInstance from '@/libs/redis';

export default class SlotTemplateService {

    static SLOT_TEMPLATE_PREFIX = 'slot_template:';

    static async createOrUpdateSlotTemplate(day: Day, slots: Slot[]): Promise<SlotTemplate> {
        const key = `${this.SLOT_TEMPLATE_PREFIX}${day}`;
        const template: SlotTemplate = { day, slots };
        await redisInstance.set(key, JSON.stringify(template));
        return template;
    }

    static async getSlotTemplate(day: Day): Promise<SlotTemplate> {
        const key = `${this.SLOT_TEMPLATE_PREFIX}${day}`;
        const value = await redisInstance.get(key);
        if (value) {
            return JSON.parse(value);
        }

        return { day, slots: [] };

    }

    static async emptySlotTemplate(day: Day): Promise<SlotTemplate> {
        const key = `${this.SLOT_TEMPLATE_PREFIX}${day}`;
        const template: SlotTemplate = { day, slots: [] };
        await redisInstance.set(key, JSON.stringify(template));
        return template;
    }

    static async getAllSlotTemplates(): Promise<SlotTemplate[]> {
        const keys = await redisInstance.keys(`${this.SLOT_TEMPLATE_PREFIX}*`);
        if (keys.length === 0) return [];

        const templates = await Promise.all(keys.map(async (key) => {
            const value = await redisInstance.get(key);
            if (value) {
                return JSON.parse(value);
            }
            return null;
        }));
        return templates.filter((template): template is SlotTemplate => template !== null);
    }
}