const AIRTABLE_CONFIG = require('./airtable.config');

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_CONTENT_BASE = 'https://content.airtable.com/v0';
const ATTACHMENT_FIELDS = {
    recipePdf: 'Recipe PDF',
    recipePdfNoMacros: 'Recipe PDF no macros',
    printerFriendlyRecipePdf: 'Printer Friendly Recipe PDF',
    printerFriendlyRecipePdfNoMacros: 'Printer Friendly Recipe PDF no macros',
    photo: 'Photo',
    recipeFile: 'Recipe File'
};

async function exportRecipeToMealPlanner(payload = {}, options = {}) {
    const token = process.env[AIRTABLE_CONFIG.tokenEnvKey];
    if (!token) {
        throw new Error(`${AIRTABLE_CONFIG.tokenEnvKey} is missing. Add it to your environment variables.`);
    }

    if (typeof options.createPdfBuffer !== 'function') {
        throw new Error('PDF export is not configured.');
    }

    const recipe = payload.recipe || {};
    const metadata = payload.metadata || {};
    const baseId = normalizeEnvValue(process.env[AIRTABLE_CONFIG.baseIdEnvKey]);
    const tableId = normalizeEnvValue(process.env[AIRTABLE_CONFIG.tableEnvKeys.recipes]);
    if (!baseId) {
        throw new Error(`${AIRTABLE_CONFIG.baseIdEnvKey} is missing. Add it to your environment variables.`);
    }
    if (!tableId) {
        throw new Error(`${AIRTABLE_CONFIG.tableEnvKeys.recipes} is missing. Add it to your environment variables.`);
    }

    const fields = buildAirtableFields(recipe, metadata);
    const record = await createAirtableRecord({ token, baseId, tableId, fields });
    const attachments = await buildRecipeAttachments(recipe, options.createPdfBuffer);

    for (const attachment of attachments) {
        await uploadAirtableAttachment({
            token,
            baseId,
            recordId: record.id,
            fieldName: attachment.fieldName,
            filename: attachment.filename,
            contentType: attachment.contentType,
            buffer: attachment.buffer
        });
    }

    return {
        id: record.id,
        url: `https://airtable.com/${baseId}/${tableId}/${record.id}`
    };
}

function buildAirtableFields(recipe = {}, metadata = {}) {
    const macros = recipe.macros || {};
    const fields = {
        Title: String(recipe.title || metadata.title || 'Untitled Recipe').trim(),
        Description: String(recipe.description || '').trim(),
        Calories: parseInteger(macros.calories),
        Protein: parseInteger(macros.protein),
        Carbs: parseInteger(macros.carbs),
        Fat: parseInteger(macros.fat)
    };

    const category = String(metadata.category || '').trim();
    if (category) fields.Category = category;

    const cuisine = String(metadata.cuisine || '').trim();
    if (cuisine) fields.Cuisine = cuisine;

    const ingredients = parseList(metadata.ingredients);
    if (ingredients.length > 0) fields.Ingredients = ingredients;

    const allergy = parseList(metadata.allergy);
    if (allergy.length > 0) fields.Allergy = allergy;

    return fields;
}

async function buildRecipeAttachments(recipe = {}, createPdfBuffer) {
    const baseTitle = sanitizeFilename(recipe.title || 'Recipe');
    const variants = [
        {
            fieldName: ATTACHMENT_FIELDS.recipePdf,
            filename: `${baseTitle}.pdf`,
            recipe: { ...recipe, pageStyle: 'standard', showMacroBar: true }
        },
        {
            fieldName: ATTACHMENT_FIELDS.recipePdfNoMacros,
            filename: `${baseTitle} - no macros.pdf`,
            recipe: { ...recipe, pageStyle: 'standard', showMacroBar: false }
        },
        {
            fieldName: ATTACHMENT_FIELDS.printerFriendlyRecipePdf,
            filename: `${baseTitle} - Printer Friendly.pdf`,
            recipe: { ...recipe, pageStyle: 'printer-friendly', showMacroBar: true, image: '' }
        },
        {
            fieldName: ATTACHMENT_FIELDS.printerFriendlyRecipePdfNoMacros,
            filename: `${baseTitle} - Printer Friendly - no macros.pdf`,
            recipe: { ...recipe, pageStyle: 'printer-friendly', showMacroBar: false, image: '' }
        }
    ];

    const attachments = [];
    for (const variant of variants) {
        attachments.push({
            fieldName: variant.fieldName,
            filename: variant.filename,
            contentType: 'application/pdf',
            buffer: await createPdfBuffer(variant.recipe)
        });
    }

    const photo = await imageSourceToAttachment(recipe.image, `${baseTitle} hero`);
    if (photo) {
        attachments.push({
            fieldName: ATTACHMENT_FIELDS.photo,
            ...photo
        });
    }

    attachments.push({
        fieldName: ATTACHMENT_FIELDS.recipeFile,
        filename: `${baseTitle}.json`,
        contentType: 'application/json',
        buffer: Buffer.from(JSON.stringify(recipe, null, 2), 'utf8')
    });

    return attachments;
}

