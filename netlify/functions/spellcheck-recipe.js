const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
        return jsonResponse(204, {});
    }

    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY is missing. Add it to your Netlify environment variables.');
        }

        const payload = parseBody(event);
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

        return jsonResponse(200, { corrections, equipmentSuggestions });
    } catch (error) {
        console.error('Recipe analysis error:', error);
        return jsonResponse(400, { error: error.message || 'Unable to analyze recipe text' });
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
