const http = require('http');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const {
    createMealPlannerRecord,
    exportRecipeToMealPlanner,
    uploadMealPlannerAttachments
} = require('./meal-planner-export');
const { generateMealPlannerMetadata } = require('./meal-planner-metadata');

loadEnvFile();

const PORT = Number(process.env.PORT) || 3000;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const BRAND_GREEN = '#42d53b';
const TEXT_DARK = '#2f343b';
const TEXT_MUTED = '#616161';
const BORDER = '#e0e0e0';
const SECTION_TITLE_TOP_GAP = 12;
const SECTION_TITLE_AFTER_GAP = 27;
const SECTION_TITLE_SPACE_NEEDED = 70;

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

    if (req.method === 'POST' && req.url === '/api/export-meal-planner') {
        handleMealPlannerExport(req, res);
        return;
    }

    if (req.method === 'POST' && req.url === '/api/generate-meal-planner-metadata') {
        handleMealPlannerMetadataGeneration(req, res);
        return;
    }

    if (req.method === 'GET' && req.url.split('?')[0] === '/api/icons') {
        handleIconsList(req, res);
        return;
    }

    if (req.method === 'POST' && req.url === '/api/generate-master-paste') {
        handleMasterPasteGeneration(req, res);
        return;
    }

    if (req.method === 'POST' && req.url === '/api/spellcheck-recipe') {
        handleRecipeSpellcheck(req, res);
        return;
    }

    serveStaticFile(req, res);
});

function loadEnvFile() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;

    const envText = fs.readFileSync(envPath, 'utf8');
    envText.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;

        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) return;

        const key = trimmed.slice(0, equalsIndex).trim();
        let value = trimmed.slice(equalsIndex + 1).trim();

        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        if (key && !process.env[key]) {
            process.env[key] = value;
        }
    });
}

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
        .then(async (recipe) => {
            const filename = `${getExportTitle(recipe)}.pdf`.replace(/"/g, '');
            const buffer = await createRecipePdfBuffer(recipe);

            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            });

            res.end(buffer);
        })
        .catch((error) => {
            console.error('PDF export error:', error);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message || 'Unable to export PDF' }));
        });
}

async function handleMealPlannerExport(req, res) {
    try {
        loadEnvFile();
        const payload = await readJsonBody(req);
        const result = await handleMealPlannerAction(payload);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
    } catch (error) {
        console.error('Meal planner export error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Unable to export to Meal Planner' }));
    }
}

async function handleMealPlannerMetadataGeneration(req, res) {
    try {
        loadEnvFile();
        const payload = await readJsonBody(req);
        const metadata = await generateMealPlannerMetadata({
            apiKey: process.env.OPENAI_API_KEY,
            recipe: payload.recipe || {}
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(metadata));
    } catch (error) {
        console.error('Meal Planner metadata generation error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Unable to generate Meal Planner metadata' }));
    }
}

function handleMealPlannerAction(payload = {}) {
    if (payload.action === 'create-record') {
        return createMealPlannerRecord(payload);
    }

    if (payload.action === 'upload-attachments') {
        return uploadMealPlannerAttachments(payload);
    }

    return exportRecipeToMealPlanner(payload, {
        createPdfBuffer: createRecipePdfBuffer
    });
}

async function createRecipePdfBuffer(recipe) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: true });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        drawRecipePdf(doc, normalizeRecipe(recipe))
            .then(() => doc.end())
            .catch(reject);
    });
}

async function handleMasterPasteGeneration(req, res) {
    try {
        loadEnvFile();
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is missing. Add OPENAI_API_KEY=your_key to .env.');
        }

        const payload = await readJsonBody(req);
        const sourceText = String(payload.text || '').trim();
        const images = Array.isArray(payload.images) ? payload.images.slice(0, 6) : [];

        if (!sourceText && images.length === 0) {
            throw new Error('Add recipe text, one or more images, or both before generating.');
        }

        const inputContent = [
            {
                type: 'input_text',
                text: `${getMasterPasteAiPrompt()}\n\nSource text from user:\n${sourceText || '(none provided)'}`
            },
            ...images
                .filter((image) => image?.dataUrl && /^data:image\/(?:png|jpe?g|webp);base64,/i.test(image.dataUrl))
                .map((image) => ({
                    type: 'input_image',
                    image_url: image.dataUrl
                }))
        ];

        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                input: [
                    {
                        role: 'user',
                        content: inputContent
                    }
                ],
                temperature: 0.2
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data?.error?.message || `OpenAI request failed with HTTP ${response.status}`;
            throw new Error(message);
        }

        const structuredText = extractResponseText(data);
        if (!structuredText) {
            throw new Error('OpenAI returned an empty response.');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: cleanStructuredOutput(structuredText) }));
    } catch (error) {
        console.error('Master paste AI generation error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Unable to generate structured recipe data' }));
    }
}

