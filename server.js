const http = require('http');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const PORT = Number(process.env.PORT) || 3000;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const BRAND_GREEN = '#42d53b';
const TEXT_DARK = '#2f343b';
const TEXT_MUTED = '#616161';
const BORDER = '#e0e0e0';

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/export-pdf') {
        handlePdfExport(req, res);
        return;
    }

    if (req.method === 'GET' && req.url.split('?')[0] === '/api/icons') {
        handleIconsList(req, res);
        return;
    }

    serveStaticFile(req, res);
});

function handleIconsList(req, res) {
    const iconsDir = path.join(__dirname, 'equipment');

    fs.readdir(iconsDir, { withFileTypes: true }, (err, entries) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unable to read equipment folder' }));
            return;
        }

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

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ icons }));
    });
}

function titleizeIconName(value) {
    return String(value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function serveStaticFile(req, res) {
    const requestPath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(__dirname, requestPath);

    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
    });
}

function handlePdfExport(req, res) {
    readJsonBody(req)
        .then((recipe) => {
            const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
            const filename = `${getExportTitle(recipe)}.pdf`.replace(/"/g, '');

            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            });

            doc.pipe(res);
            drawRecipePdf(doc, normalizeRecipe(recipe));
            doc.end();
        })
        .catch((error) => {
            console.error('PDF export error:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message || 'Unable to export PDF' }));
        });
}

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 20 * 1024 * 1024) {
                reject(new Error('Request body is too large'));
                req.destroy();
            }
        });

        req.on('end', () => {
            try {
                resolve(JSON.parse(body || '{}'));
            } catch {
                reject(new Error('Invalid JSON payload'));
            }
        });

        req.on('error', reject);
    });
}

function normalizeRecipe(recipe = {}) {
    return {
        ...recipe,
        macros: recipe.macros || {},
        imageSettings: recipe.imageSettings || { scale: 100, posX: 50, posY: 50 },
        materials: Array.isArray(recipe.materials) ? recipe.materials : [],
        ingredientSections: Array.isArray(recipe.ingredientSections) ? recipe.ingredientSections : [],
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        instructionSections: Array.isArray(recipe.instructionSections) ? recipe.instructionSections : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        notes: Array.isArray(recipe.notes) ? recipe.notes : []
    };
}

function drawRecipePdf(doc, recipe) {
    const layout = {
        marginX: 50,
        y: 0,
        columnGap: 32,
        footerY: PAGE_HEIGHT - 35
    };
    layout.columnWidth = (PAGE_WIDTH - (layout.marginX * 2) - layout.columnGap) / 2;

    drawHero(doc, recipe, layout);
    drawMacroBar(doc, recipe, layout);
    drawDescription(doc, recipe, layout);

    const contentTop = layout.y + 18;
    drawDivider(doc, layout.marginX, contentTop - 8, PAGE_WIDTH - layout.marginX);

    const left = { x: layout.marginX, y: contentTop, width: layout.columnWidth };
    const right = { x: layout.marginX + layout.columnWidth + layout.columnGap, y: contentTop, width: layout.columnWidth };

    drawMaterialsPlaceholder(doc, recipe, left);
    drawIngredients(doc, recipe, left);
    drawInstructions(doc, recipe, right);
    drawNotes(doc, recipe, right);
    drawPageNumber(doc, recipe);
}

function drawHero(doc, recipe, layout) {
    const isPrinterFriendly = recipe.pageStyle === 'printer-friendly';
    const heroHeight = isPrinterFriendly ? 120 : (Number.parseInt(recipe.heroHeight, 10) || 309);
    const titleFontSize = Number.parseInt(recipe.titleFontSize, 10) || (isPrinterFriendly ? 28 : 40);

    doc.save();
    doc.rect(0, 0, PAGE_WIDTH, heroHeight).fill(isPrinterFriendly ? '#ffffff' : '#efefef');

    if (!isPrinterFriendly && recipe.image) {
        const imageBuffer = dataUrlToBuffer(recipe.image);
        if (imageBuffer) {
            try {
                drawCoverImage(doc, imageBuffer, 0, 0, PAGE_WIDTH, heroHeight, recipe.imageSettings);
            } catch (error) {
                console.warn('Unable to draw hero image in PDF:', error.message);
            }
        }
        drawHeroGradient(doc, heroHeight);
    }

    doc.font('Helvetica-Bold')
        .fontSize(titleFontSize)
        .fillColor(isPrinterFriendly ? '#222222' : '#ffffff')
        .text(String(recipe.title || 'Recipe Title').toUpperCase(), layout.marginX, heroHeight - (isPrinterFriendly ? 52 : 80), {
            width: PAGE_WIDTH - (layout.marginX * 2),
            lineGap: 2
        });

    doc.restore();
    layout.y = heroHeight;
}

