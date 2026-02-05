const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const liveRound = await prisma.round.findFirst({
        where: { status: 'LIVE' },
    });

    if (!liveRound) {
        console.log('No round is currently LIVE.');
        process.exit(1);
    }

    console.log(`Current LIVE round: ${liveRound.roundId}`);

    await prisma.round.update({
        where: { roundId: liveRound.roundId },
        data: { status: 'COMPLETED' },
    });
    console.log(`Round ${liveRound.roundId} marked as COMPLETED.`);

    const nextRoundId = liveRound.roundId + 1;
    const nextRound = await prisma.round.findUnique({
        where: { roundId: nextRoundId },
    });

    if (nextRound) {
        await prisma.round.update({
            where: { roundId: nextRoundId },
            data: { status: 'LIVE' },
        });
        console.log(`Round ${nextRoundId} marked as LIVE.`);
    } else {
        console.log(`No Round ${nextRoundId} found. This was the final round.`);
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