async function handleRecipeSpellcheck(req, res) {
    try {
        loadEnvFile();
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is missing. Add OPENAI_API_KEY=your_key to .env.');
        }

        const payload = await readJsonBody(req);
        const currentEquipment = Array.isArray(payload.currentEquipment)
            ? payload.currentEquipment.map((item) => ({
                id: String(item?.id || '').trim(),
                name: String(item?.name || '').trim()
            })).filter((item) => item.id || item.name)
            : [];
        const availableEquipment = Array.isArray(payload.availableEquipment)
            ? payload.availableEquipment.map((item) => ({
                id: String(item?.id || '').trim(),
                name: String(item?.name || '').trim()
            })).filter((item) => item.id && item.name).slice(0, 300)
            : [];
        const items = Array.isArray(payload.items)
            ? payload.items
                .map((item) => ({
                    id: String(item?.id || '').trim(),
                    label: String(item?.label || '').trim(),
                    text: String(item?.text || '')
                }))
                .filter((item) => item.id && item.text.trim())
                .slice(0, 500)
            : [];

        if (items.length === 0) {
            throw new Error('No editable text found to analyze.');
        }

        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                input: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'input_text',
                                text: `${getSpellcheckPrompt()}\n\nCurrently selected equipment:\n${JSON.stringify(currentEquipment, null, 2)}\n\nAvailable equipment choices:\n${JSON.stringify(availableEquipment, null, 2)}\n\nEditable text fields:\n${JSON.stringify(items, null, 2)}`
                            }
                        ]
                    }
                ],
                temperature: 0
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const message = data?.error?.message || `OpenAI request failed with HTTP ${response.status}`;
            throw new Error(message);
        }

        const responseText = extractResponseText(data);
        const parsed = parseJsonOutput(responseText);
        const itemById = new Map(items.map((item) => [item.id, item]));
        const corrections = Array.isArray(parsed?.corrections)
            ? parsed.corrections
                .map((correction) => {
                    const id = String(correction?.id || '').trim();
                    const originalItem = itemById.get(id);
                    const corrected = String(correction?.corrected || '');
                    if (!originalItem || !corrected.trim() || corrected === originalItem.text) return null;
                    return {
                        id,
                        label: originalItem.label,
                        original: originalItem.text,
                        corrected,
                        reason: String(correction?.reason || '').trim()
                    };
                })
                .filter(Boolean)
            : [];
        const selectedIds = new Set(currentEquipment.map((item) => item.id).filter(Boolean));
        const availableById = new Map(availableEquipment.map((item) => [item.id, item]));
        const availableByName = new Map(availableEquipment.map((item) => [item.name.toLowerCase(), item]));
        const equipmentSuggestions = Array.isArray(parsed?.equipmentSuggestions)
            ? parsed.equipmentSuggestions
                .map((suggestion) => {
                    const id = String(suggestion?.id || '').trim();
                    const name = String(suggestion?.name || '').trim();
                    const match = availableById.get(id) || availableByName.get(name.toLowerCase());
                    if (!match || selectedIds.has(match.id)) return null;
                    return {
                        id: match.id,
                        name: match.name,
                        reason: String(suggestion?.reason || '').trim()
                    };
                })
                .filter(Boolean)
            : [];

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ corrections, equipmentSuggestions }));
    } catch (error) {
        console.error('Recipe analysis error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message || 'Unable to analyze recipe text' }));
    }
}

function extractResponseText(response) {
    if (typeof response.output_text === 'string') {
        return response.output_text;
    }

    const chunks = [];
    (response.output || []).forEach((item) => {
        (item.content || []).forEach((content) => {
            if (typeof content.text === 'string') {
                chunks.push(content.text);
            }
        });
    });

    return chunks.join('\n').trim();
}

function cleanStructuredOutput(text) {
    const value = String(text || '').trim();
    const codeBlockMatch = value.match(/```(?:[a-zA-Z0-9_-]+)?\s*([\s\S]*?)```/);
    return (codeBlockMatch ? codeBlockMatch[1] : value).trim();
}

