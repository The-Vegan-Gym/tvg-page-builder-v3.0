const AIRTABLE_CONFIG = require('./airtable.config');
const { createHmac, randomBytes, timingSafeEqual } = require('node:crypto');

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
const EASTERN_TIME_ZONE = 'America/New_York';
const AIRTABLE_EXPORT_CATEGORY = 'Client Recipes';
const NUTRITION_FIELDS = { Calories: 'calories', Protein: 'protein', Carbs: 'carbs', Fat: 'fat' };

async function listMealPlannerRecipes() {
    const environment = getAirtableEnvironment();
    const records = await listAirtableRecords({
        ...environment, fields: ['Title', ...Object.keys(NUTRITION_FIELDS), 'Meal Series', 'date'], sortField: 'Title',
        lookup: 'Airtable recipe lookup'
    });
    return records.map((record) => describeMealPlannerRecipe(environment, record));
}

function describeMealPlannerRecipe(environment, { id, createdTime, fields }) {
    return {
        ...mealPlannerRecordLink(environment, id),
        title: String(fields?.Title || '').trim() || 'Untitled recipe',
        calories: fields?.Calories ?? null,
        protein: fields?.Protein ?? null,
        carbs: fields?.Carbs ?? null,
        fat: fields?.Fat ?? null,
        series: typeof fields?.['Meal Series'] === 'string' ? fields['Meal Series'] : '',
        date: typeof fields?.date === 'string' ? fields.date : createdTime
    };
}

async function beginMealPlannerRecipeUpdate(payload) {
    const environment = getAirtableEnvironment();
    const recordId = String(payload.recordId || '').trim();
    if (!/^rec[a-zA-Z0-9]{14}$/.test(recordId)) throw new Error('Choose an Airtable recipe to update.');

    const counts = payload.pageCounts || {};
    const pageCounts = Object.fromEntries([...PAGE_ATTACHMENT_FIELDS].map((field) => [field, counts[field]]));
    if (Object.values(pageCounts).some((count) => !Number.isSafeInteger(count) || count < 1)) {
        throw new Error('Generate all four sets of recipe pages before updating Airtable.');
    }
    const expected = { ...pageCounts, [ATTACHMENT_FIELDS.recipeFile]: 1 };
    if (payload.replacePhoto === true) expected[ATTACHMENT_FIELDS.photo] = 1;

    const nutrition = {};
    for (const [field, key] of Object.entries(NUTRITION_FIELDS)) {
        const value = String(payload.macros?.[key] ?? '').trim().replaceAll(',', '');
        if (!value) continue;
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) throw new Error(`Enter a valid value for ${field} before updating.`);
        nutrition[field] = number;
    }
    const record = await getAirtableRecord({ ...environment, recordId, resource: 'Recipe' });
    const fields = record.fields || {};
    const plan = {
        recordId,
        tag: randomBytes(6).toString('hex'),
        expires: Date.now() + 60 * 60 * 1000,
        expected,
        nutrition,
        previousNutrition: Object.fromEntries(Object.keys(nutrition).map((field) => [field, fields[field] ?? null])),
        previousFiles: Object.fromEntries(Object.keys(expected).map((field) => [field, fileIds(fields[field])]))
    };
    const encoded = Buffer.from(JSON.stringify(plan)).toString('base64url');
    const signature = signRecipeUpdate(encoded, environment).toString('base64url');
    return { ...mealPlannerRecordLink(environment, recordId), updateToken: `${encoded}.${signature}` };
}

async function stageMealPlannerRecipeUpdate(payload) {
    const environment = getAirtableEnvironment();
    const plan = readRecipeUpdate(payload.updateToken, environment);
    const page = payload.pageAttachment;
    let attachments;
    if (page) {
        if (!PAGE_ATTACHMENT_FIELDS.has(page.fieldName)) throw new Error('A recipe page export field was invalid.');
        attachments = normalizePageAttachments([page], 'Recipe');
    } else {
        if (Object.hasOwn(plan.expected, ATTACHMENT_FIELDS.photo) && !/^data:image\/(jpeg|png|webp|gif);base64,/.test(payload.recipe?.image || '')) {
            throw new Error('The replacement recipe image could not be read.');
        }
        attachments = await buildRecipeAttachments(payload.recipe || {}, [], {
            includePageAttachments: false,
            includePhoto: Object.hasOwn(plan.expected, ATTACHMENT_FIELDS.photo)
        });
        const saveFile = attachments.find((item) => item.fieldName === ATTACHMENT_FIELDS.recipeFile);
        saveFile.filename = saveFile.filename.replace(/\.json$/i, '.recipe');
    }

    const index = page ? payload.pageIndex : 0;
    if (!Number.isInteger(index) || index < 0 || attachments.some(({ fieldName, buffer }) =>
        !Object.hasOwn(plan.expected, fieldName) || index >= plan.expected[fieldName] || !buffer.length || buffer.length > 5_000_000
    ) || (!page && attachments.length !== Object.keys(plan.expected).length - PAGE_ATTACHMENT_FIELDS.size)) {
        throw new Error('A replacement file is missing or exceeds Airtable’s 5 MB upload limit.');
    }

    const record = await getAirtableRecord({ ...environment, recordId: plan.recordId, resource: 'Recipe' });
    for (const { filename, fieldName, contentType, buffer } of attachments) {
        const suffix = recipeUpdateFileSuffix(plan, index);
        if (stagedRecipeFiles(record.fields?.[fieldName], plan, index).length) continue;
        const dot = filename.lastIndexOf('.');
        await uploadAirtableAttachment({
            ...environment, recordId: plan.recordId, fieldName,
            filename: `${filename.slice(0, dot)}${suffix}${filename.slice(dot)}`, contentType, buffer
        });
    }
    return { staged: true };
}

async function finishMealPlannerRecipeUpdate(payload) {
    const environment = getAirtableEnvironment();
    const plan = readRecipeUpdate(payload.updateToken, environment);
    const record = await getAirtableRecord({ ...environment, recordId: plan.recordId, resource: 'Recipe' });
    const fields = record.fields || {};
    const replacements = {};
    const currentOriginals = {};
    for (const [field, count] of Object.entries(plan.expected)) {
        if (fileIds(fields[field]).length < count) {
            throw new Error('Some replacement files are missing. The update could not be completed.');
        }
        const staged = Array.from({ length: count }, (_, index) => stagedRecipeFiles(fields[field], plan, index));
        if (staged.some((files) => files.length !== 1)) {
            throw new Error('Some replacement files are missing. The update could not be completed.');
        }
        replacements[field] = staged.flat().map(({ id }) => ({ id }));
        const stagedIds = new Set(fileIds(replacements[field]));
        currentOriginals[field] = fileIds(fields[field]).filter((id) => !stagedIds.has(id));
    }
    const nutritionMatches = (values) => Object.entries(values).every(([field, value]) => (fields[field] ?? null) === value);
    if (Object.values(currentOriginals).every((ids) => ids.length === 0) && nutritionMatches(plan.nutrition)) {
        return describeMealPlannerRecipe(environment, record);
    }

    const fileConflict = Object.entries(plan.previousFiles).some(([field, ids]) =>
        JSON.stringify(ids) !== JSON.stringify(currentOriginals[field])
    );
    if (fileConflict || !nutritionMatches(plan.previousNutrition)) {
        await removeStagedRecipeFiles(environment, plan, fields);
        throw new Error('This Airtable recipe changed during export. Review the record before trying the update again.');
    }

    const updated = await updateAirtableRecord({
        ...environment, recordId: plan.recordId, resource: 'Recipe',
        fields: { ...plan.nutrition, ...replacements }
    });
    if (Object.entries(replacements).some(([field, files]) =>
        JSON.stringify(fileIds(updated.fields?.[field])) !== JSON.stringify(fileIds(files))
    )) {
        throw new Error('Airtable did not confirm every replacement file.');
    }
    return describeMealPlannerRecipe(environment, updated);
}

async function cancelMealPlannerRecipeUpdate(payload) {
    const environment = getAirtableEnvironment();
    const plan = readRecipeUpdate(payload.updateToken, environment);
    const record = await getAirtableRecord({ ...environment, recordId: plan.recordId, resource: 'Recipe' });
    const fields = record.fields || {};
    // A late cancel must never remove files after the original set was replaced.
    const priorFilesRemain = Object.entries(plan.previousFiles).every(([field, ids]) => {
        const actual = new Set(fileIds(fields[field]));
        return ids.every((id) => actual.has(id));
    });
    const allFilesStaged = Object.entries(plan.expected).every(([field, count]) =>
        stagedRecipeFiles(fields[field], plan).length === count
    );
    if (!priorFilesRemain || allFilesStaged) return { canceled: false };
    await removeStagedRecipeFiles(environment, plan, fields);
    return { canceled: true };
}

async function removeStagedRecipeFiles(environment, plan, fields) {
    const patch = {};
    for (const field of Object.keys(plan.expected)) {
        const staged = new Set(fileIds(stagedRecipeFiles(fields[field], plan)));
        if (staged.size) patch[field] = fileIds(fields[field]).filter((id) => !staged.has(id)).map((id) => ({ id }));
    }
    if (Object.keys(patch).length) {
        await updateAirtableRecord({ ...environment, recordId: plan.recordId, resource: 'Recipe', fields: patch });
    }
}

function mealPlannerRecordLink({ baseId, tableId }, id) {
    return { id, url: `https://airtable.com/${baseId}/${tableId}/${id}` };
}

function fileIds(files) {
    return Array.isArray(files) ? files.map(({ id }) => id) : [];
}

function recipeUpdateFileSuffix(plan, index) {
    return ` - ${plan.tag}-${index + 1}`;
}

function stagedRecipeFiles(files, plan, index) {
    const suffix = index === undefined ? new RegExp(` - ${plan.tag}-[0-9]+\\.[^.]+$`) : null;
    return (Array.isArray(files) ? files : []).filter(({ id, filename }) => {
        if (!id || typeof filename !== 'string') return false;
        return suffix ? suffix.test(filename) : filename.slice(0, filename.lastIndexOf('.')).endsWith(recipeUpdateFileSuffix(plan, index));
    });
}

function signRecipeUpdate(encoded, { token, baseId, tableId }) {
    return createHmac('sha256', token).update(`recipe-update:${baseId}:${tableId}:${encoded}`).digest();
}

function readRecipeUpdate(updateToken, environment) {
    const [encoded, signature] = String(updateToken || '').split('.');
    const supplied = Buffer.from(signature || '', 'base64url');
    const expected = signRecipeUpdate(encoded, environment);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
        throw new Error('Start the Airtable update again.');
    }
    const plan = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (plan.expires < Date.now()) throw new Error('The Airtable update expired. Start it again.');
    return plan;
}

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

async function updatePageRecord(payload = {}) {
    const recordId = String(payload.recordId || payload.pageRecordId || '').trim();
    if (!recordId) {
        throw new Error('Airtable Page Record ID is missing for update.');
    }

    const { token, baseId } = getAirtableEnvironment();
    const tableId = getRequiredTableId('pageRecords');
    const recipe = payload.recipe || {};
    const metadata = payload.metadata || {};
    const fields = buildPageRecordFields(recipe, metadata);
    const record = await updateAirtableRecord({ token, baseId, tableId, recordId, fields });

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

async function getPageRecord(payload = {}) {
    const recordId = String(payload.pageRecordId || '').trim();
    if (!recordId) {
        throw new Error('pageRecordId is missing.');
    }

    const { token, baseId } = getAirtableEnvironment();
    const tableId = getRequiredTableId('pageRecords');
    const record = await getAirtableRecord({ token, baseId, tableId, recordId });
    const fields = record.fields || {};
    const pageFileAttachments = Array.isArray(fields[PAGE_RECORD_ATTACHMENT_FIELDS.pageFile])
        ? fields[PAGE_RECORD_ATTACHMENT_FIELDS.pageFile]
        : [];
    const pageFileAttachment = pageFileAttachments[0] || null;
    if (!pageFileAttachment?.url) {
        throw new Error(`Page file is missing for Page Record ${recordId}.`);
    }

    return {
        id: record.id,
        fields,
        pageFileAttachment: {
            id: pageFileAttachment.id,
            url: pageFileAttachment.url,
            filename: pageFileAttachment.filename || '',
            type: pageFileAttachment.type || '',
            size: pageFileAttachment.size || 0
        }
    };
}

async function getAirtableRecord({ token, baseId, tableId, recordId, resource = 'Page Record' }) {
    const response = await fetchAirtable(`${AIRTABLE_API_BASE}/${baseId}/${tableId}/${recordId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`${resource} was not found: ${recordId}.`);
        }
        throw new Error(formatAirtableError(
            `Airtable ${resource} lookup failed`,
            response.status,
            data,
            'Check the Airtable table configuration and data.records:read permission.'
        ));
    }

    if (!data?.id) {
        throw new Error(`${resource} was not found: ${recordId}.`);
    }

    return data;
}

async function updateAirtableRecord({ token, baseId, tableId, recordId, fields, resource = 'Page Record' }) {
    const response = await fetchAirtable(`${AIRTABLE_API_BASE}/${baseId}/${tableId}/${recordId}`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields,
            typecast: true
        })
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`${resource} was not found: ${recordId}.`);
        }
        throw new Error(formatAirtableError(
            `Airtable ${resource} update failed`,
            response.status,
            data,
            'Check the Airtable table configuration and data.records:write permission.'
        ));
    }

    if (!data?.id) {
        throw new Error(`Airtable did not return an updated ${resource} ID.`);
    }

    return data;
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

    fields.Category = AIRTABLE_EXPORT_CATEGORY;

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
    const category = AIRTABLE_EXPORT_CATEGORY;
    if (!coachProfileId) {
        throw new Error('Choose a coach profile before exporting to My Pages.');
    }

    const fields = {
        'Page Title': String(recipe.title || metadata.title || 'Untitled Page').trim(),
        Builder: 'Recipe Builder',
        Category: category,
        'Created At': formatEasternTimestamp(),
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

async function listAirtableRecords({ token, baseId, tableId, fields = [], sortField = '', lookup = 'Airtable coach profile lookup' }) {
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

        const response = await fetchAirtable(`${AIRTABLE_API_BASE}/${baseId}/${tableId}?${params.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(formatAirtableError(
                `${lookup} failed`,
                response.status,
                data,
                'Check the Airtable table configuration and data.records:read permission.'
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
    const response = await fetchAirtable(`${AIRTABLE_CONTENT_BASE}/${baseId}/${recordId}/${encodeURIComponent(fieldName)}/uploadAttachment`, {
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

async function fetchAirtable(url, options) {
    const response = await fetch(url, options);
    if (response.status !== 429 || options.method === 'PATCH') return response;

    const seconds = Number(response.headers.get('Retry-After'));
    await response.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 30) * 1000 : 30000));
    return fetch(url, options);
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

function formatEasternTimestamp(date = new Date()) {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: EASTERN_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    const parts = Object.fromEntries(
        formatter.formatToParts(date)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value])
    );
    const year = parts.year;
    const month = parts.month;
    const day = parts.day;
    const hour = parts.hour === '24' ? '00' : parts.hour;
    const minute = parts.minute;
    const second = parts.second;
    const easternAsUtc = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    const offsetMinutes = Math.round((easternAsUtc - date.getTime()) / 60000);
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const absoluteOffset = Math.abs(offsetMinutes);
    const offsetHour = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
    const offsetMinute = String(absoluteOffset % 60).padStart(2, '0');

    return `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetSign}${offsetHour}:${offsetMinute}`;
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

function handleMealPlannerAction(payload = {}) {
    if (payload.action === 'get-page-record') {
        return getPageRecord(payload);
    }

    if (payload.action === 'list-coach-profiles') {
        return listCoachProfiles();
    }

    if (payload.action === 'list-page-record-categories') {
        return listPageRecordCategories();
    }

    if (payload.action === 'create-page-record') {
        return createPageRecord(payload);
    }

    if (payload.action === 'update-page-record') {
        return updatePageRecord(payload);
    }

    if (payload.action === 'upload-page-record-attachments') {
        return uploadPageRecordAttachments(payload);
    }

    if (payload.action === 'create-record') {
        return createMealPlannerRecord(payload);
    }

    if (payload.action === 'upload-attachments') {
        return uploadMealPlannerAttachments(payload);
    }

    if (payload.action === 'list-meal-planner-recipes') {
        return listMealPlannerRecipes();
    }

    if (payload.action === 'begin-meal-planner-recipe-update') {
        return beginMealPlannerRecipeUpdate(payload);
    }

    if (payload.action === 'stage-meal-planner-recipe-update') {
        return stageMealPlannerRecipeUpdate(payload);
    }

    if (payload.action === 'finish-meal-planner-recipe-update') {
        return finishMealPlannerRecipeUpdate(payload);
    }

    if (payload.action === 'cancel-meal-planner-recipe-update') {
        return cancelMealPlannerRecipeUpdate(payload);
    }

    return exportRecipeToMealPlanner(payload);
}

module.exports = {
    handleMealPlannerAction,
    listMealPlannerRecipes,
    beginMealPlannerRecipeUpdate,
    stageMealPlannerRecipeUpdate,
    finishMealPlannerRecipeUpdate,
    cancelMealPlannerRecipeUpdate,
    exportRecipeToMealPlanner,
    createMealPlannerRecord,
    createPageRecord,
    getPageRecord,
    listCoachProfiles,
    listPageRecordCategories,
    updatePageRecord,
    uploadPageRecordAttachments,
    uploadMealPlannerAttachments,
    buildAirtableFields,
    buildPageRecordFields,
    buildPageRecordAttachments,
    buildRecipeAttachments
};
