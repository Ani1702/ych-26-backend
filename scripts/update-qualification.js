const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('Usage: node scripts/update-qualification.js <path-to-csv>');
        process.exit(1);
    }

    const completedRound = await prisma.round.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { roundId: 'desc' }
    });

    if (!completedRound) {
        console.error('No round is currently COMPLETED. Aborting.');
        process.exit(1);
    }

    console.log(`Found COMPLETED round: ${completedRound.roundId}`);

    const roundKey = `round${completedRound.roundId}Status`;

    if (completedRound.roundId < 0 || completedRound.roundId > 3) {
        console.error(`Completed round ID ${completedRound.roundId} does not match known status fields.`);
        process.exit(1);
    }

    const nextRoundId = completedRound.roundId + 1;
    let nextRoundKey = null;
    if (nextRoundId <= 3) {
         nextRoundKey = `round${nextRoundId}Status`;
    }

    console.log(`Processing qualification for round: ${completedRound.roundId}`);
    console.log(`Teams in list will be set to QUALIFIED for ${roundKey}`);
    console.log(`All other teams will be set to NOT_QUALIFIED for ${roundKey}${nextRoundKey ? ' and ' + nextRoundKey : ''}`);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.trim().split('\n');
    const qualifiedTeamIds = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',');

        if (i === 0 && (line.toLowerCase().includes('teamid') || line.toLowerCase().includes('qualificationstatus'))) {
            console.log('Skipping header row...');
            continue;
        }

        const teamId = parts[0].trim();
        if (teamId) {
            qualifiedTeamIds.push(teamId);
        }
    }

    console.log(`Found ${qualifiedTeamIds.length} teams to qualify.`);

    // 1. Update Qualified Teams
    if (qualifiedTeamIds.length > 0) {
        try {
            const qualifiedUpdate = await prisma.team.updateMany({
                where: {
                    teamId: { in: qualifiedTeamIds }
                },
                data: {
                    [roundKey]: 'QUALIFIED'
                }
            });
            console.log(`SUCCESS: Updated ${qualifiedUpdate.count} teams to QUALIFIED.`);
        } catch (error) {
            console.error('Error updating qualified teams:', error);
        }
    } else {
        console.log('No teams found in the provided list to qualify.');
    }

    // 2. Update Disqualified Teams
    const disqualifyData = {
        [roundKey]: 'NOT_QUALIFIED'
    };
    
    if (nextRoundKey) {
        disqualifyData[nextRoundKey] = 'NOT_QUALIFIED';
    }

    try {
        const disqualifiedUpdate = await prisma.team.updateMany({
            where: {
                teamId: { notIn: qualifiedTeamIds }
            },
            data: disqualifyData
        });
        console.log(`SUCCESS: Updated ${disqualifiedUpdate.count} teams to NOT_QUALIFIED.`);
    } catch (error) {
        console.error('Error updating disqualified teams:', error);
    }

    console.log('--------------------------------------------------');
    console.log(`Processing Complete.`);
}

main()
    .catch(e => {
        console.error('Unexpected error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