function drawHeroGradient(doc, heroHeight) {
    const steps = 18;
    for (let i = 0; i < steps; i += 1) {
        const ratio = i / steps;
        const y = heroHeight * (0.45 + (ratio * 0.55));
        const h = (heroHeight * 0.55) / steps;
        doc.rect(0, y, PAGE_WIDTH, h).fillOpacity(0.08 + (ratio * 0.42)).fill('#000000');
    }
    doc.fillOpacity(1);
}

function drawMacroBar(doc, recipe, layout) {
    if (recipe.showMacroBar === false || !hasMacroData(recipe.macros)) {
        return;
    }

    const barText = `${recipe.macros.calories || '0'} CAL  |  ${recipe.macros.protein || '0'} G PROTEIN  |  ${recipe.macros.carbs || '0'} G CARBS  |  ${recipe.macros.fat || '0'} G FAT`;
    const barX = layout.marginX;
    const barY = layout.y - 12;
    const barWidth = Math.min(PAGE_WIDTH - (layout.marginX * 2), doc.widthOfString(barText) + 48);
    const barHeight = 27;
    const color = recipe.pageStyle === 'printer-friendly' ? '#d9d9d9' : BRAND_GREEN;

    doc.roundedRect(barX, barY, barWidth, barHeight, 5).fill(color);
    doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#000000')
        .text(barText, barX + 20, barY + 8, { width: barWidth - 40 });
}

function drawDescription(doc, recipe, layout) {
    if (recipe.showDescription === false) {
        return;
    }

    const y = layout.y + 34;
    const text = recipe.description || 'Recipe description goes here...';

    doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(TEXT_MUTED)
        .text(text, layout.marginX, y, {
            width: PAGE_WIDTH - (layout.marginX * 2),
            lineGap: 2
        });

    layout.y = doc.y + 16;
}

function drawMaterialsPlaceholder(doc, recipe, column) {
    if (!recipe.materials || recipe.materials.length === 0) {
        return;
    }

    drawSectionTitle(doc, 'MATERIALS', column.x, column.y, column.width);
    column.y += 26;
    doc.font('Helvetica')
        .fontSize(8)
        .fillColor('#888888')
        .text('Equipment icons skipped in editable PDF v1.', column.x, column.y, { width: column.width });
    column.y = doc.y + 18;
}

function drawIngredients(doc, recipe, column) {
    const sections = recipe.ingredientSections.length > 0
        ? recipe.ingredientSections
        : [{ label: recipe.servingsLabel || 'Ingredients', ingredients: recipe.ingredients || [] }];

    sections.forEach((section, index) => {
        if (index > 0) column.y += 12;
        column.y = ensureSpace(doc, column.y, 70);
        drawSectionTitle(doc, section.label || 'INGREDIENTS', column.x, column.y, column.width);
        column.y += 27;

        (section.ingredients || []).forEach((ingredient) => {
            column.y = ensureSpace(doc, column.y, 24);
            const rowTop = column.y;
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor(TEXT_DARK)
                .text(ingredient.name || '', column.x, rowTop, { width: column.width * 0.58 });
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor(TEXT_DARK)
                .text(ingredient.amount || '', column.x + (column.width * 0.6), rowTop, {
                    width: column.width * 0.4,
                    align: 'right'
                });
            const rowHeight = Math.max(doc.heightOfString(ingredient.name || '', { width: column.width * 0.58 }), 14);
            doc.moveTo(column.x, rowTop + rowHeight + 4).lineTo(column.x + column.width, rowTop + rowHeight + 4).strokeColor(BORDER).lineWidth(0.75).stroke();
            column.y = rowTop + rowHeight + 9;
        });
    });
}