function parseJsonOutput(text) {
    const value = cleanStructuredOutput(text);
    try {
        return JSON.parse(value);
    } catch (error) {
        const jsonMatch = value.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('OpenAI returned invalid spellcheck JSON.');
    }
}

function getSpellcheckPrompt() {
    return `You are a careful spellchecker for a recipe page editor.

Return ONLY valid JSON in this exact shape:
{
  "corrections": [
    {
      "id": "field id from input",
      "corrected": "full corrected field text",
      "reason": "brief reason"
    }
  ],
  "equipmentSuggestions": [
    {
      "id": "available equipment id",
      "name": "available equipment name",
      "reason": "brief reason"
    }
  ]
}

Rules:
- Only correct spelling, obvious typos, accidental doubled letters, missing apostrophes, punctuation mistakes, and capitalization errors.
- Preserve the original wording, tone, voice, recipe style, line breaks, units, abbreviations, and formatting.
- Do not rewrite for style.
- Do not change nutrition numbers, measurements, serving counts, URLs, brand names, dietary abbreviations, or intentional recipe terms.
- If a field has no correction, omit it from corrections.
- The corrected value must be the full field text, not a diff.
- Also analyze the editable text for equipment used by the recipe method.
- Suggest missing equipment only when it is clearly implied by the instructions or ingredients.
- Only suggest equipment from the provided available equipment choices, and use that choice's exact id and name.
- Do not suggest equipment already listed in the currently selected equipment.`;
}

