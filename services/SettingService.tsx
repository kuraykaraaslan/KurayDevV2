//SettingService.tsx

import { Setting } from "@prisma/client";
import prisma from "@/libs/prisma";

export default class SettingService {

    static async getSettings(): Promise<Setting[]> {
        return await prisma.setting.findMany();
    }

    static async getSettingByKey(key: string): Promise<Setting | null> {
        return await prisma.setting.findFirst({
            where: {
                key: key
            }
        });
    }

    static async createSetting(key: string, value: string): Promise<Setting> {
        const existingSetting = await this.getSettingByKey(key);
        if (existingSetting) {
            return await prisma.setting.update({
                where: {
                    key: key
                },
                data: {
                    value: value
                }
            });
        }

        return await prisma.setting.create({
            data: {
                key: key,
                value: value
            }
        });
    }
    
    static async deleteSetting(key: string): Promise<Setting | null> {
        const existingSetting = await this.getSettingByKey(key);
        if (!existingSetting) {
            return null;
        }

        return await prisma.setting.delete({
            where: {
                key: key
            }
        });
    }


}