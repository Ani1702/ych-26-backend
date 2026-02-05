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
    const outputPath = process.argv[2] || 'submissions_export.csv';
    console.log(`Exporting submissions to ${outputPath}...`);

    const submissions = await prisma.submission.findMany();

    if (submissions.length === 0) {
        console.log('No submissions found.');
        return;
    }

    const headers = Object.keys(submissions[0]);

    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const sub of submissions) {
        const row = headers.map(header => escapeCsvField(sub[header]));
        csvRows.push(row.join(','));
    }

    fs.writeFileSync(outputPath, csvRows.join('\n'));
    console.log(`Export completed. Wrote ${submissions.length} records to ${outputPath}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
