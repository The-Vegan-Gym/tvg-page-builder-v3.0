const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

const MEAL_PLANNER_CATEGORIES = [
    'Breakfast',
    'Lunch / Dinner',
    'Dessert',
    'Snack',
    'Sauce',
    'Sides'
];

async function generateMealPlannerMetadata({ apiKey, recipe = {} }) {
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY is missing. Add it to your environment variables.');
    }

    const recipePayload = buildRecipePayload(recipe);
    if (!recipePayload.title && recipePayload.ingredients.length === 0 && !recipePayload.description) {
        throw new Error('No recipe data found for Meal Planner metadata generation.');
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
                            text: `${getMealPlannerMetadataPrompt()}\n\nRecipe data:\n${JSON.stringify(recipePayload, null, 2)}`
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

    const parsed = parseJsonOutput(extractResponseText(data));
    return normalizeMealPlannerMetadata(parsed, recipePayload);
}

function buildRecipePayload(recipe = {}) {
    return {
        title: String(recipe.title || '').trim(),
        description: String(recipe.description || '').trim(),
        ingredients: getIngredientNames(recipe).slice(0, 120),
        instructions: getInstructionTexts(recipe).slice(0, 80),
        macros: recipe.macros || {}
    };
}

function getIngredientNames(recipe = {}) {
    const sections = Array.isArray(recipe.ingredientSections) && recipe.ingredientSections.length > 0
        ? recipe.ingredientSections
        : [{ ingredients: recipe.ingredients || [] }];

    return sections.flatMap((section) => section.ingredients || [])
        .filter((ingredient) => ingredient && ingredient.type !== 'header' && ingredient.type !== 'subtitle')
        .map((ingredient) => String(ingredient.name || '').trim())
        .filter(Boolean);
}

function getInstructionTexts(recipe = {}) {
    const sections = Array.isArray(recipe.instructionSections) && recipe.instructionSections.length > 0
        ? recipe.instructionSections
        : [{ instructions: recipe.instructions || [] }];

    return sections.flatMap((section) => section.instructions || [])
        .map((instruction) => String(instruction?.text || instruction || '').trim())
        .filter(Boolean);
}

function normalizeMealPlannerMetadata(parsed, recipePayload) {
    const category = MEAL_PLANNER_CATEGORIES.includes(String(parsed?.category || '').trim())
        ? String(parsed.category).trim()
        : inferFallbackCategory(recipePayload);

    const ingredients = normalizeStringList(parsed?.ingredients);
    const allergy = normalizeStringList(parsed?.allergy)
        .map((item) => item.toLowerCase())
        .filter((item, index, items) => items.indexOf(item) === index);

    return {
        category,
        ingredients: ingredients.length > 0 ? ingredients : recipePayload.ingredients,
        allergy
    };
}

function normalizeStringList(value) {
    const values = Array.isArray(value)
        ? value
        : String(value || '').split(/[\n,]+/);

    const seen = new Set();
    return values
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .filter((item) => {
            const key = item.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

function inferFallbackCategory(recipePayload) {
    const text = `${recipePayload.title} ${recipePayload.description}`.toLowerCase();
    if (/\b(breakfast|oat|oats|pancake|waffle|smoothie|cereal)\b/.test(text)) return 'Breakfast';
    if (/\b(cookie|brownie|cake|dessert|sweet)\b/.test(text)) return 'Dessert';
    if (/\b(snack|bar|bite)\b/.test(text)) return 'Snack';
    if (/\b(sauce|dressing|dip|spread)\b/.test(text)) return 'Sauce';
    if (/\b(side|salad)\b/.test(text)) return 'Sides';
    return 'Lunch / Dinner';
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
        throw new Error('OpenAI returned invalid Meal Planner metadata JSON.');
    }
}

function getMealPlannerMetadataPrompt() {
    return `You prepare recipe metadata for an Airtable meal planner.

Return ONLY valid JSON in this exact shape:
{
  "category": "Breakfast",
  "ingredients": ["Ground Flaxseed"],
  "allergy": ["soy"]
}

Allowed category values:
${MEAL_PLANNER_CATEGORIES.map((category) => `- ${category}`).join('\n')}

Rules:
- Pick exactly one category from the allowed values.
- Convert branded or long ingredient names into simple grocery-style ingredient names.
- Preserve meaningful food identity, but remove brand names, marketing claims, package descriptors, flavors, and redundant processing words.
- Examples: "Bob's Red Mill Premium Whole-Ground Flaxseed Meal" becomes "Ground Flaxseed"; "PBfit Peanut Butter Powder, Original" becomes "Peanut Butter Powder"; "Original Unsweetened Soymilk" becomes "Soy Milk".
- Return one ingredient per array item.
- Do not include amounts, measurements, brands, or duplicate ingredients.
- Add allergy tags only when clearly present from ingredients.
- Use simple lowercase allergy tags such as "soy", "peanut", "tree nut", "gluten", "wheat", or "sesame".
- If there are no clear allergy tags, return an empty allergy array.`;
}

module.exports = {
    MEAL_PLANNER_CATEGORIES,
    generateMealPlannerMetadata
};
