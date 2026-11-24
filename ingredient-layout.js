const INGREDIENT_LAYOUT_SETTINGS = {
    ingredientGap: { min: 0, max: 40, defaultValue: 12 },
    ingredientAmountWidth: { min: 30, max: 65, defaultValue: 46 }
};

function getIngredientLayout(recipe = {}) {
    return Object.fromEntries(Object.entries(INGREDIENT_LAYOUT_SETTINGS).map(([key, setting]) => {
        const parsed = Number.parseInt(recipe[key], 10);
        const value = Number.isFinite(parsed) ? parsed : setting.defaultValue;
        return [key, Math.max(setting.min, Math.min(setting.max, value))];
    }));
}

function keepIngredientMeasurementsTogether(amount) {
    return String(amount ?? '').replace(
        /(\p{N})[ \t]+(?=(?:kg|mg|g|kilograms?|milligrams?|grams?|ml|l|millilit(?:er|re)s?|lit(?:er|re)s?|oz|ounces?|lbs?|pounds?|cups?|tsp|tbsp|teaspoons?|tablespoons?)\b)/giu,
        '$1\u00a0'
    );
}

if (typeof module === 'object' && module.exports) {
    module.exports = { INGREDIENT_LAYOUT_SETTINGS, getIngredientLayout, keepIngredientMeasurementsTogether };
}
