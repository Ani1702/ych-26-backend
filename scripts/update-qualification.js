const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: node scripts/update-qualification.js <path-to-csv>');
        process.exit(1);
    }

    const liveRound = await prisma.round.findFirst({
        where: { status: 'LIVE' },
    });

    if (!liveRound) {
        console.error('No round is currently LIVE. Aborting.');
        process.exit(1);
    }

    console.log(`Found LIVE round: ${liveRound.roundId}`);

    const roundKey = `round${liveRound.roundId}Status`;

    if (liveRound.roundId < 0 || liveRound.roundId > 3) {
        console.error(`Live round ID ${liveRound.roundId} does not match known status fields.`);
        process.exit(1);
    }

    console.log(`Updating field: ${roundKey} for teams listed in ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');

    let updatedCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');

        if (i === 0 && (line.toLowerCase().includes('teamid') || line.toLowerCase().includes('qualificationstatus'))) {
            console.log('Skipping header row...');
            continue;
        }

        if (parts.length < 2) {
            skippedCount++;
            continue;
        }

        const teamId = parts[0].trim();
        const status = parts[1].trim();

        try {
            await prisma.team.update({
                where: { teamId: teamId },
                data: {
                    [roundKey]: status
                }
            });
            console.log(`Updated team ${teamId} -> ${status}`);
            updatedCount++;
        } catch (error) {
            console.error(`Failed to update team ${teamId}: ${error.message.split('\n').pop()}`);
            errorCount++;
        }
    }

    console.log('--------------------------------------------------');
    console.log(`Processing Complete.`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Errors : ${errorCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

main()
    .catch(e => {
        console.error('Unexpected error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