function drawInstructions(doc, recipe, column) {
    const sections = recipe.instructionSections.length > 0
        ? recipe.instructionSections
        : [{ label: recipe.instructionsLabel || 'Instructions', steps: recipe.instructions || [] }];

    sections.forEach((section, sectionIndex) => {
        if (sectionIndex > 0) column.y += 12;
        column.y = ensureSpace(doc, column.y, 75);
        drawPillHeader(doc, section.label || 'INSTRUCTIONS', column.x, column.y);
        column.y += 44;

        (section.steps || []).forEach((step, index) => {
            const stepText = typeof step === 'string' ? step : (step.text || '');
            const checkboxItems = typeof step === 'object' && Array.isArray(step.checkboxItems) ? step.checkboxItems : [];
            const textHeight = doc.heightOfString(stepText, { width: column.width - 38 });
            column.y = ensureSpace(doc, column.y, textHeight + 34 + (checkboxItems.length * 16));

            doc.roundedRect(column.x, column.y - 2, 20, 20, 3).fill('#b2b2b2');
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(String(index + 1), column.x, column.y + 3, {
                width: 20,
                align: 'center'
            });

            doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXT_DARK).text(stepText, column.x + 36, column.y, {
                width: column.width - 36,
                lineGap: 2
            });
            column.y = Math.max(column.y + 24, doc.y + 8);

            checkboxItems.forEach((item) => {
                column.y = ensureSpace(doc, column.y, 18);
                doc.rect(column.x + 36, column.y + 1, 8, 8).strokeColor('#bdbdbd').lineWidth(0.75).stroke();
                doc.font('Helvetica').fontSize(8.5).fillColor(TEXT_DARK).text(item, column.x + 50, column.y - 1, {
                    width: column.width - 50
                });
                column.y = doc.y + 3;
            });
        });
    });
}

function drawNotes(doc, recipe, column) {
    (recipe.notes || []).forEach((note) => {
        const height = Math.max(52, doc.heightOfString(note, { width: column.width - 54 }) + 24);
        column.y = ensureSpace(doc, column.y + 12, height + 12);
        doc.roundedRect(column.x, column.y, column.width, height, 5).fill('#dbdbdb');
        doc.font('Helvetica-Bold').fontSize(18).fillColor('#000000').text('!', column.x + 18, column.y + 15, {
            width: 20,
            align: 'center'
        });
        doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXT_MUTED).text(note, column.x + 48, column.y + 14, {
            width: column.width - 62,
            lineGap: 2
        });
        column.y += height + 8;
    });
}

function drawPageNumber(doc, recipe) {
    if (!recipe.pageNumber) return;

    doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(TEXT_MUTED)
        .text(String(recipe.pageNumber), PAGE_WIDTH - 80, PAGE_HEIGHT - 35, { width: 30, align: 'right' });
}

function drawSectionTitle(doc, label, x, y, width) {
    doc.font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#000000')
        .text(String(label || '').toUpperCase(), x, y, { width });
}

function drawPillHeader(doc, label, x, y) {
    const text = String(label || '').toUpperCase();
    const width = Math.min(PAGE_WIDTH - 100, doc.font('Helvetica-Bold').fontSize(11).widthOfString(text) + 38);
    doc.roundedRect(x, y, width, 28, 5).fill('#000000');
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff').text(text, x + 18, y + 9, { width: width - 36 });
}

function drawDivider(doc, x1, y, x2) {
    doc.moveTo(x1, y).lineTo(x2, y).strokeColor(BORDER).lineWidth(0.75).stroke();
}

function ensureSpace(doc, y, neededHeight) {
    if (y + neededHeight <= PAGE_HEIGHT - 60) {
        return y;
    }

    doc.addPage({ size: 'A4', margin: 0 });
    return 50;
}

function hasMacroData(macros = {}) {
    return ['calories', 'protein', 'carbs', 'fat'].some((key) => String(macros[key] || '').trim());
}

function dataUrlToBuffer(dataUrl) {
    const match = String(dataUrl || '').match(/^data:image\/(?:png|jpeg|jpg);base64,(.+)$/);
    return match ? Buffer.from(match[1], 'base64') : null;
}

function drawCoverImage(doc, imageBuffer, x, y, width, height, imageSettings = {}) {
    const posX = Math.min(100, Math.max(0, imageSettings.posX ?? 50)) / 100;
    const posY = Math.min(100, Math.max(0, imageSettings.posY ?? 50)) / 100;

    doc.save();
    doc.rect(x, y, width, height).clip();
    doc.image(imageBuffer, x, y, {
        fit: [width, height],
        cover: [width, height],
        align: posX < 0.33 ? 'left' : (posX > 0.66 ? 'right' : 'center'),
        valign: posY < 0.33 ? 'top' : (posY > 0.66 ? 'bottom' : 'center')
    });
    doc.restore();
}

function slugify(value) {
    return String(value || 'recipe')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'recipe';
}

function getExportTitle(recipe = {}) {
    const title = String(recipe.title || '').trim() || 'Recipe';
    const suffixes = [];

    if (recipe.pageStyle === 'printer-friendly' && !/(^| - )Printer Friendly( - |$)/i.test(title)) {
        suffixes.push('Printer Friendly');
    }

    if (recipe.showMacroBar === false && !/(^| - )no macros( - |$)/i.test(title)) {
        suffixes.push('no macros');
    }

    return [title, ...suffixes].join(' - ');
}

server.listen(PORT, () => {
    console.log(`\nRecipe Page Generator running at http://localhost:${PORT}\n`);
});