async function createAirtableRecord({ token, baseId, tableId, fields }) {
    const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${tableId}`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            records: [{ fields }],
            typecast: true
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(formatAirtableError(
            'Airtable record creation failed',
            response.status,
            data,
            'Check that AIRTABLE_TOKEN has access to BASE_ID/TABLE_ID and includes data.records:write.'
        ));
    }

    const record = data?.records?.[0];
    if (!record?.id) {
        throw new Error('Airtable did not return a record id.');
    }

    return record;
}

async function uploadAirtableAttachment({ token, baseId, recordId, fieldName, filename, contentType, buffer }) {
    const response = await fetch(`${AIRTABLE_CONTENT_BASE}/${baseId}/${recordId}/${encodeURIComponent(fieldName)}/uploadAttachment`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contentType,
            filename,
            file: buffer.toString('base64')
        })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(formatAirtableError(
            `Airtable attachment upload failed for "${fieldName}"`,
            response.status,
            data,
            'Check that the attachment field exists and AIRTABLE_TOKEN includes data.records:write.'
        ));
    }

    return data;
}

async function imageSourceToAttachment(source, baseFilename) {
    const dataUrl = parseDataUrl(source);
    if (dataUrl && /^image\//i.test(dataUrl.contentType)) {
        return {
            filename: `${sanitizeFilename(baseFilename)}.${extensionFromContentType(dataUrl.contentType)}`,
            contentType: dataUrl.contentType,
            buffer: dataUrl.buffer
        };
    }

    const value = String(source || '').trim();
    if (!/^https?:\/\//i.test(value)) {
        return null;
    }

    const response = await fetch(value);
    if (!response.ok) {
        throw new Error(`Unable to download hero photo for Airtable upload: HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//i.test(contentType)) {
        throw new Error(`Hero photo URL returned ${contentType}, not an image.`);
    }

    return {
        filename: `${sanitizeFilename(baseFilename)}.${extensionFromContentType(contentType)}`,
        contentType,
        buffer: Buffer.from(await response.arrayBuffer())
    };
}

function parseDataUrl(value) {
    const match = String(value || '').match(/^data:([^;,]+);base64,(.+)$/);
    if (!match) return null;

    return {
        contentType: match[1],
        buffer: Buffer.from(match[2], 'base64')
    };
}

function normalizeEnvValue(value) {
    return String(value || '')
        .trim()
        .replace(/^["']|["']$/g, '');
}

function formatAirtableError(prefix, status, data, hint) {
    const message = data?.error?.message || data?.error?.type || `HTTP ${status}`;
    return `${prefix}: ${message} ${hint}`;
}

function parseList(value) {
    return String(value || '')
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean);
}

function parseInteger(value) {
    const parsed = Number.parseInt(String(value || '').replace(/,/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeFilename(value) {
    return String(value || 'Recipe')
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 120) || 'Recipe';
}

function extensionFromContentType(contentType) {
    const value = String(contentType || '').toLowerCase();
    if (value.includes('png')) return 'png';
    if (value.includes('webp')) return 'webp';
    if (value.includes('gif')) return 'gif';
    return 'jpg';
}

module.exports = {
    exportRecipeToMealPlanner,
    buildAirtableFields,
    buildRecipeAttachments
};
