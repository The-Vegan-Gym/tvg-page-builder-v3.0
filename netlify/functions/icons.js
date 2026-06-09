const fs = require('fs');
const path = require('path');

exports.handler = async () => {
    try {
        const iconsDir = path.join(process.cwd(), 'equipment');
        const entries = fs.readdirSync(iconsDir, { withFileTypes: true });
        const icons = entries
            .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.svg')
            .map((entry) => {
                const baseName = path.basename(entry.name, '.svg');
                return {
                    id: slugify(baseName),
                    name: titleizeIconName(baseName),
                    path: `/equipment/${encodeURIComponent(entry.name)}`
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ icons })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: error.message || 'Unable to read equipment folder' })
        };
    }
};

function titleizeIconName(value) {
    return String(value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value) {
    return String(value || '')
        .toLowerCase()
        .trim()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