function getMasterPasteAiPrompt() {
    return `You are helping format recipe data for a Recipe Page Generator app.

Analyze the provided recipe text and images. Output ONLY structured plain text in this exact format. Do not include commentary.

::META::
Recipe Title;Meal Type;dietary flags;serves;prep time;cook time;calories;protein g;carbs g;fat g;equipment names;portion variation icon;show ingredients title yes/no;show instructions title yes/no

::TEXT::
Description or intro text

::TEXT::
Note:
Optional note or tip text

::INGREDIENTS Ingredients for 4 Servings::
Ingredient;Amount
Ingredient;Amount

If there are multiple ingredient groups or recipe components, preserve them:

::INGREDIENTS Ingredients for 4 Servings::
::TABLE Group Name::
Ingredient;Amount
Ingredient;Amount
::TABLE Another Group::
Ingredient;Amount

::DIRECTIONS::
:HEADER: First part
Step one text
Step with checkbox items
- [ ] Checkbox item one
- [ ] Checkbox item two
:HEADER: Second part
Step two text

Rules:
- Return only the final structured recipe text. A fenced code block is acceptable, but no explanation outside it.
- Use exact section headers: ::META::, ::TEXT::, ::INGREDIENTS::, ::TABLE Name::, ::DIRECTIONS::.
- META must be semicolon-separated. Use 14 fields when possible:
  1. Recipe title
  2. Meal type
  3. Dietary flags
  4. Serves
  5. Prep time
  6. Cook time
  7. Calories
  8. Protein grams
  9. Carb grams
  10. Fat grams
  11. Equipment/material names
  12. Portion variation icon name (optional; leave blank for normal recipes)
  13. Show ingredients title: yes or no
  14. Show instructions title: yes or no
- If using the older 11-field or 13-field META format, the app still accepts it and defaults missing title toggles to yes.
- If macros are unknown, use 0 for calories, protein, carbs, and fat.
- If a non-macro field is unknown, leave it blank but keep delimiters intact.
- Match the original source language as closely as possible. Preserve the source's wording, tone, ingredient names, direction phrasing, headers, and subtitles unless a format cleanup is required.
- Only improvise when the source does not include the needed information. Do not invent details, steps, section names, subtitles, ingredients, or notes when the source provides usable text.
- Serves examples: "4 Servings", "2-3 Servings", "1 Serving".
- Times should include units: "15 min", "1 hour", "30-45 min".
- Equipment names should be comma-separated and use common tool names.
- First ::TEXT:: block is the description. Additional ::TEXT:: blocks are note callouts.
- For note callouts, put the note label on the first line, usually "Note:" or "Tip:".
- Ingredient rows must be Name;Amount.
- The black ingredients title is separate from ingredient set headers.
- The black ingredients title text comes from the ::INGREDIENTS Header Text:: section line. Example: ::INGREDIENTS Ingredients for 4 Servings::.
- Optional ingredient start mode format: ::INGREDIENTS Header Text;start mode:: or ::TABLE Group Name;start mode::. Start mode must be auto, force-right-column, or force-next-page. Use force-next-page when an ingredient set should begin at the top of the next page in the app/JPEG layout.
- The black ingredients title can be hidden with META field 13 set to "no". Use "yes" by default for normal recipes.
- If the black title is hidden, still include the ::INGREDIENTS:: block so ingredient rows can be parsed.
- Use ::TABLE Group Name:: only for ingredient set headers such as Sauce, Dressing, Bowl, Filling, or Topping.
- Do not repeat "Ingredients for X Servings" as a ::TABLE name unless the source truly has an ingredient group with that exact name.
- If the source material includes ingredient subtitles or secondary labels, preserve them as ":SUBTITLE: Subtitle text" rows in the matching ingredient set.
- Use lowercase "tsp" and "tbsp".
- Use single-character fraction glyphs for common fractions: ½, ¼, ¾, ⅓, ⅔, ⅛, ⅜, ⅝, ⅞.
- Write mixed amounts like "1½ tsp", not "1 1/2 tsp".
- Directions are one step per line with no numbering.
- The black instructions title is separate from instruction set labels. The black title defaults to "Instructions for X Servings" based on META serves. It can be hidden with META field 14 set to "no". Use "yes" by default for normal recipes.
- A ::DIRECTIONS Label;step style;start mode:: label is an instruction set header. It renders like ingredient set headers, not like the black instructions title.
- Use ::DIRECTIONS Label;numbered;auto:: when the source has major direction sections such as "Part 1: Prepare", "Part 2: Cook", "Sauce", "Assemble", or "Bake".
- If the source instructions are broken into clearly separate sections, preserve those breaks as separate ::DIRECTIONS Label;numbered;auto:: blocks instead of flattening everything into one instruction set.
- Do not repeat "Instructions for X Servings" as a ::DIRECTIONS label.
- To add an unnumbered instruction header in the middle of directions, put it on its own line as ":HEADER: Header text". These headers should divide directions into parts, such as ":HEADER: Making the green goddess sauce".
- To add an unnumbered instruction subtitle, put it on its own line as ":SUBTITLE: Subtitle text". Subtitles follow the same layout and number-reset rules as headers but render without bold styling. Subtitle capitalization can be controlled in the app.
- If the source material includes subtitles inside directions, preserve them using ":SUBTITLE: Subtitle text" exactly where they appear.
- Checkbox item lines must start exactly with "- [ ]" and directly follow the parent step.`;
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

function normalizeIngredientAlignment(alignment) {
    return alignment === 'right' ? 'right' : 'left';
}

async function drawRecipePdf(doc, recipe) {
    const layout = {
        marginX: 50,
        y: 0,
        columnGap: 32,
        footerY: PAGE_HEIGHT - 35
    };
    layout.columnWidth = (PAGE_WIDTH - (layout.marginX * 2) - layout.columnGap) / 2;

    await drawHero(doc, recipe, layout);
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

async function drawHero(doc, recipe, layout) {
    const isPrinterFriendly = recipe.pageStyle === 'printer-friendly';
    const heroHeight = isPrinterFriendly ? 120 : (Number.parseInt(recipe.heroHeight, 10) || 309);
    const titleFontSize = Number.parseInt(recipe.titleFontSize, 10) || (isPrinterFriendly ? 28 : 40);
    const titleMacroSpacing = Number.parseInt(recipe.printerTitleMacroSpacing, 10);
    const spacing = Number.isFinite(titleMacroSpacing) ? Math.max(0, Math.min(200, titleMacroSpacing)) : 16;
    const titleText = String(recipe.title || 'Recipe Title').toUpperCase();
    doc.font('Helvetica-Bold').fontSize(titleFontSize);
    const titleHeight = doc.heightOfString(titleText, {
        width: PAGE_WIDTH - (layout.marginX * 2),
        lineGap: 2
    });
    const titleY = isPrinterFriendly
        ? getPrinterTitleTopPaddingForPdf(recipe)
        : Math.max(0, heroHeight - titleHeight - spacing);

    doc.save();
    doc.rect(0, 0, PAGE_WIDTH, heroHeight).fill(isPrinterFriendly ? '#ffffff' : '#efefef');

    if (!isPrinterFriendly && recipe.image) {
        const imageBuffer = await imageSourceToBuffer(recipe.image);
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
        .text(titleText, layout.marginX, titleY, {
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

function getPrinterTitleTopPaddingForPdf(recipe) {
    const parsed = Number.parseInt(recipe?.printerTitleTopPadding, 10);
    if (!Number.isFinite(parsed)) {
        return 70;
    }
    return Math.max(0, Math.min(120, parsed));
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
        : [{ label: '', ingredients: recipe.ingredients || [] }];

    const mainLabel = recipe.servingsLabel || sections[0]?.label || 'INGREDIENTS';
    if (recipe.showIngredientsHeader !== false) {
        column.y = ensureSpace(doc, column.y, 75);
        drawPillHeader(doc, mainLabel, column.x, column.y);
        column.y += 44;
    }

    sections.forEach((section, index) => {
        const amountAlignment = normalizeIngredientAlignment(section.alignment);

        if (index > 0) column.y += SECTION_TITLE_TOP_GAP;
        const sectionLabel = section.label || '';
        const shouldShowSetHeader = sectionLabel && sectionLabel !== mainLabel && sections.length > 1;
        if (shouldShowSetHeader) {
            column.y = ensureSpace(doc, column.y, SECTION_TITLE_SPACE_NEEDED);
            drawSectionTitle(doc, sectionLabel, column.x, column.y, column.width);
            column.y += SECTION_TITLE_AFTER_GAP;
        }

        (section.ingredients || []).forEach((ingredient) => {
            if (ingredient.type === 'header' || ingredient.type === 'subtitle') {
                column.y = ensureSpace(doc, column.y + SECTION_TITLE_TOP_GAP, SECTION_TITLE_SPACE_NEEDED);
                if (ingredient.type === 'subtitle') {
                    drawSectionSubtitle(doc, ingredient.text || '', column.x, column.y, column.width, recipe.instructionSubtitleCase === 'preserve');
                } else {
                    drawSectionTitle(doc, ingredient.text || '', column.x, column.y, column.width);
                }
                column.y += SECTION_TITLE_AFTER_GAP;
                return;
            }

            column.y = ensureSpace(doc, column.y, 24);
            const rowTop = column.y;
            const nameWidth = column.width * 0.58;
            const amountX = column.x + (column.width * 0.6);
            const amountWidth = column.width * 0.4;
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor(TEXT_DARK)
                .text(ingredient.name || '', column.x, rowTop, { width: nameWidth });
            doc.font('Helvetica-Bold')
                .fontSize(9)
                .fillColor(TEXT_DARK)
                .text(ingredient.amount || '', amountX, rowTop, {
                    width: amountWidth,
                    align: amountAlignment
                });
            const nameHeight = doc.heightOfString(ingredient.name || '', { width: nameWidth });
            const amountHeight = doc.heightOfString(ingredient.amount || '', { width: amountWidth, align: amountAlignment });
            const rowHeight = Math.max(nameHeight, amountHeight, 14);
            doc.moveTo(column.x, rowTop + rowHeight + 4).lineTo(column.x + column.width, rowTop + rowHeight + 4).strokeColor(BORDER).lineWidth(0.75).stroke();
            column.y = rowTop + rowHeight + 9;
        });
    });
}

function drawInstructions(doc, recipe, column) {
    const sections = recipe.instructionSections.length > 0
        ? recipe.instructionSections
        : [{ label: '', steps: recipe.instructions || [] }];

    if (recipe.showInstructionsHeader !== false) {
        column.y = ensureSpace(doc, column.y, 75);
        drawPillHeader(doc, recipe.instructionsLabel || 'INSTRUCTIONS', column.x, column.y);
        column.y += 44;
    }

    sections.forEach((section, sectionIndex) => {
        if (sectionIndex > 0) column.y += SECTION_TITLE_TOP_GAP;
        if (section.label) {
            column.y = ensureSpace(doc, column.y, SECTION_TITLE_SPACE_NEEDED);
            drawSectionTitle(doc, section.label, column.x, column.y, column.width);
            column.y += SECTION_TITLE_AFTER_GAP;
        }

        let visibleStepIndex = 0;
        (section.steps || []).forEach((step) => {
            if (isInstructionHeaderStep(step)) {
                column.y = ensureSpace(doc, column.y + SECTION_TITLE_TOP_GAP, SECTION_TITLE_SPACE_NEEDED);
                if (getInstructionLabelType(step) === 'subtitle') {
                    drawSectionSubtitle(doc, getInstructionStepText(step), column.x, column.y, column.width, recipe.instructionSubtitleCase === 'preserve');
                } else {
                    drawSectionTitle(doc, getInstructionStepText(step), column.x, column.y, column.width);
                }
                column.y += SECTION_TITLE_AFTER_GAP;
                visibleStepIndex = 0;
                return;
            }

            const stepText = getInstructionStepText(step);
            const checkboxItems = typeof step === 'object' && Array.isArray(step.checkboxItems) ? step.checkboxItems : [];
            const textHeight = doc.heightOfString(stepText, { width: column.width - 38 });
            column.y = ensureSpace(doc, column.y, textHeight + 34 + (checkboxItems.length * 16));

            doc.roundedRect(column.x, column.y - 2, 20, 20, 3).fill('#b2b2b2');
            doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text(String(visibleStepIndex + 1), column.x, column.y + 3, {
                width: 20,
                align: 'center'
            });
            visibleStepIndex += 1;

            doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXT_DARK).text(stepText, column.x + 36, column.y, {
                width: column.width - 36,
                lineGap: 2
            });
            column.y = Math.max(column.y + 24, doc.y + 8);

            checkboxItems.forEach((item) => {
                column.y = ensureSpace(doc, column.y, 18);
                doc.rect(column.x + 36, column.y + 1, 8, 8).strokeColor('#bdbdbd').lineWidth(0.75).stroke();
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXT_DARK).text(item, column.x + 50, column.y - 1, {
                    width: column.width - 50,
                    lineGap: 2
                });
                column.y = doc.y + 3;
            });
        });
    });
}

function parseInstructionHeaderText(value) {
    const match = String(value || '').trim().match(/^:HEADER:\s*(.+)$/i);
    return match ? match[1].trim() : '';
}

function parseInstructionSubtitleText(value) {
    const match = String(value || '').trim().match(/^:SUBTITLE:\s*(.+)$/i);
    return match ? match[1].trim() : '';
}

function getInstructionLabelType(step) {
    if (typeof step === 'string') {
        if (parseInstructionHeaderText(step)) return 'header';
        if (parseInstructionSubtitleText(step)) return 'subtitle';
        return '';
    }

    return ['header', 'subtitle'].includes(step?.type) && step.text ? step.type : '';
}

function isInstructionHeaderStep(step) {
    return Boolean(getInstructionLabelType(step));
}

function getInstructionStepText(step) {
    if (typeof step === 'string') {
        return parseInstructionHeaderText(step) || parseInstructionSubtitleText(step) || step;
    }

    return step?.text || '';
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
        doc.font('Helvetica').fontSize(9.5).fillColor('#000000').text(note, column.x + 48, column.y + 14, {
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

function drawSectionSubtitle(doc, label, x, y, width, preserveCase = false) {
    doc.font('Helvetica')
        .fontSize(11)
        .fillColor('#000000')
        .text(preserveCase ? String(label || '') : String(label || '').toUpperCase(), x, y, { width });
}

function drawPillHeader(doc, label, x, y) {
    const text = String(label || '').toUpperCase();
    const width = Math.min(PAGE_WIDTH - 100, doc.font('Helvetica-Bold').fontSize(12).widthOfString(text) + 38);
    doc.roundedRect(x, y, width, 28, 5).fill('#000000');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff').text(text, x + 18, y + 8, { width: width - 36 });
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

async function imageSourceToBuffer(source) {
    const dataBuffer = dataUrlToBuffer(source);
    if (dataBuffer) {
        return dataBuffer;
    }

    const value = String(source || '').trim();
    if (!/^https?:\/\//i.test(value)) {
        return null;
    }

    try {
        const response = await fetch(value);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!/^image\/(?:png|jpe?g)/i.test(contentType)) {
            console.warn(`Remote hero image is not a JPG or PNG: ${contentType || 'unknown content type'}`);
            return null;
        }

        return Buffer.from(await response.arrayBuffer());
    } catch (error) {
        console.warn('Unable to load remote hero image for editable PDF:', error.message);
        return null;
    }
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

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`\nRecipe Page Generator running at http://localhost:${PORT}\n`);
    });
}

module.exports = {
    createRecipePdfBuffer,
    getExportTitle,
    loadEnvFile,
    normalizeRecipe
};
