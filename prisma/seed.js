const { Setting, PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log("Seeding default settings...");

    // ✅ Default System Settings
    const defaultSystemSettings = [
        {
            key: "ALLOW_REGISTRATION",
            value: "true",
        }
    ];

    for (const setting of defaultSystemSettings) {
        await prisma.setting.upsert({
            where: { key: setting.key },
            update: setting,
            create: setting,
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });