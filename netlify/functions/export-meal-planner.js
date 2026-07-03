const {
    createMealPlannerRecord,
    exportRecipeToMealPlanner,
    uploadMealPlannerAttachments
} = require('../../meal-planner-export');
const { createRecipePdfBuffer, loadEnvFile } = require('../../server');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return jsonResponse(204, {});
    }

    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    try {
        loadEnvFile();
        const payload = parseBody(event);
        const result = await handleMealPlannerAction(payload);

        return jsonResponse(200, result);
    } catch (error) {
        console.error('Meal planner export error:', error);
        return jsonResponse(400, { error: error.message || 'Unable to export to Meal Planner' });
    }
};

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

function parseBody(event) {
    const body = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : event.body || '{}';

    try {
        return JSON.parse(body || '{}');
    } catch {
        throw new Error('Invalid JSON payload');
    }
}

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: statusCode === 204 ? '' : JSON.stringify(body)
    };
}
