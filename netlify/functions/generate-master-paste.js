const { generateMasterPaste, MAX_BODY_BYTES } = require('../../master-paste-ai');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed.' });
    }

    const body = event.isBase64Encoded
        ? Buffer.from(event.body || '', 'base64').toString('utf8')
        : event.body || '';
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        return jsonResponse(413, { error: 'This request is too large. Shorten the text or remove an attachment.' });
    }

    let payload;
    try {
        payload = JSON.parse(body);
    } catch {
        return jsonResponse(400, { error: 'Invalid JSON payload.' });
    }

    try {
        return jsonResponse(200, await generateMasterPaste(payload));
    } catch (error) {
        return jsonResponse(error.statusCode || 400, { error: error.message || 'Unable to get an AI response.' });
    }
};

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    };
}
