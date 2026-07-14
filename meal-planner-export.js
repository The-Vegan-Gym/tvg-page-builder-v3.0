const AIRTABLE_CONFIG = require('./airtable.config');

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_CONTENT_BASE = 'https://content.airtable.com/v0';
const AIRTABLE_META_BASE = 'https://api.airtable.com/v0/meta';
const PAGE_RECORD_CATEGORY_FALLBACK_OPTIONS = [
    'Info Page',
    'Meals',
    'Custom',
    'Cover Page',
    'Substitutions',
    'Client Recipes',
    'Custom Recipe',
    'Snack Page',
    'Supplement Page',
    'Smoothie Page',
    'Oatmeal'
];
const ATTACHMENT_FIELDS = {
    recipePages: 'Recipe PDF',
    recipePagesNoMacros: 'Recipe PDF no macros',
    printerFriendlyRecipePages: 'Printer Friendly Recipe PDF',
    printerFriendlyRecipePagesNoMacros: 'Printer Friendly Recipe PDF no macros',
    photo: 'Recipe Image',
    recipeFile: 'Recipe File'
};
const PAGE_ATTACHMENT_FIELDS = new Set([
    ATTACHMENT_FIELDS.recipePages,
    ATTACHMENT_FIELDS.recipePagesNoMacros,
    ATTACHMENT_FIELDS.printerFriendlyRecipePages,
    ATTACHMENT_FIELDS.printerFriendlyRecipePagesNoMacros
]);
const PAGE_RECORD_ATTACHMENT_FIELDS = {
    page: 'Page',
    printerFriendlyPage: 'Page Printer Friendly',
    photo: 'Photo',
    pageFile: 'Page file'
};
const PAGE_RECORD_PAGE_ATTACHMENT_FIELDS = new Set([
    PAGE_RECORD_ATTACHMENT_FIELDS.page,
    PAGE_RECORD_ATTACHMENT_FIELDS.printerFriendlyPage
]);

async function exportRecipeToMealPlanner(payload = {}, options = {}) {
    const { token, baseId, tableId } = getAirtableEnvironment();
    const { recipe, metadata } = normalizeMealPlannerPayload(payload);
    const fields = buildAirtableFields(recipe, metadata);
    const record = await createAirtableRecord({ token, baseId, tableId, fields });
    const attachments = await buildRecipeAttachments(recipe, payload.pageAttachments || []);

    await uploadAttachmentsToRecord({ token, baseId, recordId: record.id, attachments });

    return {
        id: record.id,
        url: `https://airtable.com/${baseId}/${tableId}/${record.id}`
    };
}

async function createMealPlannerRecord(payload = {}) {
    const { token, baseId, tableId } = getAirtableEnvironment();
    const { recipe, metadata } = normalizeMealPlannerPayload(payload);
    const fields = buildAirtableFields(recipe, metadata);
    const record = await createAirtableRecord({ token, baseId, tableId, fields });

    return {
        id: record.id,
        url: `https://airtable.com/${baseId}/${tableId}/${record.id}`
    };
}

async function uploadMealPlannerAttachments(payload = {}) {
    const { token, baseId } = getAirtableEnvironment();
    const recordId = String(payload.recordId || '').trim();
    if (!recordId) {
        throw new Error('Airtable record ID is missing for attachment upload.');
    }

    const options = payload.attachmentOptions || {};
    const attachments = await buildRecipeAttachments(payload.recipe || {}, payload.pageAttachments || [], options);
    await uploadAttachmentsToRecord({ token, baseId, recordId, attachments });

    return {
        id: recordId,
        uploaded: attachments.length
    };
}

