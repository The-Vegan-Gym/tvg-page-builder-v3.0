const { generateMealPlannerMetadata } = require('../../meal-planner-metadata');

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return jsonResponse(204, {});
    }

    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const payload = parseBody(event);
        const metadata = await generateMealPlannerMetadata({
            apiKey,
            recipe: payload.recipe || {}
        });

        return jsonResponse(200, metadata);
    } catch (error) {
        console.error('Meal Planner metadata generation error:', error);
        return jsonResponse(400, { error: error.message || 'Unable to generate Meal Planner metadata' });
    }
};

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
