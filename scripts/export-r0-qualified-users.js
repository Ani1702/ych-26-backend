const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

function escapeCsvField(field) {
    if (field === null || field === undefined) {
        return '';
    }
    const stringValue = typeof field === 'object' ? JSON.stringify(field) : String(field);
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

async function main() {
    const outputPath = process.argv[2] || 'qualified_users_export.csv';
    console.log(`Exporting qualified users to ${outputPath}...`);

    // Find all teams with round0Status = QUALIFIED
    const qualifiedTeams = await prisma.team.findMany({
        where: {
            round0Status: 'QUALIFIED'
        }
    });

    if (qualifiedTeams.length === 0) {
        console.log('No qualified teams found.');
        return;
    }

    console.log(`Found ${qualifiedTeams.length} qualified teams.`);

    const userRecords = [];

    // For each qualified team, get all team members
    for (const team of qualifiedTeams) {
        const teamMemberEmails = [team.teamLeader, ...team.teamMembers];

        // Fetch user details for all team members
        const users = await prisma.user.findMany({
            where: {
                email: {
                    in: teamMemberEmails
                }
            }
        });

        // Create records with team information
        for (const user of users) {
            const isLeader = user.email === team.teamLeader;
            userRecords.push({
                regNo: user.regNo,
                name: user.name,
                email: user.email,
                gender: user.gender,
                hostelBlock: user.hostelBlock,
                roomNo: user.roomNo || '',
                mobileNo: user.mobileNo,
                teamCode: team.teamId,
                teamName: team.teamName,
                isTeamLeader: isLeader ? 'Yes' : 'No'
            });
        }
    }

    if (userRecords.length === 0) {
        console.log('No user records found.');
        return;
    }

    // Define CSV headers
    const headers = [
        'regNo',
        'name',
        'email',
        'gender',
        'hostelBlock',
        'roomNo',
        'mobileNo',
        'teamCode',
        'teamName',
        'isTeamLeader'
    ];

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const record of userRecords) {
        const row = headers.map(header => escapeCsvField(record[header]));
        csvRows.push(row.join(','));
    }

    fs.writeFileSync(outputPath, csvRows.join('\n'));
    console.log(`Export completed. Wrote ${userRecords.length} user records from ${qualifiedTeams.length} qualified teams to ${outputPath}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