async function listCoachProfiles() {
    const { token, baseId } = getAirtableEnvironment();
    const tableId = getRequiredTableId('coachProfiles');
    const records = await listAirtableRecords({
        token,
        baseId,
        tableId,
        fields: ['Coach', 'Email', 'Role'],
        sortField: 'Coach'
    });

    return records
        .map((record) => {
            const name = String(record.fields?.Coach || '').trim();
            const email = String(record.fields?.Email || '').trim();
            const role = String(record.fields?.Role || '').trim();
            if (!name) return null;

            return {
                id: record.id,
                name,
                email,
                role
            };
        })
        .filter(Boolean);
}

async function listPageRecordCategories() {
    const { token, baseId } = getAirtableEnvironment();
    const tableId = getRequiredTableId('pageRecords');

    try {
        return await listSingleSelectOptions({
            token,
            baseId,
            tableId,
            fieldName: 'Category'
        });
    } catch (error) {
        console.warn('Unable to load Page Records category options from Airtable metadata. Using fallback options.', error);
        return PAGE_RECORD_CATEGORY_FALLBACK_OPTIONS;
    }
}

async function createPageRecord(payload = {}) {
    const { token, baseId } = getAirtableEnvironment();
    const tableId = getRequiredTableId('pageRecords');
    const recipe = payload.recipe || {};
    const metadata = payload.metadata || {};
    const fields = buildPageRecordFields(recipe, metadata);
    const record = await createAirtableRecord({ token, baseId, tableId, fields });

    return {
        id: record.id,
        url: `https://airtable.com/${baseId}/${tableId}/${record.id}`
    };
}

async function uploadPageRecordAttachments(payload = {}) {
    const { token, baseId } = getAirtableEnvironment();
    const recordId = String(payload.recordId || '').trim();
    if (!recordId) {
        throw new Error('Airtable record ID is missing for Page Record attachment upload.');
    }

    const options = payload.attachmentOptions || {};
    const attachments = await buildPageRecordAttachments(payload.recipe || {}, payload.pageAttachments || [], options);
    await uploadAttachmentsToRecord({ token, baseId, recordId, attachments });

    return {
        id: recordId,
        uploaded: attachments.length
    };
}

function getAirtableEnvironment() {
    const token = process.env[AIRTABLE_CONFIG.tokenEnvKey];
    if (!token) {
        throw new Error(`${AIRTABLE_CONFIG.tokenEnvKey} is missing. Add it to your environment variables.`);
    }

    const baseId = normalizeEnvValue(process.env[AIRTABLE_CONFIG.baseIdEnvKey]);
    const tableId = normalizeEnvValue(process.env[AIRTABLE_CONFIG.tableEnvKeys.recipes]);
    if (!baseId) {
        throw new Error(`${AIRTABLE_CONFIG.baseIdEnvKey} is missing. Add it to your environment variables.`);
    }
    if (!tableId) {
        throw new Error(`${AIRTABLE_CONFIG.tableEnvKeys.recipes} is missing. Add it to your environment variables.`);
    }

    return { token, baseId, tableId };
}

function getRequiredTableId(tableKey) {
    const envKey = AIRTABLE_CONFIG.tableEnvKeys[tableKey];
    const tableId = normalizeEnvValue(process.env[envKey]);
    if (!tableId) {
        throw new Error(`${envKey} is missing. Add it to your environment variables.`);
    }

    return tableId;
}

function normalizeMealPlannerPayload(payload = {}) {
    return {
        recipe: payload.recipe || {},
        metadata: payload.metadata || {}
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
        Fat: parseInteger(macros.fat),
        Exclude: true
    };

    const category = String(metadata.category || '').trim();
    if (category) fields.Category = category;

    const ingredients = parseList(metadata.ingredients);
    if (ingredients.length > 0) fields.Ingredients = ingredients;

    const allergy = parseList(metadata.allergy);
    if (allergy.length > 0) fields.Allergy = allergy;

    const cronometer = String(metadata.cronometer || '').trim();
    if (cronometer) fields.Cronometer = cronometer;

    return fields;
}

