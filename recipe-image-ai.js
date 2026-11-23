async function generateRecipeImage(payload, apiKey) {
    const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
    if (!prompt || prompt.length > 30000) throw new Error('Provide a shorter description of the photo you want.');

    const settings = {
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini',
        prompt,
        size: payload.target === 'meal' ? '1024x1024' : '1536x1024',
        quality: 'medium',
        output_format: 'jpeg',
        output_compression: 80
    };
    const headers = { Authorization: `Bearer ${apiKey}` };
    let body;
    if (payload.sourceImage) {
        const encoded = /^data:image\/jpeg;base64,([\w+/]+={0,2})$/.exec(payload.sourceImage)?.[1];
        if (!encoded || Buffer.byteLength(encoded, 'base64') > 4 * 1024 * 1024) {
            throw new Error('The source photo could not be read. Attach it again.');
        }
        body = new FormData();
        for (const [key, value] of Object.entries(settings)) body.append(key, String(value));
        body.append('image', new Blob([Buffer.from(encoded, 'base64')], { type: 'image/jpeg' }), 'recipe.jpg');
    } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(settings);
    }

    const endpoint = payload.sourceImage ? 'edits' : 'generations';
    const response = await fetch(`https://api.openai.com/v1/images/${endpoint}`, {
        method: 'POST', headers, body, signal: AbortSignal.timeout(52_000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const message = [400, 403].includes(response.status)
            ? data.error?.message : '';
        throw Object.assign(new Error(message || 'AI could not create the photo. Try again.'), { statusCode: 502 });
    }
    const encoded = data.data?.[0]?.b64_json;
    if (typeof encoded !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded) || encoded.length > 5_000_000) {
        throw Object.assign(new Error('AI did not return a usable photo. Try again.'), { statusCode: 502 });
    }
    return { image: `data:image/jpeg;base64,${encoded}` };
}

module.exports = { generateRecipeImage };
