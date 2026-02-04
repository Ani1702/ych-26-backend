const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const rounds = [
        { roundId: 0, status: 'LIVE' }, // Set Round 0 to LIVE for immediate testing
        { roundId: 1, status: 'LOCKED' },
        { roundId: 2, status: 'LOCKED' },
        { roundId: 3, status: 'LOCKED' },
    ];

    for (const round of rounds) {
        await prisma.round.upsert({
            where: { roundId: round.roundId },
            update: {},
            create: round,
        });
    }

    console.log('Rounds seeded successfully');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