function buildPageRecordFields(recipe = {}, metadata = {}) {
    const macros = recipe.macros || {};
    const coachProfileId = String(metadata.coachProfileId || '').trim();
    const category = String(metadata.category || '').trim();
    if (!coachProfileId) {
        throw new Error('Choose a coach profile before exporting to My Pages.');
    }
    if (!category) {
        throw new Error('Choose a category before exporting to My Pages.');
    }

    const fields = {
        'Page Title': String(recipe.title || metadata.title || 'Untitled Page').trim(),
        Category: category,
        Calories: parseInteger(macros.calories),
        Protein: parseInteger(macros.protein),
        Carbs: parseInteger(macros.carbs),
        Fat: parseInteger(macros.fat),
        'Coach Profiles': [coachProfileId]
    };

    const ingredients = parseList(metadata.ingredients);
    if (ingredients.length > 0) fields.Ingredients = ingredients;

    const allergy = parseList(metadata.allergy);
    if (allergy.length > 0) fields.Allergy = allergy;

    return fields;
}

async function buildPageRecordAttachments(recipe = {}, pageAttachments = [], options = {}) {
    const baseTitle = sanitizeFilename(recipe.title || 'Recipe');
    const includePageAttachments = options.includePageAttachments !== false;
    const includePhoto = options.includePhoto !== false;
    const includePageFile = options.includePageFile !== false;
    const attachments = includePageAttachments
        ? normalizePageRecordAttachments(pageAttachments, baseTitle)
        : [];

    if (includePhoto) {
        const photo = await imageSourceToAttachment(recipe.image, `${baseTitle} hero`);
        if (photo) {
            attachments.push({
                fieldName: PAGE_RECORD_ATTACHMENT_FIELDS.photo,
                ...photo
            });
        }
    }

    if (includePageFile) {
        attachments.push({
            fieldName: PAGE_RECORD_ATTACHMENT_FIELDS.pageFile,
            filename: `${baseTitle}.json`,
            contentType: 'application/json',
            buffer: Buffer.from(JSON.stringify(recipe, null, 2), 'utf8')
        });
    }

    return attachments;
}

async function buildRecipeAttachments(recipe = {}, pageAttachments = [], options = {}) {
    const baseTitle = sanitizeFilename(recipe.title || 'Recipe');
    const includePageAttachments = options.includePageAttachments !== false;
    const includePhoto = options.includePhoto !== false;
    const includeRecipeFile = options.includeRecipeFile !== false;
    const attachments = includePageAttachments
        ? normalizePageAttachments(pageAttachments, baseTitle)
        : [];

    if (includePhoto) {
        const photo = await imageSourceToAttachment(recipe.image, `${baseTitle} hero`);
        if (photo) {
            attachments.push({
                fieldName: ATTACHMENT_FIELDS.photo,
                ...photo
            });
        }
    }

    if (includeRecipeFile) {
        attachments.push({
            fieldName: ATTACHMENT_FIELDS.recipeFile,
            filename: `${baseTitle}.json`,
            contentType: 'application/json',
            buffer: Buffer.from(JSON.stringify(recipe, null, 2), 'utf8')
        });
    }

    return attachments;
}

async function uploadAttachmentsToRecord({ token, baseId, recordId, attachments }) {
    for (const attachment of attachments) {
        await uploadAirtableAttachment({
            token,
            baseId,
            recordId,
            fieldName: attachment.fieldName,
            filename: attachment.filename,
            contentType: attachment.contentType,
            buffer: attachment.buffer
        });
    }
}

function normalizePageAttachments(pageAttachments = [], baseTitle = 'Recipe') {
    if (!Array.isArray(pageAttachments) || pageAttachments.length === 0) {
        throw new Error('No JPG pages were provided for Airtable export.');
    }

    return pageAttachments.map((attachment, index) => {
        const dataUrl = parseDataUrl(attachment?.dataUrl);
        if (!dataUrl || dataUrl.contentType !== 'image/jpeg') {
            throw new Error(`Recipe page ${index + 1} was not a JPG image.`);
        }

        return {
            fieldName: normalizePageAttachmentField(attachment?.fieldName),
            filename: normalizeJpgFilename(attachment?.filename, `${baseTitle} - Page ${index + 1}`),
            contentType: 'image/jpeg',
            buffer: dataUrl.buffer
        };
    });
}

function normalizePageRecordAttachments(pageAttachments = [], baseTitle = 'Recipe') {
    if (!Array.isArray(pageAttachments) || pageAttachments.length === 0) {
        throw new Error('No JPG pages were provided for Page Record export.');
    }

    return pageAttachments.map((attachment, index) => {
        const dataUrl = parseDataUrl(attachment?.dataUrl);
        if (!dataUrl || dataUrl.contentType !== 'image/jpeg') {
            throw new Error(`Page Record page ${index + 1} was not a JPG image.`);
        }

        return {
            fieldName: normalizePageRecordAttachmentField(attachment?.fieldName),
            filename: normalizeJpgFilename(attachment?.filename, `${baseTitle} - Page ${index + 1}`),
            contentType: 'image/jpeg',
            buffer: dataUrl.buffer
        };
    });
}

function normalizePageRecordAttachmentField(fieldName) {
    const normalizedFieldName = String(fieldName || '').trim();
    return PAGE_RECORD_PAGE_ATTACHMENT_FIELDS.has(normalizedFieldName)
        ? normalizedFieldName
        : PAGE_RECORD_ATTACHMENT_FIELDS.page;
}

function normalizePageAttachmentField(fieldName) {
    const normalizedFieldName = String(fieldName || '').trim();
    return PAGE_ATTACHMENT_FIELDS.has(normalizedFieldName)
        ? normalizedFieldName
        : ATTACHMENT_FIELDS.recipePages;
}

function normalizeJpgFilename(filename, fallbackName) {
    const rawName = String(filename || fallbackName || 'Recipe Page').trim();
    const withoutExtension = rawName.replace(/\.jpe?g$/i, '');
    return `${sanitizeFilename(withoutExtension)}.jpg`;
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

async function listAirtableRecords({ token, baseId, tableId, fields = [], sortField = '' }) {
    const params = new URLSearchParams({ pageSize: '100' });
    fields.forEach((field) => params.append('fields[]', field));
    if (sortField) {
        params.append('sort[0][field]', sortField);
        params.append('sort[0][direction]', 'asc');
    }

    const records = [];
    let offset = '';

    do {
        if (offset) {
            params.set('offset', offset);
        } else {
            params.delete('offset');
        }

        const response = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(formatAirtableError(
                'Airtable coach profile lookup failed',
                response.status,
                data,
                'Check that COACH_PROFILES_TABLE_ID is correct and AIRTABLE_TOKEN includes data.records:read.'
            ));
        }

        records.push(...(data.records || []));
        offset = data.offset || '';
    } while (offset);

    return records;
}

async function listSingleSelectOptions({ token, baseId, tableId, fieldName }) {
    const response = await fetch(`${AIRTABLE_META_BASE}/bases/${baseId}/tables`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(formatAirtableError(
            'Airtable metadata lookup failed',
            response.status,
            data,
            'Check that AIRTABLE_TOKEN includes schema.bases:read.'
        ));
    }

    const table = (data.tables || []).find((item) => item.id === tableId);
    const field = (table?.fields || []).find((item) => item.name === fieldName);
    const choices = field?.options?.choices || [];
    const names = choices
        .map((choice) => String(choice?.name || '').trim())
        .filter(Boolean);

    if (names.length === 0) {
        throw new Error(`No options found for "${fieldName}" in Page Records.`);
    }

    return names;
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
    createMealPlannerRecord,
    createPageRecord,
    listCoachProfiles,
    listPageRecordCategories,
    uploadPageRecordAttachments,
    uploadMealPlannerAttachments,
    buildAirtableFields,
    buildPageRecordFields,
    buildPageRecordAttachments,
    buildRecipeAttachments
};
