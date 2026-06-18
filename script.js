/**
 * Recipe Page Generator
 * The Vegan Gym - Version 3.0
 *
 * This application generates recipe pages matching The Vegan Gym cookbook layout.
 */

// ================================================
// CONFIGURATION & DATA STRUCTURES
// ================================================

/**
 * Available materials/equipment icons
 * Will be loaded from icons-database.json
 */
let AVAILABLE_MATERIALS = [];
let AVAILABLE_PORTION_VARIATION_ICONS = [];

const CUSTOM_PORTION_VARIATION_ICON_FILES = [
    { id: 'cart', name: 'Cart', path: 'Icons/cart.svg' },
    { id: 'link', name: 'Link', path: 'Icons/link.svg' }
];

const FALLBACK_EQUIPMENT_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="8" y="8" width="32" height="32" rx="6" stroke="black" stroke-width="2"/>
<path d="M16 24H32" stroke="black" stroke-width="2" stroke-linecap="round"/>
<path d="M24 16V32" stroke="black" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const DEFAULT_PORTION_VARIATION_SVG = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7 16.5C7 22.5751 11.9249 27.5 18 27.5H23.5C27.6421 27.5 31 24.1421 31 20V16.5H7Z" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.5 16.5C5.567 16.5 4 14.933 4 13C4 11.067 5.567 9.5 7.5 9.5H20.5C21.8807 9.5 23.1818 10.1348 24.0271 11.2204L25.5 13.1111L29 14" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M14 8.5L15.5 6.5" stroke="black" stroke-width="1.8" stroke-linecap="round"/>
<path d="M19 9L19.8 6.5" stroke="black" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

/**
 * Empty recipe template (starts blank)
 */
const EMPTY_RECIPE = {
    pageType: "recipe",
    pageStyle: "standard",
    title: "",
    titleFontSize: 40,
    printerTitleTopPadding: 70,
    printerTitleMacroSpacing: 16,
    image: "",
    heroHeight: 309,
    imageSettings: {
        scale: 100,
        posX: 50,
        posY: 50
    },
    showCornerLogo: true,
    showMacroBar: true,
    macroBarPrefix: "",
    showDescription: true,
    macros: {
        calories: "",
        protein: "",
        carbs: "",
        fat: ""
    },
    description: "",
    dayMealsTitle: "Meals",
    dayBreakdownTitle: "Macronutrient Breakdown",
    dayHighlightsTitle: "Nutrition Highlights",
    dayTipsTitle: "Tips for Success",
    dayTotalsTitle: "Daily Totals",
    dayMeals: [],
    dayHighlights: [],
    dayTips: [],
    portionVariations: [],
    portionVariationsLabel: "Portion Variations",
    portionVariationIcon: "",
    portionVariationSections: [],
    servingsLabel: "Ingredients for 1 Serving",
    showIngredientsHeader: true,
    ingredientSections: [],
    instructionsLabel: "Instructions for 1 Serving",
    showInstructionsHeader: true,
    instructionSubtitleCase: "preserve",
    instructionsStartMode: "force-right-column",
    showDirectionsContinuedHeader: false,
    materialsLayout: "column",
    showMaterials: true,
    materialsAutoSpacing: false,
    materials: [],
    ingredients: [],
    instructionSections: [],
    instructions: [],
    notes: [],
    pageBottomMargin: 0,
    continuationContentSpacing: 50,
    pageNumber: ""
};

const SECTION_SETTINGS_STORAGE_KEY = 'tvgRecipePageGenerator.sectionVisibility';
const SECTION_SETTINGS_VERSION_KEY = 'tvgRecipePageGenerator.sectionVisibilityVersion';
const SECTION_SETTINGS_VERSION = 2;
const RECENT_RECIPES_STORAGE_KEY = 'tvgRecipePageGenerator.recentRecipes';
const SECTION_VISIBILITY_DEFAULTS = [
    { key: 'masterPaste', label: 'Master Paste', visible: true },
    { key: 'basicInformation', label: 'Basic Information', visible: true },
    { key: 'heroImage', label: 'Image', visible: true },
    { key: 'nutritionInformation', label: 'Nutrition Information', visible: true },
    { key: 'meals', label: 'Meals', visible: true },
    { key: 'dayHighlights', label: 'Day Highlights', visible: true },
    { key: 'portionVariations', label: 'Portion Variations', visible: false },
    { key: 'materialsEquipment', label: 'Materials/Equipment', visible: true },
    { key: 'ingredients', label: 'Ingredients', visible: true },
    { key: 'instructions', label: 'Instructions', visible: true },
    { key: 'notes', label: 'Notes/Callouts', visible: true },
    { key: 'pageLayout', label: 'Page Layout', visible: true },
    { key: 'export', label: 'Export', visible: true }
];

const SECTION_INFO_CONTENT = {
    masterPaste: {
        title: 'Master Paste',
        items: [
            'Paste structured recipe text here to fill the main recipe fields at once.',
            'Use Copy AI Instructions to get an AI-ready format, then paste the result and click Fill All.',
            'This can populate title, description, macros, equipment, ingredients, instructions, and notes.'
        ]
    },
    basicInformation: {
        title: 'Basic Information',
        items: [
            'Recipe Title sets the main title shown on the recipe page.',
            'Show description controls whether the short description appears under the header.',
            'Description Text is the paragraph shown below the title and macros.'
        ]
    },
    heroImage: {
        title: 'Image',
        items: [
            'Hero Image uploads the main image used in the page header.',
            'Zoom, height, and position controls adjust how the image is cropped.',
            'Show corner logo adds the TVG logo mark to the top-right corner.'
        ]
    },
    nutritionInformation: {
        title: 'Nutrition Information',
        items: [
            'Show Macro Bar controls whether macros appear below the hero/title area.',
            'Info Before Macros adds optional leading text like “Per bite:” before the macro values.',
            'Calories, protein, carbs, and fat populate the macro bar.'
        ]
    },
    meals: {
        title: 'Meals',
        items: [
            'Meal Card Paste lets you bulk-create day-of-eating meal cards from structured rows.',
            'Copy Meal AI Prompt gives an AI-ready format for meal data.',
            'Add Meal creates an individual editable meal card.'
        ]
    },
    dayHighlights: {
        title: 'Day Highlights',
        items: [
            'Nutrition Highlights and Tips become list sections on day-of-eating pages.',
            'Section title fields rename the page areas.',
            'Daily Totals Title controls the label for the macro summary section.'
        ]
    },
    portionVariations: {
        title: 'Portion Variations',
        items: [
            'Use this for alternate serving sizes, swaps, or linked portion options.',
            'Each set can have its own label, icon, and list of variations.',
            'Leave it empty when the recipe does not need portion alternatives.'
        ]
    },
    materialsEquipment: {
        title: 'Materials/Equipment',
        items: [
            'Show equipment controls whether selected equipment appears on the page.',
            'Materials Layout chooses whether equipment spans the full width or stays with the left column.',
            'Select Equipment opens the icon picker for tools used in the recipe.'
        ]
    },
    ingredients: {
        title: 'Ingredients',
        items: [
            'Ingredient sets let you group ingredients under separate labels.',
            'Ingredients Start controls whether a set begins in the left or right column.',
            'Add Ingredient adds a new ingredient and amount row.'
        ]
    },
    instructions: {
        title: 'Instructions',
        items: [
            'Instruction set labels become the headings above directions.',
            'Instructions Start controls where directions begin in the layout.',
            'Show Directions Continued Header adds a continuation heading when directions flow to another page.'
        ]
    },
    notes: {
        title: 'Notes/Callouts',
        items: [
            'Notes create callout boxes for reminders, prep tips, or warnings.',
            'Text before a colon is bolded automatically, such as “Note:” or “Prep Tip:”.',
            'Leave this section empty when no callouts are needed.'
        ]
    },
    pageLayout: {
        title: 'Page Layout',
        items: [
            'Style switches between standard and printer-friendly page designs.',
            'Page Number adds an optional page number to the recipe.',
            'The sliders adjust title sizing, printer-friendly spacing, continuation-page spacing, and bottom flow clearance.'
        ]
    },
    export: {
        title: 'Export',
        items: [
            'Export All downloads standard and printer-friendly JPG versions with and without macros.',
            'Export JPG downloads the currently visible recipe version.',
            'Hidden export options can stay available in code without showing in the panel.'
        ]
    }
};

// ================================================
// STATE MANAGEMENT
// ================================================

/**
 * Current recipe state
 */
let currentRecipe = { ...EMPTY_RECIPE };
let zoomLevel = 100;
let previewPanX = 0;
let previewPanY = 0;
let isBottomMarginGuideVisible = false;
let bottomMarginGuideTimer = null;
let previewAutoCenterFrame = null;
let previewAutoCenterTimer = null;
let activeEditorSectionKey = 'basicInformation';
let masterPasteAiImages = [];

function normalizeRecipe(recipe = {}) {
    const normalized = {
        ...EMPTY_RECIPE,
        ...recipe,
        imageSettings: {
            ...EMPTY_RECIPE.imageSettings,
            ...(recipe.imageSettings || {})
        },
        macros: {
            ...EMPTY_RECIPE.macros,
            ...(recipe.macros || {})
        },
        materials: Array.isArray(recipe.materials) ? recipe.materials : [],
        dayMeals: Array.isArray(recipe.dayMeals) ? recipe.dayMeals : [],
        dayHighlights: Array.isArray(recipe.dayHighlights) ? recipe.dayHighlights : [],
        dayTips: Array.isArray(recipe.dayTips) ? recipe.dayTips : [],
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
        ingredientSections: Array.isArray(recipe.ingredientSections) ? recipe.ingredientSections : [],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [],
        instructionSections: Array.isArray(recipe.instructionSections) ? recipe.instructionSections : [],
        showIngredientsHeader: recipe.showIngredientsHeader !== false,
        showInstructionsHeader: recipe.showInstructionsHeader !== false,
        showDirectionsContinuedHeader: recipe.showDirectionsContinuedHeader === true,
        showMaterials: recipe.showMaterials !== false,
        materialsAutoSpacing: recipe.materialsAutoSpacing === true,
        notes: Array.isArray(recipe.notes)
            ? recipe.notes
            : (recipe.note ? [recipe.note] : []),
        portionVariations: Array.isArray(recipe.portionVariations) ? recipe.portionVariations : [],
        portionVariationSections: Array.isArray(recipe.portionVariationSections) ? recipe.portionVariationSections : []
    };

    normalized.portionVariationSections = normalized.portionVariationSections
        .map((section) => ({
            label: section.label || 'Portion Variations',
            icon: section.icon ?? '',
            linkIconPosition: section.linkIconPosition === 'left' ? 'left' : 'right',
            variations: Array.isArray(section.variations) ? section.variations.map(normalizePortionVariation) : []
        }))
        .filter((section) =>
            section.label ||
            section.icon ||
            section.variations.some((variation) =>
                variation?.label || variation?.calories || variation?.protein || variation?.carbs || variation?.fat || variation?.fiber || variation?.url
            )
        );

    if (normalized.portionVariationSections.length === 0 && (
        normalized.portionVariations.length > 0 ||
        normalized.portionVariationsLabel ||
        normalized.portionVariationIcon
    )) {
        normalized.portionVariationSections = [{
            label: normalized.portionVariationsLabel || EMPTY_RECIPE.portionVariationsLabel,
            icon: normalized.portionVariationIcon || '',
            linkIconPosition: 'right',
            variations: normalized.portionVariations.map(normalizePortionVariation)
        }];
    }

    if (normalized.portionVariationSections.length > 0) {
        normalized.portionVariationsLabel = normalized.portionVariationSections[0].label || EMPTY_RECIPE.portionVariationsLabel;
        normalized.portionVariationIcon = normalized.portionVariationSections[0].icon || '';
        normalized.portionVariations = normalized.portionVariationSections[0].variations || [];
    }

    normalized.ingredientSections = normalized.ingredientSections
        .map((section) => ({
            label: section.label || '',
            startMode: section.startMode === 'force-right-column' ? 'force-right-column' : 'auto',
            ingredients: Array.isArray(section.ingredients) ? section.ingredients : []
        }))
        .filter((section) => section.label || section.ingredients.length > 0);

    if (normalized.ingredientSections.length === 0 && (
        normalized.ingredients.length > 0 ||
        normalized.servingsLabel
    )) {
        normalized.ingredientSections = [{
            label: '',
            startMode: 'auto',
            ingredients: normalized.ingredients
        }];
    }

    if (normalized.ingredientSections.length > 0) {
        normalized.servingsLabel = normalized.servingsLabel || EMPTY_RECIPE.servingsLabel;
        normalized.ingredients = normalized.ingredientSections[0].ingredients || [];
    }

    if (!normalized.instructionsLabel && normalized.instructionSections.length > 0) {
        normalized.instructionsLabel = EMPTY_RECIPE.instructionsLabel;
    }

    if ((!normalized.instructions || normalized.instructions.length === 0) && normalized.instructionSections.length > 0) {
        normalized.instructions = normalized.instructionSections[0]?.steps || [];
    }

    return normalized;
}

function normalizePortionVariation(variation = {}) {
    if (typeof variation === 'string') {
        return {
            label: variation,
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            fiber: '',
            url: '',
            showMacros: true
        };
    }

    return {
        label: variation.label || '',
        calories: variation.calories || '',
        protein: variation.protein || '',
        carbs: variation.carbs || '',
        fat: variation.fat || '',
        fiber: variation.fiber || '',
        url: variation.url || '',
        showMacros: variation.showMacros !== false
    };
}

function parseBooleanFlag(value, defaultValue = true) {
    const normalized = String(value ?? '').trim().toLowerCase();
    if (!normalized) return defaultValue;
    return !['0', 'false', 'no', 'off', 'hide', 'hidden'].includes(normalized);
}

function getRecipePageDimensions() {
    const page = elements.recipePage();

    if (!page) {
        return { width: 0, height: 0 };
    }

    // offsetWidth/offsetHeight return the layout size before CSS transforms,
    // so the transform doesn't need to be removed for measurement. The old
    // approach conflicted with the `transition: transform 0.2s` on
    // .recipe-page-stack and measured mid-transition scaled sizes.
    return { width: page.offsetWidth, height: page.offsetHeight };
}

// ================================================
// DOM ELEMENTS
// ================================================

const elements = {
    // Form inputs
    masterPaste: () => document.getElementById('master-paste'),
    masterPasteStatus: () => document.getElementById('master-paste-status'),
    masterPasteAiSource: () => document.getElementById('master-paste-ai-source'),
    masterPasteAiDropzone: () => document.getElementById('master-paste-ai-dropzone'),
    masterPasteAiImages: () => document.getElementById('master-paste-ai-images'),
    masterPasteAiFiles: () => document.getElementById('master-paste-ai-files'),
    btnMasterPasteAiImages: () => document.getElementById('btn-master-paste-ai-images'),
    btnGenerateMasterPasteAi: () => document.getElementById('btn-generate-master-paste-ai'),
    btnMasterPasteInfo: () => document.getElementById('btn-master-paste-info'),
    btnCloseMasterPasteInfo: () => document.getElementById('btn-close-master-paste-info'),
    masterPasteInfoPanel: () => document.getElementById('master-paste-info-panel'),
    btnSectionSettings: () => document.getElementById('btn-section-settings'),
    sectionSettingsPanel: () => document.getElementById('section-settings-panel'),
    sectionSettingsList: () => document.getElementById('section-settings-list'),
    editorSectionNav: () => document.getElementById('editor-section-nav'),
    editorSectionButtons: () => Array.from(document.querySelectorAll('[data-section-target]')),
    pageType: () => document.getElementById('page-type'),
    pageStyle: () => document.getElementById('page-style'),
    pageStyleButtons: () => Array.from(document.querySelectorAll('[data-page-style]')),
    title: () => document.getElementById('title'),
    titleFontSize: () => document.getElementById('title-font-size'),
    titleFontSizeValue: () => document.getElementById('title-font-size-value'),
    printerTitleTopPadding: () => document.getElementById('printer-title-top-padding'),
    printerTitleTopPaddingValue: () => document.getElementById('printer-title-top-padding-value'),
    printerTitleMacroSpacing: () => document.getElementById('printer-title-macro-spacing'),
    printerTitleMacroSpacingValue: () => document.getElementById('printer-title-macro-spacing-value'),
    continuationContentSpacing: () => document.getElementById('continuation-content-spacing'),
    continuationContentSpacingValue: () => document.getElementById('continuation-content-spacing-value'),
    heroImage: () => document.getElementById('hero-image'),
    imageUploadArea: () => document.getElementById('image-upload-area'),
    imagePreviewThumb: () => document.getElementById('image-preview-thumb'),
    btnRemoveHeroImage: () => document.getElementById('btn-remove-hero-image'),
    uploadPlaceholder: () => document.getElementById('upload-placeholder'),
    imageControls: () => document.getElementById('image-controls'),
    imageScale: () => document.getElementById('image-scale'),
    imageScaleValue: () => document.getElementById('image-scale-value'),
    heroHeight: () => document.getElementById('hero-height'),
    heroHeightValue: () => document.getElementById('hero-height-value'),
    imagePosX: () => document.getElementById('image-pos-x'),
    imagePosXValue: () => document.getElementById('image-pos-x-value'),
    imagePosY: () => document.getElementById('image-pos-y'),
    imagePosYValue: () => document.getElementById('image-pos-y-value'),
    btnResetImageControls: () => document.getElementById('btn-reset-image-controls'),
    showCornerLogo: () => document.getElementById('show-corner-logo'),
    description: () => document.getElementById('description'),
    showDescription: () => document.getElementById('show-description'),
    pageNumber: () => document.getElementById('page-number'),
    showMacroBar: () => document.getElementById('show-macro-bar'),
    macroBarPrefix: () => document.getElementById('macro-bar-prefix'),
    calories: () => document.getElementById('calories'),
    protein: () => document.getElementById('protein'),
    carbs: () => document.getElementById('carbs'),
    fat: () => document.getElementById('fat'),
    dayMealsPaste: () => document.getElementById('day-meals-paste'),
    btnCopyDayMealsPrompt: () => document.getElementById('btn-copy-day-meals-prompt'),
    btnDayMealsPaste: () => document.getElementById('btn-day-meals-paste'),
    dayMealsList: () => document.getElementById('day-meals-list'),
    addDayMeal: () => document.getElementById('add-day-meal'),
    dayHighlightsTitle: () => document.getElementById('day-highlights-title'),
    dayHighlights: () => document.getElementById('day-highlights'),
    dayTipsTitle: () => document.getElementById('day-tips-title'),
    dayTips: () => document.getElementById('day-tips'),
    dayMealsTitle: () => document.getElementById('day-meals-title'),
    dayBreakdownTitle: () => document.getElementById('day-breakdown-title'),
    dayTotalsTitle: () => document.getElementById('day-totals-title'),
    portionVariationSections: () => document.getElementById('portion-variation-sections'),
    addPortionVariationSection: () => document.getElementById('add-portion-variation-section'),
    materialsLayout: () => document.getElementById('materials-layout'),
    showMaterials: () => document.getElementById('show-materials'),
    materialsLayoutButtons: () => Array.from(document.querySelectorAll('[data-materials-layout]')),
    materialsAutoSpacing: () => document.getElementById('materials-auto-spacing'),
    selectedMaterialsPreview: () => document.getElementById('selected-materials-preview'),
    btnSelectEquipment: () => document.getElementById('btn-select-equipment'),
    equipmentOverlay: () => document.getElementById('equipment-overlay'),
    equipmentGrid: () => document.getElementById('equipment-grid'),
    btnCloseEquipment: () => document.getElementById('btn-close-equipment'),
    btnSaveEquipment: () => document.getElementById('btn-save-equipment'),
    ingredientsList: () => document.getElementById('ingredients-list'),
    servingsLabel: () => document.getElementById('servings-label'),
    showIngredientsHeader: () => document.getElementById('show-ingredients-header'),
    addIngredientSection: () => document.getElementById('add-ingredient-section'),
    instructionsLabel: () => document.getElementById('instructions-label'),
    showInstructionsHeader: () => document.getElementById('show-instructions-header'),
    instructionSubtitleCase: () => document.getElementById('instruction-subtitle-case'),
    instructionSubtitleCaseButtons: () => Array.from(document.querySelectorAll('[data-instruction-subtitle-case]')),
    instructionsStartMode: () => document.getElementById('instructions-start-mode'),
    showDirectionsContinuedHeader: () => document.getElementById('show-directions-continued-header'),
    instructionsList: () => document.getElementById('instructions-list'),
    addInstructionSection: () => document.getElementById('add-instruction-section'),
    notesList: () => document.getElementById('notes-list'),
    addNote: () => document.getElementById('add-note'),
    pageBottomMargin: () => document.getElementById('page-bottom-margin'),
    pageBottomMarginValue: () => document.getElementById('page-bottom-margin-value'),

    // Buttons
    btnFillAll: () => document.getElementById('btn-fill-all'),
    btnCopyAIInstructions: () => document.getElementById('btn-copy-ai-instructions'),
    btnCopyAIInfoInstructions: () => document.getElementById('btn-copy-ai-info-instructions'),
    btnCopyAIDayInstructions: () => document.getElementById('btn-copy-ai-day-instructions'),
    btnExportAll: () => document.getElementById('btn-export-all'),
    btnExportJpg: () => document.getElementById('btn-export-jpg'),
    btnExportJpgPreview: () => document.getElementById('btn-export-jpg-preview'),
    btnExportEditablePdf: () => document.getElementById('btn-export-editable-pdf'),
    btnPrint: () => document.getElementById('btn-print'),
    btnSaveJson: () => document.getElementById('btn-save-json'),
    btnSaveJsonPreview: () => document.getElementById('btn-save-json-preview'),
    btnLoadJson: () => document.getElementById('btn-load-json'),
    btnLoadJsonPreview: () => document.getElementById('btn-load-json-preview'),
    jsonFileInput: () => document.getElementById('json-file-input'),
    loadRecipeOverlay: () => document.getElementById('load-recipe-overlay'),
    recentRecipesList: () => document.getElementById('recent-recipes-list'),
    btnCloseLoadRecipe: () => document.getElementById('btn-close-load-recipe'),
    btnLoadFromComputer: () => document.getElementById('btn-load-from-computer'),
    btnClear: () => document.getElementById('btn-clear'),
    btnZoomIn: () => document.getElementById('btn-zoom-in'),
    btnZoomOut: () => document.getElementById('btn-zoom-out'),
    btnCenterPreview: () => document.getElementById('btn-center-preview'),
    zoomSlider: () => document.getElementById('zoom-slider'),
    zoomLevelDisplay: () => document.getElementById('zoom-level'),

    // Preview
    recipePage: () => document.getElementById('recipe-page'),
    previewContainer: () => document.getElementById('preview-container'),
    printPage: () => document.getElementById('print-page')
};

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadIconsDatabase();
    populatePortionVariationIconOptions();
    initializeCollapsibleSections();
    initializeSectionInfoPanels();
    initializeSectionSettings();
    initializeEditorSectionNav();
    initializeMaterialsSelector();
    initializePreviewPanning();
    initializeFormListeners();
    initializeButtonListeners();
    loadRecipeToForm(currentRecipe);
    renderRecipePage();
    setZoomToFit();
});

function initializeCollapsibleSections() {
    document.querySelectorAll('.recipe-form > .form-section').forEach((section) => {
        if (section.dataset.accordionInitialized === 'true') return;

        const heading = section.querySelector(':scope > h2');
        if (!heading) return;

        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'form-section-toggle';
        toggle.setAttribute('aria-expanded', 'true');

        const title = document.createElement('span');
        title.className = 'form-section-toggle-title';
        title.textContent = heading.textContent;

        const icon = document.createElement('span');
        icon.className = 'form-section-toggle-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '⌄';

        toggle.append(title, icon);
        heading.replaceWith(toggle);

        const content = document.createElement('div');
        content.className = 'form-section-content';
        while (toggle.nextSibling) {
            content.appendChild(toggle.nextSibling);
        }
        section.appendChild(content);

        toggle.addEventListener('click', () => {
            const isCollapsed = section.classList.toggle('is-collapsed');
            content.hidden = isCollapsed;
            toggle.setAttribute('aria-expanded', String(!isCollapsed));
        });

        section.dataset.accordionInitialized = 'true';
    });
}

function initializeSectionInfoPanels() {
    document.querySelectorAll('.recipe-form > .form-section').forEach((section) => {
        const sectionKey = section.dataset.sectionKey;
        const info = SECTION_INFO_CONTENT[sectionKey];
        if (!info || section.dataset.infoInitialized === 'true') return;

        if (section.querySelector(':scope > .section-heading-with-action')) {
            section.dataset.infoInitialized = 'true';
            return;
        }

        const toggle = section.querySelector(':scope > .form-section-toggle');
        if (!toggle) return;

        const headingRow = document.createElement('div');
        headingRow.className = 'section-heading-with-action';
        section.insertBefore(headingRow, toggle);
        headingRow.appendChild(toggle);

        const infoButton = document.createElement('button');
        infoButton.type = 'button';
        infoButton.className = 'section-info-button';
        infoButton.setAttribute('aria-label', `About ${info.title}`);
        infoButton.setAttribute('aria-expanded', 'false');
        infoButton.innerHTML = '<img src="Icons/info.svg" alt="">';

        const panel = document.createElement('div');
        panel.className = 'section-info-panel';
        panel.hidden = true;
        panel.innerHTML = `
            <button type="button" class="section-info-close" aria-label="Close ${escapeHtml(info.title)} info">&times;</button>
            <h3>${escapeHtml(info.title)}</h3>
            <ul>
                ${info.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        `;

        headingRow.appendChild(infoButton);
        section.insertBefore(panel, section.querySelector(':scope > .form-section-content'));

        infoButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const shouldOpen = panel.hidden;
            closeAllSectionInfoPanels();
            panel.hidden = !shouldOpen;
            infoButton.setAttribute('aria-expanded', String(shouldOpen));
        });

        panel.querySelector('.section-info-close')?.addEventListener('click', () => {
            panel.hidden = true;
            infoButton.setAttribute('aria-expanded', 'false');
        });

        section.dataset.infoInitialized = 'true';
    });

    document.addEventListener('click', (event) => {
        if (event.target.closest('.section-info-panel') || event.target.closest('.section-info-button')) return;
        closeAllSectionInfoPanels();
    });
}

function closeAllSectionInfoPanels() {
    document.querySelectorAll('.section-info-panel').forEach((panel) => {
        panel.hidden = true;
    });

    document.querySelectorAll('.section-info-button').forEach((button) => {
        button.setAttribute('aria-expanded', 'false');
    });
}

function getSectionVisibilitySettings() {
    const defaults = Object.fromEntries(SECTION_VISIBILITY_DEFAULTS.map((section) => [section.key, section.visible]));

    try {
        const saved = JSON.parse(localStorage.getItem(SECTION_SETTINGS_STORAGE_KEY) || '{}');
        const savedVersion = Number.parseInt(localStorage.getItem(SECTION_SETTINGS_VERSION_KEY) || '0', 10);
        const settings = savedVersion < SECTION_SETTINGS_VERSION
            ? { ...defaults }
            : { ...defaults, ...saved };

        if (savedVersion < SECTION_SETTINGS_VERSION) {
            saveSectionVisibilitySettings(settings);
        }

        return settings;
    } catch (error) {
        return defaults;
    }
}

function saveSectionVisibilitySettings(settings) {
    localStorage.setItem(SECTION_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem(SECTION_SETTINGS_VERSION_KEY, String(SECTION_SETTINGS_VERSION));
}

function getRecentRecipes() {
    try {
        const recents = JSON.parse(localStorage.getItem(RECENT_RECIPES_STORAGE_KEY) || '[]');
        return Array.isArray(recents) ? recents.slice(0, 5) : [];
    } catch (error) {
        return [];
    }
}

function saveRecentRecipe(recipe) {
    const normalizedRecipe = normalizeRecipe(recipe);
    const title = (normalizedRecipe.title || 'Untitled Recipe').trim();
    const savedAt = new Date().toISOString();
    const id = `${slugify(title || 'recipe')}-${Date.now()}`;
    const existing = getRecentRecipes().filter((item) => {
        const itemTitle = (item.recipe?.title || item.title || '').trim();
        return itemTitle.toLowerCase() !== title.toLowerCase();
    });
    const nextRecents = [{ id, title, savedAt, recipe: normalizedRecipe }, ...existing].slice(0, 5);

    try {
        localStorage.setItem(RECENT_RECIPES_STORAGE_KEY, JSON.stringify(nextRecents));
    } catch (error) {
        console.warn('Unable to save recent recipe. Browser storage may be full.', error);
    }
}

function loadRecipeObject(recipe) {
    const normalized = normalizeRecipe(recipe);
    currentRecipe = normalized;
    loadRecipeToForm(normalized);
    renderRecipePage();
}

function formatRecentRecipeDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Recently saved';
    }

    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function renderRecentRecipes() {
    const list = elements.recentRecipesList();
    if (!list) return;

    const recents = getRecentRecipes();

    if (recents.length === 0) {
        list.innerHTML = '<div class="recent-recipes-empty">No recent recipes yet.</div>';
        return;
    }

    list.innerHTML = recents.map((item, index) => {
        const title = item.title || item.recipe?.title || 'Untitled Recipe';
        const savedAt = formatRecentRecipeDate(item.savedAt);

        return `
            <button type="button" class="recent-recipe-item" data-recent-recipe-index="${index}">
                <span class="recent-recipe-title">${escapeHtml(title)}</span>
                <span class="recent-recipe-meta">${escapeHtml(savedAt)}</span>
            </button>
        `;
    }).join('');
}

function openLoadRecipeOverlay() {
    renderRecentRecipes();
    elements.loadRecipeOverlay()?.classList.add('active');
}

function closeLoadRecipeOverlay() {
    elements.loadRecipeOverlay()?.classList.remove('active');
}

function handleRecentRecipeClick(event) {
    const item = event.target.closest('[data-recent-recipe-index]');
    if (!item) return;

    const index = Number(item.dataset.recentRecipeIndex);
    const recent = getRecentRecipes()[index];
    if (!recent?.recipe) return;

    loadRecipeObject(recent.recipe);
    saveRecentRecipe(recent.recipe);
    closeLoadRecipeOverlay();
}

function getSectionPageTypeAvailability(section, pageType = elements.pageType()?.value || 'recipe') {
    if (!section) return false;
    if (section.classList.contains('recipe-only')) return pageType === 'recipe';
    if (section.classList.contains('day-plan-only')) return pageType === 'day-of-eating';
    return true;
}

function getAvailableEditorSectionKeys(settings = getSectionVisibilitySettings()) {
    const pageType = elements.pageType()?.value || 'recipe';

    return SECTION_VISIBILITY_DEFAULTS
        .map((sectionConfig) => sectionConfig.key)
        .filter((key) => {
            const section = document.querySelector(`[data-section-key="${key}"]`);
            return section && settings[key] !== false && getSectionPageTypeAvailability(section, pageType);
        });
}

function applyEditorSectionState(settings = getSectionVisibilitySettings()) {
    const availableKeys = getAvailableEditorSectionKeys(settings);

    if (!availableKeys.includes(activeEditorSectionKey)) {
        activeEditorSectionKey = availableKeys[0] || '';
    }

    document.querySelectorAll('.recipe-form > .form-section').forEach((section) => {
        const key = section.dataset.sectionKey;
        const isAvailable = availableKeys.includes(key);
        const isActive = isAvailable && key === activeEditorSectionKey;

        section.hidden = !isActive;
        section.classList.toggle('is-editor-active', isActive);
        section.classList.toggle('is-editor-unavailable', !isAvailable);
    });

    elements.editorSectionButtons().forEach((button) => {
        const key = button.dataset.sectionTarget;
        const isAvailable = availableKeys.includes(key);
        const isActive = isAvailable && key === activeEditorSectionKey;

        button.hidden = !isAvailable;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-current', isActive ? 'page' : 'false');
    });
}

function applySectionVisibilitySettings(settings = getSectionVisibilitySettings()) {
    applyEditorSectionState(settings);
}

function renderSectionSettingsList(settings = getSectionVisibilitySettings()) {
    const list = elements.sectionSettingsList();
    if (!list) return;

    list.innerHTML = SECTION_VISIBILITY_DEFAULTS.map((sectionConfig) => `
        <label class="form-toggle section-settings-toggle">
            <input type="checkbox" data-section-setting="${sectionConfig.key}" ${settings[sectionConfig.key] !== false ? 'checked' : ''}>
            <span>${escapeHtml(sectionConfig.label)}</span>
        </label>
    `).join('');

    list.querySelectorAll('[data-section-setting]').forEach((input) => {
        input.addEventListener('change', () => {
            const updatedSettings = getSectionVisibilitySettings();
            updatedSettings[input.dataset.sectionSetting] = input.checked;
            saveSectionVisibilitySettings(updatedSettings);
            applySectionVisibilitySettings(updatedSettings);
        });
    });
}

function initializeEditorSectionNav() {
    const nav = elements.editorSectionNav();
    if (!nav) return;

    nav.addEventListener('click', (event) => {
        const button = event.target.closest('[data-section-target]');
        if (!button || button.hidden || !nav.contains(button)) return;

        activeEditorSectionKey = button.dataset.sectionTarget;
        applyEditorSectionState();
    });

    applyEditorSectionState();
}

function initializeSectionSettings() {
    const button = elements.btnSectionSettings();
    const panel = elements.sectionSettingsPanel();
    if (!button || !panel) return;

    const settings = getSectionVisibilitySettings();
    renderSectionSettingsList(settings);
    applySectionVisibilitySettings(settings);

    button.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = panel.hidden;
        panel.hidden = !isOpen;
        button.setAttribute('aria-expanded', String(isOpen));
    });

    panel.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    document.addEventListener('click', () => {
        if (panel.hidden) return;
        panel.hidden = true;
        button.setAttribute('aria-expanded', 'false');
    });
}

function initializePreviewPanning() {
    const container = elements.previewContainer();
    if (!container) return;

    let isPanning = false;
    let isSpacePanEnabled = false;
    let panningButton = null;
    let startX = 0;
    let startY = 0;
    let startPanX = 0;
    let startPanY = 0;

    container.tabIndex = 0;
    container.setAttribute('aria-label', 'Recipe preview. Hold Space and drag to pan.');

    const canUseSpacePan = () => document.activeElement === container || container.contains(document.activeElement);

    const setSpacePanEnabled = (enabled) => {
        isSpacePanEnabled = enabled;
        container.classList.toggle('is-space-pan-enabled', enabled && !isPanning);
    };

    const startPanning = (event, mode) => {
        event.preventDefault();
        container.focus({ preventScroll: true });
        isPanning = true;
        panningButton = event.button;
        startX = event.clientX;
        startY = event.clientY;
        startPanX = previewPanX;
        startPanY = previewPanY;
        container.classList.remove('is-space-pan-enabled');
        container.classList.add('is-preview-panning');
        container.classList.toggle('is-middle-panning', mode === 'middle');
        container.classList.toggle('is-space-panning', mode === 'space');
    };

    container.addEventListener('mousedown', (event) => {
        container.focus({ preventScroll: true });

        if (event.button === 1) {
            startPanning(event, 'middle');
            return;
        }

        if (event.button === 0 && isSpacePanEnabled) {
            startPanning(event, 'space');
        }
    });

    window.addEventListener('mousemove', (event) => {
        if (!isPanning) return;

        event.preventDefault();
        previewPanX = startPanX + (event.clientX - startX);
        previewPanY = startPanY + (event.clientY - startY);
        applyPreviewPan();
    });

    window.addEventListener('mouseup', (event) => {
        if (!isPanning || event.button !== panningButton) return;

        isPanning = false;
        panningButton = null;
        container.classList.remove('is-preview-panning', 'is-middle-panning', 'is-space-panning');
        container.classList.toggle('is-space-pan-enabled', isSpacePanEnabled);
    });

    container.addEventListener('auxclick', (event) => {
        if (event.button === 1) {
            event.preventDefault();
        }
    });

    container.addEventListener('wheel', (event) => {
        if (event.ctrlKey || event.metaKey) {
            return;
        }

        event.preventDefault();
        container.focus({ preventScroll: true });

        const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
                ? container.clientHeight
                : 1;
        const deltaX = event.shiftKey && Math.abs(event.deltaX) < Math.abs(event.deltaY)
            ? event.deltaY
            : event.deltaX;

        previewPanX -= deltaX * unit;
        previewPanY -= event.deltaY * unit;
        applyPreviewPan();
        schedulePreviewAutoCenterIfOutOfView();
    }, { passive: false });

    window.addEventListener('keydown', (event) => {
        if (event.code !== 'Space' || event.repeat || !canUseSpacePan()) return;

        event.preventDefault();
        setSpacePanEnabled(true);
    });

    window.addEventListener('keyup', (event) => {
        if (event.code !== 'Space') return;

        event.preventDefault();
        setSpacePanEnabled(false);
    });

    container.addEventListener('blur', () => {
        if (!isPanning) {
            setSpacePanEnabled(false);
        }
    });
}

/**
 * Load icons from the equipment folder, falling back to the legacy JSON database
 */
async function loadIconsDatabase() {
    try {
        AVAILABLE_MATERIALS = await loadIconsFromFolder();
        console.log(`Loaded ${AVAILABLE_MATERIALS.length} equipment icons from equipment folder`);
    } catch (error) {
        console.warn('Unable to load equipment folder through /api/icons. Trying static icon manifest.', error);
        try {
            AVAILABLE_MATERIALS = await loadIconsFromManifest();
            console.log(`Loaded ${AVAILABLE_MATERIALS.length} equipment icons from equipment manifest`);
        } catch (manifestError) {
            console.warn('Unable to load equipment manifest. Falling back to icons-database.json.', manifestError);
            AVAILABLE_MATERIALS = await loadIconsFromDatabase();
        }
    }

    const customIcons = await loadCustomPortionVariationIcons();
    AVAILABLE_PORTION_VARIATION_ICONS = dedupeIconsById([
        ...customIcons,
        ...AVAILABLE_MATERIALS
    ]);
}

async function loadIconsFromFolder() {
    const response = await fetch('/api/icons');
    if (!response.ok) {
        throw new Error('Unable to list equipment folder');
    }

    const data = await response.json();
    const icons = Array.isArray(data.icons) ? data.icons : [];

    return loadIconSvgEntries(icons);
}

async function loadIconsFromManifest() {
    const response = await fetch('equipment/icons-manifest.json');
    if (!response.ok) {
        throw new Error('Unable to load equipment manifest');
    }

    const data = await response.json();
    const icons = Array.isArray(data.icons) ? data.icons : [];

    return loadIconSvgEntries(icons);
}

async function loadIconSvgEntries(icons) {
    if (icons.length === 0) {
        throw new Error('Icon list did not return any SVG files');
    }

    const loadedIcons = await Promise.all(icons.map(async (icon) => {
        try {
            const iconResponse = await fetch(icon.path);
            if (!iconResponse.ok) {
                throw new Error(`Unable to load ${icon.path}`);
            }

            const svg = await iconResponse.text();
            return {
                id: icon.id || slugify(icon.name),
                name: icon.name || titleizeFileName(icon.path),
                svg: getSafeEquipmentSvg({ name: icon.name, svg: sanitizeInlineSvg(svg) })
            };
        } catch (error) {
            console.warn(`Unable to load equipment icon "${icon.name || icon.path}".`, error);
            return null;
        }
    }));

    return loadedIcons.filter(Boolean);
}

async function loadIconsFromDatabase() {
    try {
        const response = await fetch('icons-database.json');
        const data = await response.json();

        return data.equipment.map(item => ({
            id: slugify(item.name),
            name: item.name,
            svg: getSafeEquipmentSvg(item)
        }));
    } catch (error) {
        console.error('Error loading icons database:', error);
        return [];
    }
}

function dedupeIconsById(icons) {
    const seen = new Set();
    return icons.filter((icon) => {
        if (!icon?.id || seen.has(icon.id)) {
            return false;
        }

        seen.add(icon.id);
        return true;
    });
}

function titleizeFileName(value) {
    const fileName = String(value || '').split('/').pop() || '';
    return fileName
        .replace(/\.svg$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getSafeEquipmentSvg(item) {
    const svg = item?.svg || '';

    if (!svg.trim()) {
        console.warn(`Equipment icon "${item?.name || 'Unknown'}" is empty. Using fallback icon.`);
        return FALLBACK_EQUIPMENT_SVG;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const parseError = doc.querySelector('parsererror');
        const root = doc.documentElement;

        if (parseError || !root || root.tagName.toLowerCase() !== 'svg') {
            throw new Error('Invalid SVG markup');
        }

        return svg;
    } catch (error) {
        console.warn(`Equipment icon "${item?.name || 'Unknown'}" failed SVG validation. Using fallback icon.`, error);
        return FALLBACK_EQUIPMENT_SVG;
    }
}

async function loadCustomPortionVariationIcons() {
    const loadedIcons = await Promise.all(CUSTOM_PORTION_VARIATION_ICON_FILES.map(async (icon) => {
        try {
            const response = await fetch(icon.path);
            if (!response.ok) {
                throw new Error(`Unable to load ${icon.path}`);
            }

            const svg = await response.text();
            return {
                id: icon.id,
                name: icon.name,
                svg: getSafeEquipmentSvg({ name: icon.name, svg: sanitizeInlineSvg(svg) })
            };
        } catch (error) {
            console.warn(`Unable to load custom portion variation icon "${icon.name}".`, error);
            return null;
        }
    }));

    return loadedIcons.filter(Boolean);
}

function sanitizeInlineSvg(svg) {
    return String(svg || '')
        .replace(/<\?xml[^>]*>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();
}

function populatePortionVariationIconOptions() {
    const selects = elements.portionVariationSections()?.querySelectorAll('.portion-variation-section-icon') || [];
    selects.forEach((select) => {
        const selectedValue = select.value || '';
        select.innerHTML = `
            <option value="">Default Bowl</option>
            <option value="none">None</option>
        `;

        AVAILABLE_PORTION_VARIATION_ICONS.forEach((material) => {
            const option = document.createElement('option');
            option.value = material.id;
            option.textContent = material.name;
            if (material.id === selectedValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

/**
 * Temporary selection state for the equipment overlay
 */
let tempSelectedMaterials = [];

/**
 * Initialize the equipment overlay and its event listeners
 */
function initializeMaterialsSelector() {
    // Populate the equipment grid in the overlay
    const grid = elements.equipmentGrid();
    if (!grid) return;

    AVAILABLE_MATERIALS.forEach(material => {
        const div = document.createElement('div');
        div.className = 'equipment-item';
        div.dataset.materialId = material.id;
        div.innerHTML = `
            <span class="equipment-icon">${material.svg}</span>
            <span class="equipment-name">${material.name}</span>
        `;

        div.addEventListener('click', () => {
            div.classList.toggle('selected');
            const materialId = div.dataset.materialId;
            if (div.classList.contains('selected')) {
                if (!tempSelectedMaterials.includes(materialId)) {
                    tempSelectedMaterials.push(materialId);
                }
            } else {
                tempSelectedMaterials = tempSelectedMaterials.filter(id => id !== materialId);
            }
        });

        grid.appendChild(div);
    });

    // Open overlay button
    elements.btnSelectEquipment()?.addEventListener('click', openEquipmentOverlay);

    // Close overlay button
    elements.btnCloseEquipment()?.addEventListener('click', closeEquipmentOverlay);

    // Save selection button
    elements.btnSaveEquipment()?.addEventListener('click', saveEquipmentSelection);

    // Close on overlay background click
    elements.equipmentOverlay()?.addEventListener('click', (e) => {
        if (e.target === elements.equipmentOverlay()) {
            closeEquipmentOverlay();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.equipmentOverlay()?.classList.contains('active')) {
            closeEquipmentOverlay();
        }
    });
}

/**
 * Open the equipment selection overlay
 */
function openEquipmentOverlay() {
    // Initialize temp selection with current recipe materials
    tempSelectedMaterials = [...(currentRecipe.materials || [])];

    // Update grid selection state
    const items = elements.equipmentGrid()?.querySelectorAll('.equipment-item');
    items?.forEach(item => {
        const isSelected = tempSelectedMaterials.includes(item.dataset.materialId);
        item.classList.toggle('selected', isSelected);
    });

    elements.equipmentOverlay()?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the equipment selection overlay
 */
function closeEquipmentOverlay() {
    elements.equipmentOverlay()?.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Save the equipment selection and update the recipe
 */
function saveEquipmentSelection() {
    currentRecipe.materials = [...tempSelectedMaterials];
    updateSelectedMaterialsPreview();
    renderRecipePage();
    closeEquipmentOverlay();
}

/**
 * Update the preview of selected materials in the form
 */
function updateSelectedMaterialsPreview() {
    const preview = elements.selectedMaterialsPreview();
    if (!preview) return;

    const materials = currentRecipe.materials || [];

    if (materials.length === 0) {
        preview.classList.remove('has-items');
        preview.innerHTML = '<span class="no-materials-text">No equipment selected</span>';
    } else {
        preview.classList.add('has-items');
        preview.innerHTML = materials.map(materialId => {
            const material = AVAILABLE_MATERIALS.find(m => m.id === materialId);
            if (!material) return '';
            return `
                <div class="selected-material-item" title="${material.name}" draggable="true" data-material-id="${material.id}">
                    ${material.svg}
                </div>
            `;
        }).join('');
        initializeSelectedMaterialsDrag();
    }
}

function initializeSelectedMaterialsDrag() {
    const preview = elements.selectedMaterialsPreview();
    if (!preview) return;

    let draggedId = '';

    preview.querySelectorAll('.selected-material-item').forEach((item) => {
        item.addEventListener('dragstart', (event) => {
            draggedId = item.dataset.materialId || '';
            item.classList.add('is-dragging');
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', draggedId);
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('is-dragging');
            preview.querySelectorAll('.selected-material-item.is-drag-over').forEach((overItem) => {
                overItem.classList.remove('is-drag-over');
            });
            draggedId = '';
        });

        item.addEventListener('dragover', (event) => {
            event.preventDefault();
            if ((item.dataset.materialId || '') !== draggedId) {
                item.classList.add('is-drag-over');
            }
        });

        item.addEventListener('dragleave', () => {
            item.classList.remove('is-drag-over');
        });

        item.addEventListener('drop', (event) => {
            event.preventDefault();
            item.classList.remove('is-drag-over');

            const sourceId = event.dataTransfer.getData('text/plain') || draggedId;
            const targetId = item.dataset.materialId || '';
            reorderSelectedMaterial(sourceId, targetId);
        });
    });
}

function reorderSelectedMaterial(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
        return;
    }

    const materials = [...(currentRecipe.materials || [])];
    const sourceIndex = materials.indexOf(sourceId);
    const targetIndex = materials.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
        return;
    }

    const [moved] = materials.splice(sourceIndex, 1);
    materials.splice(targetIndex, 0, moved);
    currentRecipe.materials = materials;
    updateSelectedMaterialsPreview();
    renderRecipePage();
}

function updatePageStyleButtons(style = elements.pageStyle()?.value || 'standard') {
    elements.pageStyleButtons().forEach((button) => {
        const isActive = button.dataset.pageStyle === style;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

function applyPageStyleSelection(style = 'standard') {
    if (elements.pageStyle()) {
        elements.pageStyle().value = style;
    }

    updatePageStyleButtons(style);

    if (style === 'printer-friendly') {
        const printerHeroHeight = getPrinterFriendlyHeroHeight({
            printerTitleTopPadding: elements.printerTitleTopPadding()?.value,
            printerTitleMacroSpacing: elements.printerTitleMacroSpacing()?.value,
            titleFontSize: elements.titleFontSize()?.value
        });
        elements.heroHeight().value = String(printerHeroHeight);
        elements.heroHeightValue().value = printerHeroHeight;
    } else {
        elements.heroHeight().value = '309';
        elements.heroHeightValue().value = 309;
    }
}

function updateMaterialsLayoutButtons(layout = elements.materialsLayout()?.value || 'column') {
    elements.materialsLayoutButtons().forEach((button) => {
        const isActive = button.dataset.materialsLayout === layout;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

function applyMaterialsLayoutSelection(layout = 'column') {
    if (elements.materialsLayout()) {
        elements.materialsLayout().value = layout;
    }

    updateMaterialsLayoutButtons(layout);
}

function normalizeInstructionSubtitleCase(value = 'preserve') {
    return value === 'preserve' ? 'preserve' : 'uppercase';
}

function updateInstructionSubtitleCaseButtons(value = elements.instructionSubtitleCase()?.value || 'preserve') {
    const subtitleCase = normalizeInstructionSubtitleCase(value);
    elements.instructionSubtitleCaseButtons().forEach((button) => {
        const isActive = button.dataset.instructionSubtitleCase === subtitleCase;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });
}

function applyInstructionSubtitleCaseSelection(value = 'preserve') {
    const subtitleCase = normalizeInstructionSubtitleCase(value);
    if (elements.instructionSubtitleCase()) {
        elements.instructionSubtitleCase().value = subtitleCase;
    }

    updateInstructionSubtitleCaseButtons(subtitleCase);
}

function toggleMasterPasteInfoPanel() {
    const panel = elements.masterPasteInfoPanel();
    const button = elements.btnMasterPasteInfo();
    if (!panel) return;

    const shouldOpen = panel.hidden;
    panel.hidden = !shouldOpen;

    if (button) {
        button.setAttribute('aria-expanded', String(shouldOpen));
    }
}

function closeMasterPasteInfoPanel() {
    const panel = elements.masterPasteInfoPanel();
    const button = elements.btnMasterPasteInfo();
    if (!panel) return;

    panel.hidden = true;

    if (button) {
        button.setAttribute('aria-expanded', 'false');
    }
}

/**
 * Initialize form input listeners for live preview
 */
function initializeFormListeners() {
    // Text inputs
    const textInputs = ['title', 'description', 'pageNumber', 'macroBarPrefix', 'calories', 'protein', 'carbs', 'fat', 'servingsLabel', 'instructionsLabel', 'note', 'dayHighlightsTitle', 'dayTipsTitle', 'dayMealsTitle', 'dayBreakdownTitle', 'dayTotalsTitle'];
    textInputs.forEach(id => {
        const element = elements[id.replace('-', '')]?.() || document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(updateRecipeFromForm, 150));
        }
    });

    elements.dayHighlights()?.addEventListener('input', debounce(updateRecipeFromForm, 150));
    elements.dayTips()?.addEventListener('input', debounce(updateRecipeFromForm, 150));
    elements.btnMasterPasteInfo()?.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMasterPasteInfoPanel();
    });
    elements.btnCloseMasterPasteInfo()?.addEventListener('click', closeMasterPasteInfoPanel);
    document.addEventListener('click', (event) => {
        const panel = elements.masterPasteInfoPanel();
        const button = elements.btnMasterPasteInfo();
        if (panel?.hidden || panel?.contains(event.target) || button?.contains(event.target)) return;
        closeMasterPasteInfoPanel();
    });
    elements.pageType().value = 'recipe';
    updatePageTypeVisibility('recipe');
    elements.pageStyleButtons().forEach((button) => {
        button.addEventListener('click', () => {
            applyPageStyleSelection(button.dataset.pageStyle || 'standard');
            updateRecipeFromForm();
        });
    });
    elements.pageStyle()?.addEventListener('change', () => {
        applyPageStyleSelection(elements.pageStyle().value || 'standard');
        updateRecipeFromForm();
    });

    // Materials layout
    elements.materialsLayoutButtons().forEach((button) => {
        button.addEventListener('click', () => {
            applyMaterialsLayoutSelection(button.dataset.materialsLayout || 'column');
            updateRecipeFromForm();
        });
    });
    elements.materialsLayout()?.addEventListener('change', () => {
        applyMaterialsLayoutSelection(elements.materialsLayout().value || 'column');
        updateRecipeFromForm();
    });
    elements.instructionSubtitleCaseButtons().forEach((button) => {
        button.addEventListener('click', () => {
            applyInstructionSubtitleCaseSelection(button.dataset.instructionSubtitleCase || 'preserve');
            updateRecipeFromForm();
        });
    });
    elements.instructionSubtitleCase()?.addEventListener('change', () => {
        applyInstructionSubtitleCaseSelection(elements.instructionSubtitleCase().value || 'preserve');
        updateRecipeFromForm();
    });
    elements.showMaterials()?.addEventListener('change', updateRecipeFromForm);
    elements.materialsAutoSpacing()?.addEventListener('change', updateRecipeFromForm);
    elements.instructionsStartMode()?.addEventListener('change', debounce(updateRecipeFromForm, 150));
    elements.showIngredientsHeader()?.addEventListener('change', updateRecipeFromForm);
    elements.showInstructionsHeader()?.addEventListener('change', updateRecipeFromForm);
    elements.showDirectionsContinuedHeader()?.addEventListener('change', updateRecipeFromForm);
    elements.showMacroBar()?.addEventListener('change', updateRecipeFromForm);
    elements.showDescription()?.addEventListener('change', updateRecipeFromForm);
    elements.pageBottomMargin()?.addEventListener('input', () => {
        const value = getPageBottomMargin({ pageBottomMargin: elements.pageBottomMargin().value });
        updatePageBottomMarginDisplay(value);
        showBottomMarginGuide();
        updateRecipeFromForm();
    });
    elements.continuationContentSpacing()?.addEventListener('input', () => {
        const value = getContinuationContentSpacing({ continuationContentSpacing: elements.continuationContentSpacing().value });
        updateContinuationContentSpacingDisplay(value);
        updateRecipeFromForm();
    });

    // Image upload
    elements.imageUploadArea()?.addEventListener('click', () => {
        elements.heroImage()?.click();
    });

    elements.btnRemoveHeroImage()?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeHeroImage();
    });

    elements.heroImage()?.addEventListener('change', handleImageUpload);
    elements.imagePreviewThumb()?.addEventListener('error', handleHeroImageLoadError);

    // Image controls
    elements.imageScale()?.addEventListener('input', () => {
        const value = elements.imageScale().value;
        elements.imageScaleValue().value = value;
        updateRecipeFromForm();
    });

    elements.heroHeight()?.addEventListener('input', () => {
        const value = elements.heroHeight().value;
        elements.heroHeightValue().value = value;
        updateRecipeFromForm();
    });

    bindImageValueInput(elements.imageScaleValue(), elements.imageScale(), 100);
    bindImageValueInput(elements.heroHeightValue(), elements.heroHeight(), 309);
    bindImageValueInput(elements.imagePosXValue(), elements.imagePosX(), 50);
    bindImageValueInput(elements.imagePosYValue(), elements.imagePosY(), 50);

    elements.titleFontSize()?.addEventListener('input', () => {
        const value = elements.titleFontSize().value;
        elements.titleFontSizeValue().textContent = `${value}px`;
        if (elements.pageStyle()?.value === 'printer-friendly') {
            const printerHeroHeight = getPrinterFriendlyHeroHeight({
                printerTitleTopPadding: elements.printerTitleTopPadding()?.value,
                printerTitleMacroSpacing: elements.printerTitleMacroSpacing()?.value,
                titleFontSize: value
            });
            elements.heroHeight().value = String(printerHeroHeight);
            elements.heroHeightValue().value = printerHeroHeight;
        }
        updateRecipeFromForm();
    });

    elements.printerTitleTopPadding()?.addEventListener('input', () => {
        const value = getPrinterTitleTopPadding({ printerTitleTopPadding: elements.printerTitleTopPadding().value });
        updatePrinterTitleTopPaddingDisplay(value);
        if (elements.pageStyle()?.value === 'printer-friendly') {
            const printerHeroHeight = getPrinterFriendlyHeroHeight({
                printerTitleTopPadding: value,
                printerTitleMacroSpacing: elements.printerTitleMacroSpacing()?.value,
                titleFontSize: elements.titleFontSize()?.value
            });
            elements.heroHeight().value = String(printerHeroHeight);
            elements.heroHeightValue().value = printerHeroHeight;
        }
        updateRecipeFromForm();
    });

    elements.printerTitleMacroSpacing()?.addEventListener('input', () => {
        const value = getPrinterTitleMacroSpacing({ printerTitleMacroSpacing: elements.printerTitleMacroSpacing().value });
        updatePrinterTitleMacroSpacingDisplay(value);
        if (elements.pageStyle()?.value === 'printer-friendly') {
            const printerHeroHeight = getPrinterFriendlyHeroHeight({
                printerTitleTopPadding: elements.printerTitleTopPadding()?.value,
                printerTitleMacroSpacing: value,
                titleFontSize: elements.titleFontSize()?.value
            });
            elements.heroHeight().value = String(printerHeroHeight);
            elements.heroHeightValue().value = printerHeroHeight;
        }
        updateRecipeFromForm();
    });

    elements.imagePosX()?.addEventListener('input', () => {
        elements.imagePosXValue().value = elements.imagePosX().value;
        updateRecipeFromForm();
    });

    elements.imagePosY()?.addEventListener('input', () => {
        elements.imagePosYValue().value = elements.imagePosY().value;
        updateRecipeFromForm();
    });

    elements.btnResetImageControls()?.addEventListener('click', resetImageControlsToDefaults);

    elements.showCornerLogo()?.addEventListener('change', updateRecipeFromForm);

    // Add ingredient section button
    elements.addIngredientSection()?.addEventListener('click', () => {
        addIngredientSectionEditor();
        updateRecipeFromForm();
    });

    // Add portion variation section button
    elements.addPortionVariationSection()?.addEventListener('click', () => {
        addPortionVariationSectionEditor();
        updateRecipeFromForm();
    });

    elements.addInstructionSection()?.addEventListener('click', () => {
        addInstructionSectionEditor();
        updateRecipeFromForm();
    });

    elements.addNote()?.addEventListener('click', () => {
        addNoteRow();
        updateRecipeFromForm();
    });

    elements.addDayMeal()?.addEventListener('click', () => {
        addDayMealEditor();
        updateRecipeFromForm();
    });
    elements.btnDayMealsPaste()?.addEventListener('click', handlePasteDayMeals);
}

/**
 * Initialize action button listeners
 */
function initializeButtonListeners() {
    // Master Paste buttons
    initializeMasterPasteAiControls();
    elements.btnFillAll()?.addEventListener('click', handleFillAll);
    elements.btnGenerateMasterPasteAi()?.addEventListener('click', handleGenerateMasterPasteAi);
    elements.btnCopyAIInstructions()?.addEventListener('click', handleCopyAIInstructions);
    elements.btnCopyAIInfoInstructions()?.addEventListener('click', handleCopyAIInfoInstructions);
    elements.btnCopyAIDayInstructions()?.addEventListener('click', handleCopyAIDayInstructions);
    elements.btnCopyDayMealsPrompt()?.addEventListener('click', handleCopyDayMealsPrompt);

    // Export JPG button
    elements.btnExportJpg()?.addEventListener('click', handleExportJpg);
    elements.btnExportJpgPreview()?.addEventListener('click', handleExportJpg);
    elements.btnExportAll()?.addEventListener('click', handleExportAll);

    // Editable PDF button
    elements.btnExportEditablePdf()?.addEventListener('click', handleExportEditablePdf);

    // Print button
    elements.btnPrint()?.addEventListener('click', handlePrint);

    // Save JSON button
    elements.btnSaveJson()?.addEventListener('click', handleSaveJson);
    elements.btnSaveJsonPreview()?.addEventListener('click', handleSaveJson);

    // Load JSON button
    const openLoadRecipe = () => {
        openLoadRecipeOverlay();
    };

    elements.btnLoadJson()?.addEventListener('click', openLoadRecipe);
    elements.btnLoadJsonPreview()?.addEventListener('click', openLoadRecipe);

    elements.jsonFileInput()?.addEventListener('change', handleLoadJson);
    elements.btnCloseLoadRecipe()?.addEventListener('click', closeLoadRecipeOverlay);
    elements.btnLoadFromComputer()?.addEventListener('click', () => {
        closeLoadRecipeOverlay();
        elements.jsonFileInput()?.click();
    });
    elements.recentRecipesList()?.addEventListener('click', handleRecentRecipeClick);
    elements.loadRecipeOverlay()?.addEventListener('click', (event) => {
        if (event.target === elements.loadRecipeOverlay()) {
            closeLoadRecipeOverlay();
        }
    });

    // Clear button
    elements.btnClear()?.addEventListener('click', handleClear);

    // Zoom controls
    elements.btnZoomIn()?.addEventListener('click', () => {
        zoomLevel = Math.min(150, zoomLevel + 10);
        updateZoom();
    });

    elements.btnZoomOut()?.addEventListener('click', () => {
        zoomLevel = Math.max(50, zoomLevel - 10);
        updateZoom();
    });

    elements.zoomSlider()?.addEventListener('input', () => {
        zoomLevel = Number.parseInt(elements.zoomSlider().value, 10) || 100;
        updateZoom();
    });

    elements.btnCenterPreview()?.addEventListener('click', centerPreview);
}

// ================================================
// FORM MANAGEMENT
// ================================================

/**
 * Load recipe data into the form
 */
function loadRecipeToForm(recipe) {
    recipe = normalizeRecipe(recipe);
    elements.pageType().value = 'recipe';
    if (elements.pageStyle()) {
        elements.pageStyle().value = recipe.pageStyle || 'standard';
    }
    updatePageStyleButtons(recipe.pageStyle || 'standard');
    elements.title().value = recipe.title || '';
    const titleFontSize = Number.parseInt(recipe.titleFontSize, 10) || 40;
    elements.titleFontSize().value = titleFontSize;
    elements.titleFontSizeValue().textContent = `${titleFontSize}px`;
    const printerTitleTopPadding = getPrinterTitleTopPadding(recipe);
    if (elements.printerTitleTopPadding()) {
        elements.printerTitleTopPadding().value = printerTitleTopPadding;
    }
    updatePrinterTitleTopPaddingDisplay(printerTitleTopPadding);
    const printerTitleMacroSpacing = getPrinterTitleMacroSpacing(recipe);
    if (elements.printerTitleMacroSpacing()) {
        elements.printerTitleMacroSpacing().value = printerTitleMacroSpacing;
    }
    updatePrinterTitleMacroSpacingDisplay(printerTitleMacroSpacing);
    elements.showDescription().checked = recipe.showDescription !== false;
    elements.description().value = recipe.description || '';
    elements.pageNumber().value = recipe.pageNumber || '';
    elements.showCornerLogo().checked = recipe.showCornerLogo === true;
    elements.showMacroBar().checked = recipe.showMacroBar !== false;
    elements.macroBarPrefix().value = recipe.macroBarPrefix || '';
    elements.calories().value = recipe.macros?.calories || '';
    elements.protein().value = recipe.macros?.protein || '';
    elements.carbs().value = recipe.macros?.carbs || '';
    elements.fat().value = recipe.macros?.fat || '';
    elements.servingsLabel().value = recipe.servingsLabel || 'Ingredients for 1 Serving';
    if (elements.showIngredientsHeader()) {
        elements.showIngredientsHeader().checked = recipe.showIngredientsHeader !== false;
    }
    elements.instructionsLabel().value = recipe.instructionsLabel || 'Instructions for 1 Serving';
    if (elements.showInstructionsHeader()) {
        elements.showInstructionsHeader().checked = recipe.showInstructionsHeader !== false;
    }
    if (elements.instructionsStartMode()) {
        elements.instructionsStartMode().value = recipe.instructionsStartMode || 'force-right-column';
    }
    if (elements.showDirectionsContinuedHeader()) {
        elements.showDirectionsContinuedHeader().checked = recipe.showDirectionsContinuedHeader === true;
    }
    applyInstructionSubtitleCaseSelection(recipe.instructionSubtitleCase || 'preserve');
    const pageBottomMargin = getPageBottomMargin(recipe);
    if (elements.pageBottomMargin()) {
        elements.pageBottomMargin().value = pageBottomMargin;
    }
    updatePageBottomMarginDisplay(pageBottomMargin);
    const continuationContentSpacing = getContinuationContentSpacing(recipe);
    if (elements.continuationContentSpacing()) {
        elements.continuationContentSpacing().value = continuationContentSpacing;
    }
    updateContinuationContentSpacingDisplay(continuationContentSpacing);
    applyMaterialsLayoutSelection(recipe.materialsLayout || 'column');
    if (elements.showMaterials()) {
        elements.showMaterials().checked = recipe.showMaterials !== false;
    }
    if (elements.materialsAutoSpacing()) {
        elements.materialsAutoSpacing().checked = recipe.materialsAutoSpacing === true;
    }
    elements.dayHighlightsTitle().value = recipe.dayHighlightsTitle || 'Nutrition Highlights';
    elements.dayTipsTitle().value = recipe.dayTipsTitle || 'Tips for Success';
    elements.dayMealsTitle().value = recipe.dayMealsTitle || 'Meals';
    elements.dayBreakdownTitle().value = recipe.dayBreakdownTitle || 'Macronutrient Breakdown';
    elements.dayTotalsTitle().value = recipe.dayTotalsTitle || 'Daily Totals';
    elements.dayHighlights().value = (recipe.dayHighlights || []).join('\n');
    elements.dayTips().value = (recipe.dayTips || []).join('\n');
    const heroHeightValue = isPrinterFriendly(recipe) ? getPrinterFriendlyHeroHeight(recipe) : (recipe.heroHeight || 309);
    elements.heroHeight().value = heroHeightValue;
    elements.heroHeightValue().value = heroHeightValue;
    updatePageTypeVisibility('recipe');

    // Load image if present
    if (recipe.image) {
        elements.imagePreviewThumb().src = recipe.image;
        elements.imageUploadArea().classList.add('has-image');
        setImageControlsDisabled(false);
        // Load image settings
        const imgSettings = recipe.imageSettings || { scale: 100, posX: 50, posY: 50 };
        elements.imageScale().value = imgSettings.scale;
        elements.imageScaleValue().value = imgSettings.scale;
        elements.imagePosX().value = imgSettings.posX;
        elements.imagePosXValue().value = imgSettings.posX;
        elements.imagePosY().value = imgSettings.posY;
        elements.imagePosYValue().value = imgSettings.posY;
    } else {
        elements.imagePreviewThumb()?.removeAttribute('src');
        elements.heroImage().value = '';
        elements.imageUploadArea().classList.remove('has-image');
        setImageControlsDisabled(true);
    }

    // Load materials and update preview
    currentRecipe = recipe;
    currentRecipe.materials = recipe.materials || [];
    updateSelectedMaterialsPreview();

    // Load portion variations
    const portionVariationSections = elements.portionVariationSections();
    if (portionVariationSections) {
        portionVariationSections.innerHTML = '';
        getPortionVariationSectionsForForm(recipe).forEach((section, index) => {
            addPortionVariationSectionEditor(
                section.label,
                section.icon || '',
                section.variations || [],
                index === 0,
                section.linkIconPosition || 'right'
            );
        });
    }

    // Load ingredients
    const ingredientsList = elements.ingredientsList();
    ingredientsList.innerHTML = '';
    getIngredientSectionsForForm(recipe).forEach((section, index) => {
        addIngredientSectionEditor(
            section.label,
            section.ingredients,
            index === 0,
            section.startMode || 'auto'
        );
    });

    // Load instructions
    const instructionsList = elements.instructionsList();
    instructionsList.innerHTML = '';
    getInstructionSectionsForForm(recipe).forEach((section, index) => {
        addInstructionSectionEditor(
            section.label,
            section.steps,
            index === 0,
            section.startMode || 'force-right-column',
            section.stepStyle || 'numbered'
        );
    });

    // Load notes
    const notesList = elements.notesList();
    if (notesList) {
        notesList.innerHTML = '';
        (recipe.notes || []).forEach((noteText) => {
            addNoteRow(noteText);
        });
    }

    const dayMealsList = elements.dayMealsList();
    if (dayMealsList) {
        dayMealsList.innerHTML = '';
        (recipe.dayMeals || []).forEach((meal) => addDayMealEditor(meal));
    }
}

/**
 * Update recipe state from form values
 */
function updateRecipeFromForm() {
    const ingredientSections = getIngredientSectionsFromForm();
    const instructionSections = getInstructionSectionsFromForm();
    const portionVariationSections = getPortionVariationSectionsFromForm();
    const primaryPortionVariationSection = portionVariationSections[0] || { label: 'Portion Variations', icon: '', variations: [] };
    const primaryIngredientSection = ingredientSections[0] || { label: '', ingredients: [] };

    currentRecipe = {
        pageType: 'recipe',
        pageStyle: elements.pageStyle()?.value || 'standard',
        title: elements.title()?.value || '',
        titleFontSize: parseInt(elements.titleFontSize()?.value, 10) || 40,
        printerTitleTopPadding: getPrinterTitleTopPadding({ printerTitleTopPadding: elements.printerTitleTopPadding()?.value }),
        printerTitleMacroSpacing: getPrinterTitleMacroSpacing({ printerTitleMacroSpacing: elements.printerTitleMacroSpacing()?.value }),
        image: getHeroImageValue(),
        heroHeight: elements.pageStyle()?.value === 'printer-friendly'
            ? getPrinterFriendlyHeroHeight({
                printerTitleTopPadding: elements.printerTitleTopPadding()?.value,
                printerTitleMacroSpacing: elements.printerTitleMacroSpacing()?.value,
                titleFontSize: elements.titleFontSize()?.value
            })
            : getNumericControlValue(elements.heroHeight(), 309),
        imageSettings: {
            scale: getNumericControlValue(elements.imageScale(), 100),
            posX: getNumericControlValue(elements.imagePosX(), 50),
            posY: getNumericControlValue(elements.imagePosY(), 50)
        },
        showCornerLogo: elements.showCornerLogo()?.checked === true,
        showMacroBar: elements.showMacroBar()?.checked !== false,
        macroBarPrefix: elements.macroBarPrefix()?.value || '',
        showDescription: elements.showDescription()?.checked !== false,
        macros: {
            calories: elements.calories()?.value || '',
            protein: elements.protein()?.value || '',
            carbs: elements.carbs()?.value || '',
            fat: elements.fat()?.value || ''
        },
        description: elements.description()?.value || '',
        dayMealsTitle: elements.dayMealsTitle()?.value || 'Meals',
        dayBreakdownTitle: elements.dayBreakdownTitle()?.value || 'Macronutrient Breakdown',
        dayHighlightsTitle: elements.dayHighlightsTitle()?.value || 'Nutrition Highlights',
        dayTipsTitle: elements.dayTipsTitle()?.value || 'Tips for Success',
        dayTotalsTitle: elements.dayTotalsTitle()?.value || 'Daily Totals',
        dayMeals: getDayMealsFromForm(),
        dayHighlights: parseLineList(elements.dayHighlights()?.value || ''),
        dayTips: parseLineList(elements.dayTips()?.value || ''),
        portionVariations: primaryPortionVariationSection.variations || [],
        portionVariationsLabel: primaryPortionVariationSection.label || 'Portion Variations',
        portionVariationIcon: primaryPortionVariationSection.icon || '',
        portionVariationSections,
        servingsLabel: elements.servingsLabel()?.value || 'Ingredients for 1 Serving',
        showIngredientsHeader: elements.showIngredientsHeader()?.checked !== false,
        instructionsLabel: elements.instructionsLabel()?.value || 'Instructions for 1 Serving',
        showInstructionsHeader: elements.showInstructionsHeader()?.checked !== false,
        instructionSubtitleCase: normalizeInstructionSubtitleCase(elements.instructionSubtitleCase()?.value),
        instructionsStartMode: instructionSections[0]?.startMode || elements.instructionsStartMode()?.value || 'force-right-column',
        showDirectionsContinuedHeader: elements.showDirectionsContinuedHeader()?.checked === true,
        materialsLayout: elements.materialsLayout()?.value || 'column',
        showMaterials: elements.showMaterials()?.checked !== false,
        materialsAutoSpacing: elements.materialsAutoSpacing()?.checked === true,
        materials: getSelectedMaterials(),
        ingredients: primaryIngredientSection.ingredients || [],
        ingredientSections,
        instructionSections,
        instructions: instructionSections[0]?.steps || getInstructionsFromForm(),
        notes: getNotesFromForm(),
        pageBottomMargin: getPageBottomMargin({ pageBottomMargin: elements.pageBottomMargin()?.value }),
        continuationContentSpacing: getContinuationContentSpacing({ continuationContentSpacing: elements.continuationContentSpacing()?.value }),
        pageNumber: elements.pageNumber()?.value || ''
    };

    // Don't include placeholder image in recipe data
    if (currentRecipe.image && currentRecipe.image.includes('data:image')) {
        // Keep the data URL
    } else {
        currentRecipe.image = '';
    }

    renderRecipePage();
}

/**
 * Get selected materials from current recipe state
 */
function getSelectedMaterials() {
    return currentRecipe.materials || [];
}

function parseLineList(text) {
    return String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

function parseNumericValue(value) {
    const normalized = String(value || '').replace(/,/g, '').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getPageBottomMargin(recipe = currentRecipe) {
    const parsed = Number.parseInt(recipe?.pageBottomMargin, 10);
    if (!Number.isFinite(parsed)) {
        return 0;
    }
    return Math.max(0, Math.min(200, parsed));
}

function getPrinterTitleTopPadding(recipe = currentRecipe) {
    const parsed = Number.parseInt(recipe?.printerTitleTopPadding, 10);
    if (!Number.isFinite(parsed)) {
        return 70;
    }
    return Math.max(0, Math.min(120, parsed));
}

function updatePrinterTitleTopPaddingDisplay(value = getPrinterTitleTopPadding()) {
    if (elements.printerTitleTopPaddingValue()) {
        elements.printerTitleTopPaddingValue().textContent = `${value}px`;
    }
}

function getPrinterTitleMacroSpacing(recipe = currentRecipe) {
    const parsed = Number.parseInt(recipe?.printerTitleMacroSpacing, 10);
    if (!Number.isFinite(parsed)) {
        return 16;
    }
    return Math.max(0, Math.min(200, parsed));
}

function updatePrinterTitleMacroSpacingDisplay(value = getPrinterTitleMacroSpacing()) {
    if (elements.printerTitleMacroSpacingValue()) {
        elements.printerTitleMacroSpacingValue().textContent = `${value}px`;
    }
}

function getPrinterFriendlyHeroHeight(recipe = currentRecipe) {
    const titleFontSize = Number.parseInt(recipe?.titleFontSize, 10) || 40;
    return getPrinterTitleTopPadding(recipe) + Math.ceil(titleFontSize * 1.1) + getPrinterTitleMacroSpacing(recipe);
}

function updatePageBottomMarginDisplay(value = getPageBottomMargin()) {
    if (elements.pageBottomMarginValue()) {
        elements.pageBottomMarginValue().textContent = `${value}px`;
    }
}

function getContinuationContentSpacing(recipe = currentRecipe) {
    const parsed = Number.parseInt(recipe?.continuationContentSpacing, 10);
    if (!Number.isFinite(parsed)) {
        return 50;
    }
    return Math.max(0, Math.min(200, parsed));
}

function updateContinuationContentSpacingDisplay(value = getContinuationContentSpacing()) {
    if (elements.continuationContentSpacingValue()) {
        elements.continuationContentSpacingValue().textContent = `${value}px`;
    }
}

function showBottomMarginGuide() {
    isBottomMarginGuideVisible = true;
    elements.recipePage()?.classList.add('show-bottom-margin-guide');

    window.clearTimeout(bottomMarginGuideTimer);
    bottomMarginGuideTimer = window.setTimeout(() => {
        isBottomMarginGuideVisible = false;
        elements.recipePage()?.classList.remove('show-bottom-margin-guide');
    }, 1400);
}

function updatePageTypeVisibility(pageType = 'recipe') {
    applyEditorSectionState();
}

function getDayMealsFromForm() {
    return Array.from(elements.dayMealsList()?.querySelectorAll('.day-meal-editor') || [])
        .map((meal) => ({
            image: meal.querySelector('.day-meal-image-preview')?.dataset.image || '',
            mealLabel: meal.querySelector('.day-meal-label')?.value || '',
            name: meal.querySelector('.day-meal-name')?.value || '',
            portionNote: meal.querySelector('.day-meal-portion')?.value || '',
            calories: meal.querySelector('.day-meal-calories')?.value || '',
            protein: meal.querySelector('.day-meal-protein')?.value || '',
            carbs: meal.querySelector('.day-meal-carbs')?.value || '',
            fat: meal.querySelector('.day-meal-fat')?.value || ''
        }))
        .filter((meal) =>
            meal.image || meal.mealLabel || meal.name || meal.portionNote || meal.calories || meal.protein || meal.carbs || meal.fat
        );
}

function addDayMealEditor(meal = {}) {
    const container = elements.dayMealsList();
    if (!container) return;

    const mealEl = document.createElement('div');
    mealEl.className = 'day-meal-editor';
    mealEl.innerHTML = `
        <div class="day-meal-editor-header">
            <strong>Meal Card</strong>
            <button type="button" class="btn-remove" title="Remove Meal">×</button>
        </div>
        <div class="day-meal-editor-grid">
            <div class="day-meal-editor-image">
                <input type="file" class="day-meal-image-input" accept="image/*" hidden>
                <button type="button" class="btn-secondary btn-day-meal-image">Upload Thumbnail</button>
                <div class="day-meal-image-preview" data-image="${escapeHtml(meal.image || '')}">
                    ${meal.image ? `<img src="${escapeHtml(meal.image)}" alt="Meal thumbnail">` : '<span>No image</span>'}
                </div>
            </div>
            <div class="day-meal-editor-fields">
                <input type="text" class="day-meal-label" placeholder="Meal label (e.g., Breakfast)" value="${escapeHtml(meal.mealLabel || '')}">
                <input type="text" class="day-meal-name" placeholder="Meal name" value="${escapeHtml(meal.name || '')}">
                <input type="text" class="day-meal-portion" placeholder="Serving size or portion note" value="${escapeHtml(meal.portionNote || '')}">
                <div class="day-meal-macro-inputs">
                    <input type="text" class="day-meal-calories" placeholder="cal" value="${escapeHtml(meal.calories || '')}">
                    <input type="text" class="day-meal-protein" placeholder="protein" value="${escapeHtml(meal.protein || '')}">
                    <input type="text" class="day-meal-carbs" placeholder="carbs" value="${escapeHtml(meal.carbs || '')}">
                    <input type="text" class="day-meal-fat" placeholder="fat" value="${escapeHtml(meal.fat || '')}">
                </div>
            </div>
        </div>
    `;

    mealEl.querySelectorAll('input[type="text"]').forEach((input) => {
        input.addEventListener('input', debounce(updateRecipeFromForm, 150));
    });

    const imageInput = mealEl.querySelector('.day-meal-image-input');
    const imageButton = mealEl.querySelector('.btn-day-meal-image');
    const imagePreview = mealEl.querySelector('.day-meal-image-preview');

    imageButton?.addEventListener('click', () => imageInput?.click());
    imageInput?.addEventListener('change', (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const image = e.target?.result || '';
            imagePreview.dataset.image = image;
            imagePreview.innerHTML = `<img src="${image}" alt="Meal thumbnail">`;
            updateRecipeFromForm();
        };
        reader.readAsDataURL(file);
    });

    mealEl.querySelector('.btn-remove')?.addEventListener('click', () => {
        mealEl.remove();
        updateRecipeFromForm();
    });

    container.appendChild(mealEl);
}

/**
 * Get ingredients array from form
 */
function getIngredientsFromForm() {
    return getIngredientSectionsFromForm()[0]?.ingredients || [];
}

function getIngredientSectionsForForm(recipe) {
    const normalizedSections = (recipe.ingredientSections || [])
        .map((section) => ({
            label: section.label || '',
            startMode: section.startMode === 'force-right-column' ? 'force-right-column' : 'auto',
            ingredients: Array.isArray(section.ingredients) ? section.ingredients : []
        }))
        .filter((section) => section.label || section.ingredients.length > 0);

    if (normalizedSections.length > 0) {
        return normalizedSections;
    }

    return [{
        label: '',
        startMode: 'auto',
        ingredients: recipe.ingredients || []
    }];
}

function getIngredientSectionsFromForm() {
    const sections = Array.from(elements.ingredientsList()?.querySelectorAll('.ingredient-section-editor') || [])
        .map((section, index) => {
            const labelInput = section.querySelector('.ingredient-section-label');
            const label = (labelInput?.value || '').trim();
            const startMode = section.querySelector('.ingredient-section-start-mode')?.value || 'auto';
            const ingredients = Array.from(section.querySelectorAll('.ingredient-row'))
                .map((row) => {
                    const type = row.dataset.ingredientRowType || 'ingredient';
                    if (type === 'header' || type === 'subtitle') {
                        return {
                            type,
                            text: row.querySelector('.ingredient-label-text')?.value || ''
                        };
                    }

                    return {
                        name: row.querySelector('.ingredient-name')?.value || '',
                        amount: row.querySelector('.ingredient-amount')?.value || ''
                    };
                })
                .filter((ingredient) => ingredient.text || ingredient.name || ingredient.amount);

            return { label, startMode, ingredients };
        })
        .filter((section) => section.label || section.ingredients.length > 0);

    if (sections.length === 0) {
        return [{
            label: '',
            startMode: 'auto',
            ingredients: []
        }];
    }

    return sections;
}

function getPortionVariationsFromForm() {
    return getPortionVariationSectionsFromForm()[0]?.variations || [];
}

function getPortionVariationSectionsForForm(recipe) {
    const normalizedSections = (recipe.portionVariationSections || [])
        .map((section) => ({
            label: section.label || 'Portion Variations',
            icon: section.icon ?? '',
            linkIconPosition: section.linkIconPosition === 'left' ? 'left' : 'right',
            variations: Array.isArray(section.variations) ? section.variations.map(normalizePortionVariation) : []
        }))
        .filter((section) => section.label || section.icon || section.variations.length > 0);

    if (normalizedSections.length > 0) {
        return normalizedSections;
    }

    return [{
        label: recipe.portionVariationsLabel || 'Portion Variations',
        icon: recipe.portionVariationIcon || '',
        linkIconPosition: 'right',
        variations: Array.isArray(recipe.portionVariations) ? recipe.portionVariations.map(normalizePortionVariation) : []
    }];
}

function getPortionVariationSectionsFromForm() {
    const sections = Array.from(elements.portionVariationSections()?.querySelectorAll('.portion-variation-section-editor') || [])
        .map((section, index) => {
            const labelInput = section.querySelector('.portion-variation-section-label');
            const label = ((labelInput?.value || '').trim() || `Portion Variations ${index + 1}`);
            const icon = section.querySelector('.portion-variation-section-icon')?.value ?? '';
            const linkIconPosition = section.querySelector('.portion-variation-link-icon-position')?.checked ? 'left' : 'right';
            const variations = Array.from(section.querySelectorAll('.portion-variation-row'))
                .map((row) => ({
                    label: row.querySelector('.portion-variation-label')?.value || '',
                    calories: row.querySelector('.portion-variation-calories')?.value || '',
                    protein: row.querySelector('.portion-variation-protein')?.value || '',
                    carbs: row.querySelector('.portion-variation-carbs')?.value || '',
                    fat: row.querySelector('.portion-variation-fat')?.value || '',
                    fiber: row.querySelector('.portion-variation-fiber')?.value || '',
                    url: row.querySelector('.portion-variation-url')?.value || '',
                    showMacros: row.querySelector('.portion-variation-show-macros')?.checked !== false
                }))
                .filter((variation) =>
                    variation.label || variation.calories || variation.protein || variation.carbs || variation.fat || variation.fiber || variation.url
                );

            return { label, icon, linkIconPosition, variations };
        })
        .filter((section) => section.label || section.icon || section.variations.length > 0);

    if (sections.length === 0) {
        return [{
            label: 'Portion Variations',
            icon: '',
            linkIconPosition: 'right',
            variations: []
        }];
    }

    return sections;
}

/**
 * Get instructions array from form
 */
function getInstructionsFromForm() {
    return getInstructionSectionsFromForm().flatMap(section => section.steps);
}

function getNotesFromForm() {
    return Array.from(elements.notesList()?.querySelectorAll('.note-text-input') || [])
        .map(textarea => textarea.value)
        .filter(text => text.trim());
}

function getInstructionSectionsForForm(recipe) {
    const normalizedSections = (recipe.instructionSections || [])
        .map(section => ({
            label: section.label || '',
            startMode: normalizeInstructionStartMode(section.startMode),
            stepStyle: section.stepStyle || 'numbered',
            steps: Array.isArray(section.steps) ? section.steps : []
        }))
        .filter(section => section.label || section.steps.length > 0);

    if (normalizedSections.length > 0) {
        return normalizedSections;
    }

    return [{
        label: '',
        startMode: normalizeInstructionStartMode(recipe.instructionsStartMode),
        stepStyle: 'numbered',
        steps: recipe.instructions || []
    }];
}

function normalizeInstructionStartMode(startMode, fallback = 'force-right-column') {
    if (startMode === 'keep-with-first-step') {
        return 'auto';
    }

    return ['auto', 'force-right-column', 'force-next-page'].includes(startMode)
        ? startMode
        : fallback;
}

function getInstructionSectionsFromForm() {
    const sections = Array.from(elements.instructionsList()?.querySelectorAll('.instruction-section-editor') || [])
        .map((section, index) => {
            const labelInput = section.querySelector('.instruction-section-label');
            const label = (labelInput?.value || '').trim();
            const startMode = normalizeInstructionStartMode(section.querySelector('.instruction-section-start-mode')?.value);
            const stepStyle = section.querySelector('.instruction-section-step-style')?.value || 'numbered';
            const steps = Array.from(section.querySelectorAll('.instruction-row'))
                .map(row => {
                    const text = row.querySelector('textarea')?.value || '';
                    const checkboxItems = Array.from(row.querySelectorAll('.instruction-checkbox-item input'))
                        .map(input => input.value || '')
                        .filter(Boolean);

                    const headerText = parseInstructionHeaderText(text);
                    const subtitleText = parseInstructionSubtitleText(text);
                    if (headerText || subtitleText) {
                        return { type: headerText ? 'header' : 'subtitle', text: headerText || subtitleText };
                    }

                    return checkboxItems.length > 0 ? { text, checkboxItems } : text;
                })
                .filter(step => typeof step === 'string' ? step : step.text);

            return { label, startMode, stepStyle, steps };
        })
        .filter(section => section.label || section.steps.length > 0);

    if (sections.length === 0) {
        return [{
            label: '',
            startMode: 'force-right-column',
            stepStyle: 'numbered',
            steps: []
        }];
    }

    return sections;
}

function parseDayMealPasteBlock(text) {
    return stripFencedCodeBlockLines(text)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split(';').map((part) => part.trim());
            return {
                mealLabel: parts[0] || '',
                name: parts[1] || '',
                portionNote: parts[2] || '',
                calories: parts[3] || '',
                protein: parts[4] || '',
                carbs: parts[5] || '',
                fat: parts[6] || ''
            };
        })
        .filter((meal) =>
            meal.mealLabel || meal.name || meal.portionNote || meal.calories || meal.protein || meal.carbs || meal.fat
        );
}

function handlePasteDayMeals() {
    const textarea = elements.dayMealsPaste();
    const container = elements.dayMealsList();
    if (!textarea || !container) {
        return;
    }

    const meals = parseDayMealPasteBlock(textarea.value);
    if (meals.length === 0) {
        return;
    }

    container.innerHTML = '';
    meals.forEach((meal) => addDayMealEditor(meal));
    updateRecipeFromForm();
}

function parseIngredientPasteBlock(text) {
    return stripFencedCodeBlockLines(text)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const headerText = parseInstructionHeaderText(line);
            const subtitleText = parseInstructionSubtitleText(line);
            if (headerText || subtitleText) {
                return { type: headerText ? 'header' : 'subtitle', text: headerText || subtitleText };
            }

            const parts = line.split(';');
            const name = (parts.shift() || '').trim();
            const amount = parts.join(';').trim();
            return { name, amount };
        })
        .filter((ingredient) => ingredient.text || ingredient.name || ingredient.amount);
}

function parsePortionVariationPasteBlock(text) {
    return stripFencedCodeBlockLines(text)
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split(';').map(p => p.trim());
            return {
                label: parts[0] || '',
                calories: parts[1] || '',
                protein: parts[2] || '',
                carbs: parts[3] || '',
                fat: parts[4] || '',
                fiber: parts[5] || '',
                url: parts[6] || '',
                showMacros: parseBooleanFlag(parts[7], true)
            };
        })
        .filter((variation) => variation.label);
}

function stripFencedCodeBlockLines(text) {
    return String(text || '')
        .split('\n')
        .filter((line) => !line.trim().startsWith('```'))
        .join('\n');
}

function parseInstructionHeaderText(value) {
    const match = String(value || '').trim().match(/^:HEADER:\s*(.+)$/i);
    return match ? match[1].trim() : '';
}

function parseInstructionSubtitleText(value) {
    const match = String(value || '').trim().match(/^:SUBTITLE:\s*(.+)$/i);
    return match ? match[1].trim() : '';
}

function getInstructionLabelType(step) {
    if (typeof step === 'string') {
        if (parseInstructionHeaderText(step)) return 'header';
        if (parseInstructionSubtitleText(step)) return 'subtitle';
        return '';
    }

    return ['header', 'subtitle'].includes(step?.type) && step.text ? step.type : '';
}

function formatInstructionHeaderText(value) {
    const text = parseInstructionHeaderText(value) || parseInstructionSubtitleText(value) || String(value || '').trim();
    return text ? `:HEADER: ${text}` : ':HEADER: ';
}

function formatInstructionSubtitleText(value) {
    const text = parseInstructionHeaderText(value) || parseInstructionSubtitleText(value) || String(value || '').trim();
    return text ? `:SUBTITLE: ${text}` : ':SUBTITLE: ';
}

function isInstructionHeaderStep(step) {
    return Boolean(getInstructionLabelType(step));
}

function getInstructionStepText(step) {
    if (typeof step === 'string') {
        return parseInstructionHeaderText(step) || parseInstructionSubtitleText(step) || step;
    }

    return step?.text || '';
}

function refreshSectionMoveButtons(container, sectionSelector) {
    const sections = Array.from(container?.querySelectorAll(sectionSelector) || []);
    sections.forEach((section, index) => {
        const moveUpButton = section.querySelector('[data-move-section="up"]');
        const moveDownButton = section.querySelector('[data-move-section="down"]');
        if (moveUpButton) {
            moveUpButton.disabled = index === 0;
        }
        if (moveDownButton) {
            moveDownButton.disabled = index === sections.length - 1;
        }
    });
}

function moveSectionEditor(section, direction, sectionSelector, afterMove = updateRecipeFromForm) {
    if (!section || !section.parentElement) {
        return;
    }

    if (direction === 'up') {
        const previous = section.previousElementSibling?.matches(sectionSelector)
            ? section.previousElementSibling
            : null;
        if (previous) {
            section.parentElement.insertBefore(section, previous);
        }
    } else if (direction === 'down') {
        const next = section.nextElementSibling?.matches(sectionSelector)
            ? section.nextElementSibling
            : null;
        if (next) {
            section.parentElement.insertBefore(next, section);
        }
    }

    refreshSectionMoveButtons(section.parentElement, sectionSelector);
    afterMove();
}

/**
 * Add a new ingredient row to the form
 */
function addIngredientSectionEditor(label = '', ingredients = [], isPrimary = false, startMode = 'auto') {
    const container = elements.ingredientsList();
    if (!container) return;

    const section = document.createElement('div');
    section.className = 'ingredient-section-editor';
    section.innerHTML = `
        <div class="section-reorder-controls" aria-label="Move ingredient set">
            <button type="button" class="segmented-control-button" data-move-section="up">Move Up</button>
            <button type="button" class="segmented-control-button" data-move-section="down">Move Down</button>
        </div>
        <div class="ingredient-section-editor-header">
            <input type="text" class="ingredient-section-label" placeholder="Ingredient set header (optional)" value="${escapeHtml(label || '')}">
            ${isPrimary ? '' : '<button type="button" class="btn-remove" title="Remove Section">×</button>'}
        </div>
        <div class="ingredient-section-editor-meta">
            <div class="ingredient-section-control">
                <label>Ingredients Start</label>
                <input type="hidden" class="ingredient-section-start-mode" value="${startMode === 'force-right-column' ? 'force-right-column' : 'auto'}">
                <div class="segmented-control" role="group" aria-label="Ingredients start">
                    <button type="button" class="segmented-control-button ${startMode !== 'force-right-column' ? 'is-active' : ''}" data-ingredient-start-mode="auto" aria-pressed="${startMode !== 'force-right-column'}">Left Column</button>
                    <button type="button" class="segmented-control-button ${startMode === 'force-right-column' ? 'is-active' : ''}" data-ingredient-start-mode="force-right-column" aria-pressed="${startMode === 'force-right-column'}">Right Column</button>
                </div>
            </div>
        </div>
        <div class="ingredient-section-paste" hidden>
            <textarea class="ingredient-section-paste-input" rows="4" placeholder="Paste ingredients here, one per line:&#10;Chia seeds;½ cup (80 g)&#10;Vanilla extract;1 tsp (4 g)"></textarea>
            <button type="button" class="btn-secondary btn-ingredient-paste">Paste Into This Set</button>
        </div>
        <div class="ingredient-section-rows"></div>
        <div class="ingredient-section-actions">
            <button type="button" class="btn-add btn-add-ingredient-inline">+ Add Ingredient</button>
            <button type="button" class="btn-add btn-add-ingredient-header-inline">+ Add Header</button>
            <button type="button" class="btn-add btn-add-ingredient-subtitle-inline">+ Add Subtitle</button>
        </div>
    `;

    const labelInput = section.querySelector('.ingredient-section-label');
    if (isPrimary) {
        labelInput.value = label || '';
    }
    labelInput.addEventListener('input', debounce(updateRecipeFromForm, 150));

    section.querySelectorAll('[data-ingredient-start-mode]').forEach((button) => {
        button.addEventListener('click', () => {
            const startModeInput = section.querySelector('.ingredient-section-start-mode');
            if (startModeInput) {
                startModeInput.value = button.dataset.ingredientStartMode || 'auto';
            }
            section.querySelectorAll('[data-ingredient-start-mode]').forEach((modeButton) => {
                const isActive = modeButton === button;
                modeButton.classList.toggle('is-active', isActive);
                modeButton.setAttribute('aria-pressed', String(isActive));
            });
            updateRecipeFromForm();
        });
    });

    section.querySelectorAll('[data-move-section]').forEach((button) => {
        button.addEventListener('click', () => {
            moveSectionEditor(section, button.dataset.moveSection, '.ingredient-section-editor');
        });
    });

    section.querySelector('.btn-add-ingredient-inline')?.addEventListener('click', () => {
        addIngredientRow('', '', section.querySelector('.ingredient-section-rows'));
        updateRecipeFromForm();
    });

    section.querySelector('.btn-add-ingredient-header-inline')?.addEventListener('click', () => {
        addIngredientLabelRow('header', '', section.querySelector('.ingredient-section-rows'));
        updateRecipeFromForm();
    });

    section.querySelector('.btn-add-ingredient-subtitle-inline')?.addEventListener('click', () => {
        addIngredientLabelRow('subtitle', '', section.querySelector('.ingredient-section-rows'));
        updateRecipeFromForm();
    });

    section.querySelector('.btn-ingredient-paste')?.addEventListener('click', () => {
        const pasteInput = section.querySelector('.ingredient-section-paste-input');
        const rowsContainer = section.querySelector('.ingredient-section-rows');
        const parsedIngredients = parseIngredientPasteBlock(pasteInput?.value || '');

        if (!pasteInput || !rowsContainer || parsedIngredients.length === 0) {
            return;
        }

        rowsContainer.innerHTML = '';
        parsedIngredients.forEach((ingredient) => {
            if (ingredient.type === 'header' || ingredient.type === 'subtitle') {
                addIngredientLabelRow(ingredient.type, ingredient.text || '', rowsContainer);
            } else {
                addIngredientRow(ingredient.name, ingredient.amount, rowsContainer);
            }
        });
        pasteInput.value = '';
        updateRecipeFromForm();
    });

    section.querySelector('.btn-remove')?.addEventListener('click', () => {
        section.remove();
        refreshSectionMoveButtons(container, '.ingredient-section-editor');
        updateRecipeFromForm();
    });

    container.appendChild(section);

    const rowsContainer = section.querySelector('.ingredient-section-rows');
    (ingredients.length ? ingredients : [{}]).forEach((ingredient) => {
        if (ingredient.type === 'header' || ingredient.type === 'subtitle') {
            addIngredientLabelRow(ingredient.type, ingredient.text || '', rowsContainer);
        } else {
            addIngredientRow(ingredient.name || '', ingredient.amount || '', rowsContainer);
        }
    });

    refreshSectionMoveButtons(container, '.ingredient-section-editor');
}

function addIngredientRowToLastSection(name = '', amount = '') {
    let lastSectionRows = elements.ingredientsList()?.querySelector('.ingredient-section-editor:last-child .ingredient-section-rows');

    if (!lastSectionRows) {
        addIngredientSectionEditor('', [], true, 'auto');
        lastSectionRows = elements.ingredientsList()?.querySelector('.ingredient-section-editor:last-child .ingredient-section-rows');
    }

    addIngredientRow(name, amount, lastSectionRows);
}

function addIngredientRow(name = '', amount = '', container = null) {
    const targetContainer = container || elements.ingredientsList()?.querySelector('.ingredient-section-editor:last-child .ingredient-section-rows');
    if (!targetContainer) return;

    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.dataset.ingredientRowType = 'ingredient';
    row.innerHTML = `
        <button type="button" class="row-drag-handle ingredient-drag-handle drag-handle" title="Drag to reorder" aria-label="Drag to reorder ingredient"></button>
        <textarea class="ingredient-name" rows="1" placeholder="Ingredient name">${escapeHtml(name)}</textarea>
        <textarea class="ingredient-amount" rows="1" placeholder="Amount">${escapeHtml(amount)}</textarea>
        <button type="button" class="btn-remove" title="Remove">×</button>
    `;

    row.querySelector('.ingredient-name').addEventListener('input', debounce(updateRecipeFromForm, 150));
    row.querySelector('.ingredient-amount').addEventListener('input', debounce(updateRecipeFromForm, 150));
    row.querySelector('.btn-remove').addEventListener('click', () => {
        row.remove();
        updateRecipeFromForm();
    });

    targetContainer.appendChild(row);
    initializeIngredientSortable(targetContainer);
}

function addIngredientLabelRow(type = 'header', text = '', container = null) {
    const targetContainer = container || elements.ingredientsList()?.querySelector('.ingredient-section-editor:last-child .ingredient-section-rows');
    if (!targetContainer) return;

    const normalizedType = type === 'subtitle' ? 'subtitle' : 'header';
    const row = document.createElement('div');
    row.className = `ingredient-row ingredient-label-row ingredient-label-row--${normalizedType}`;
    row.dataset.ingredientRowType = normalizedType;
    row.innerHTML = `
        <button type="button" class="row-drag-handle ingredient-drag-handle drag-handle" title="Drag to reorder" aria-label="Drag to reorder ingredient ${normalizedType}"></button>
        <textarea class="ingredient-label-text" rows="1" placeholder="Ingredient ${normalizedType}">${escapeHtml(text)}</textarea>
        <button type="button" class="btn-remove" title="Remove">×</button>
    `;

    row.querySelector('.ingredient-label-text').addEventListener('input', debounce(updateRecipeFromForm, 150));
    row.querySelector('.btn-remove').addEventListener('click', () => {
        row.remove();
        updateRecipeFromForm();
    });

    targetContainer.appendChild(row);
    initializeIngredientSortable(targetContainer);
}

function initializeIngredientSortable(container) {
    initializeRowSortable(container, {
        readyKey: 'ingredientSortableReady',
        groupName: 'ingredient-rows',
        handle: '.ingredient-drag-handle',
        draggable: '.ingredient-row',
        ghostClass: 'row-sortable-ghost',
        chosenClass: 'row-sortable-chosen',
        dragClass: 'row-sortable-drag',
        onEnd: updateRecipeFromForm
    });
}

function addPortionVariationSectionEditor(label = '', icon = '', variations = [], isPrimary = false, linkIconPosition = 'right') {
    const container = elements.portionVariationSections();
    if (!container) return;

    const section = document.createElement('div');
    section.className = 'portion-variation-section-editor';
    section.innerHTML = `
        <div class="portion-variation-section-editor-header">
            <input type="text" class="portion-variation-section-label" placeholder="Portion variation set label" value="${escapeHtml(label || 'Portion Variations')}">
            ${isPrimary ? '' : '<button type="button" class="btn-remove" title="Remove Section">×</button>'}
        </div>
        <div class="portion-variation-section-editor-meta">
            <div class="portion-variation-section-control">
                <label>Variation Icon</label>
                <select class="portion-variation-section-icon"></select>
            </div>
            <label class="form-toggle portion-variation-link-icon-toggle">
                <input type="checkbox" class="portion-variation-link-icon-position" ${linkIconPosition === 'left' ? 'checked' : ''}>
                <span>Link icon left of text</span>
            </label>
        </div>
        <div class="portion-variation-section-paste">
            <textarea class="portion-variation-section-paste-input" rows="4" placeholder="Paste portion variations here, one per line:&#10;Caramel Fudge;190;15;11;7;5;https://example.com;yes&#10;Bundle Link;;;;;;https://example.com;no"></textarea>
            <div class="portion-variation-section-paste-actions">
                <button type="button" class="btn-secondary btn-copy-portion-ai-prompt">Copy AI Prompt</button>
                <button type="button" class="btn-secondary btn-portion-variation-paste">Paste Into This Set</button>
            </div>
        </div>
        <div class="portion-variation-section-rows"></div>
        <div class="portion-variation-section-actions">
            <button type="button" class="btn-add btn-add-portion-inline">+ Add Portion Variation</button>
        </div>
    `;

    container.appendChild(section);

    const labelInput = section.querySelector('.portion-variation-section-label');
    labelInput.addEventListener('input', debounce(updateRecipeFromForm, 150));

    const iconSelect = section.querySelector('.portion-variation-section-icon');
    populateSinglePortionVariationIconSelect(iconSelect, icon);
    iconSelect.addEventListener('change', debounce(updateRecipeFromForm, 150));
    section.querySelector('.portion-variation-link-icon-position')?.addEventListener('change', updateRecipeFromForm);

    section.querySelector('.btn-add-portion-inline')?.addEventListener('click', () => {
        addPortionVariationRow({}, section.querySelector('.portion-variation-section-rows'));
        updateRecipeFromForm();
    });

    section.querySelector('.btn-copy-portion-ai-prompt')?.addEventListener('click', () => {
        const aiPrompt = `You are helping me format portion variation data for my Recipe Page Generator.

Please analyze the product information provided and output ONLY the structured data in this exact format:

Label;Calories;Protein;Carbs;Fat;Fiber;URL;Show Macros

Each line represents one portion variation with:
- Label: Portion size and product name (e.g., "1 bar (60g) - Caramel Fudge")
- Calories: Total calories (number only)
- Protein: Protein in grams (number only)
- Carbs: Carbohydrates in grams (number only)
- Fat: Fat in grams (number only)
- Fiber: Fiber in grams (number only)
- URL: Purchase link (optional, can be left blank)
- Show Macros: yes/no. Use "no" for link-only items that should not show macro details.

IMPORTANT RULES:
- One variation per line
- Semicolon-separated values
- Numbers only for macros (no units)
- If a field is unknown, leave it blank but keep the semicolon
- If Show Macros is omitted, it defaults to yes
- Return the final portion variation rows inside one fenced code block using triple backticks
- Do NOT put any commentary, explanations, or extra text outside the code block
- The code block is required so semicolons, blank fields, and line breaks are preserved when pasted into the app

Example output:
1 bar (60g) - Caramel Fudge;190;15;11;7;5;https://example.com/caramel;yes
1 bar (60g) - Chocolate Brownie;195;15;8;9;12;https://example.com/chocolate;yes
Purchase variety pack;;;;;;https://example.com/variety-pack;no`;

        navigator.clipboard.writeText(aiPrompt).then(() => {
            const btn = section.querySelector('.btn-copy-portion-ai-prompt');
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy AI prompt:', err);
            alert('Failed to copy to clipboard. Please try again.');
        });
    });

    section.querySelector('.btn-portion-variation-paste')?.addEventListener('click', () => {
        const pasteInput = section.querySelector('.portion-variation-section-paste-input');
        const rowsContainer = section.querySelector('.portion-variation-section-rows');
        const parsedVariations = parsePortionVariationPasteBlock(pasteInput?.value || '');

        if (!pasteInput || !rowsContainer || parsedVariations.length === 0) {
            return;
        }

        rowsContainer.innerHTML = '';
        parsedVariations.forEach((variation) => {
            addPortionVariationRow(variation, rowsContainer);
        });
        pasteInput.value = '';
        updateRecipeFromForm();
    });

    section.querySelector('.btn-remove')?.addEventListener('click', () => {
        section.remove();
        updateRecipeFromForm();
    });

    const rowsContainer = section.querySelector('.portion-variation-section-rows');
    (variations.length ? variations : ['']).forEach((variation) => {
        addPortionVariationRow(typeof variation === 'string' ? {} : variation, rowsContainer);
    });
}

function populateSinglePortionVariationIconSelect(select, selectedValue = '') {
    if (!select) return;

    select.innerHTML = `
        <option value="">Default Bowl</option>
        <option value="none">None</option>
    `;

    AVAILABLE_PORTION_VARIATION_ICONS.forEach((material) => {
        const option = document.createElement('option');
        option.value = material.id;
        option.textContent = material.name;
        if (material.id === selectedValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function addPortionVariationRowToLastSection(variation = {}) {
    let lastSectionRows = elements.portionVariationSections()?.querySelector('.portion-variation-section-editor:last-child .portion-variation-section-rows');

    if (!lastSectionRows) {
        addPortionVariationSectionEditor('Portion Variations', '', [], true);
        lastSectionRows = elements.portionVariationSections()?.querySelector('.portion-variation-section-editor:last-child .portion-variation-section-rows');
    }

    addPortionVariationRow(variation, lastSectionRows);
}

function addPortionVariationRow(variation = {}, container = null) {
    const targetContainer = container || elements.portionVariationSections()?.querySelector('.portion-variation-section-editor:last-child .portion-variation-section-rows');
    if (!targetContainer) return;

    const normalizedVariation = normalizePortionVariation(variation);
    const row = document.createElement('div');
    row.className = 'portion-variation-row';
    row.innerHTML = `
        <div class="portion-variation-main">
            <input type="text" class="portion-variation-label" placeholder="Portion label, e.g. ½ cup (75 g)" value="${escapeHtml(normalizedVariation.label || '')}">
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
        <label class="form-toggle portion-variation-macro-toggle">
            <input type="checkbox" class="portion-variation-show-macros" ${normalizedVariation.showMacros ? 'checked' : ''}>
            <span>Show macros</span>
        </label>
        <div class="portion-variation-macros">
            <input type="text" class="portion-variation-calories" placeholder="cal" value="${escapeHtml(normalizedVariation.calories || '')}">
            <input type="text" class="portion-variation-protein" placeholder="pro" value="${escapeHtml(normalizedVariation.protein || '')}">
            <input type="text" class="portion-variation-carbs" placeholder="carb" value="${escapeHtml(normalizedVariation.carbs || '')}">
            <input type="text" class="portion-variation-fat" placeholder="fat" value="${escapeHtml(normalizedVariation.fat || '')}">
            <input type="text" class="portion-variation-fiber" placeholder="fiber" value="${escapeHtml(normalizedVariation.fiber || '')}">
        </div>
        <div class="portion-variation-link-row">
            <input type="url" class="portion-variation-url" placeholder="Purchase URL (optional)" value="${escapeHtml(normalizedVariation.url || '')}">
        </div>
    `;

    row.classList.toggle('portion-variation-row--macros-hidden', !normalizedVariation.showMacros);

    row.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', debounce(updateRecipeFromForm, 150));
    });

    row.querySelector('.portion-variation-show-macros')?.addEventListener('change', (event) => {
        row.classList.toggle('portion-variation-row--macros-hidden', !event.target.checked);
        updateRecipeFromForm();
    });

    row.querySelector('.btn-remove')?.addEventListener('click', () => {
        row.remove();
        updateRecipeFromForm();
    });

    targetContainer.appendChild(row);
}

/**
 * Add a new note row to the form
 */
function addNoteRow(text = '') {
    const container = elements.notesList();
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'note-row';
    row.innerHTML = `
        <textarea class="note-text-input" rows="6" placeholder="e.g., Note: Press tofu for 15 minutes to remove excess moisture.">${escapeHtml(text)}</textarea>
        <button type="button" class="btn-remove" title="Remove">×</button>
    `;

    row.querySelector('.note-text-input').addEventListener('input', debounce(updateRecipeFromForm, 150));
    row.querySelector('.btn-remove').addEventListener('click', () => {
        row.remove();
        updateRecipeFromForm();
    });

    container.appendChild(row);
}

/**
 * Add a new instruction row to the form
 */
function addInstructionSectionEditor(label = '', steps = [], isPrimary = false, startMode = 'force-right-column', stepStyle = 'numbered') {
    const container = elements.instructionsList();
    const normalizedStartMode = normalizeInstructionStartMode(startMode);
    const section = document.createElement('div');
    section.className = 'instruction-section-editor';
    section.innerHTML = `
        <div class="section-reorder-controls" aria-label="Move instruction set">
            <button type="button" class="segmented-control-button" data-move-section="up">Move Up</button>
            <button type="button" class="segmented-control-button" data-move-section="down">Move Down</button>
        </div>
        <div class="instruction-section-editor-header">
            <input type="text" class="instruction-section-label" placeholder="Instruction set label" value="${escapeHtml(label || '')}">
            ${isPrimary ? '' : '<button type="button" class="btn-remove" title="Remove Section">×</button>'}
        </div>
        <div class="instruction-section-editor-meta">
            <div class="instruction-section-control">
                <label>Instructions Start</label>
                <input type="hidden" class="instruction-section-start-mode" value="${normalizedStartMode}">
                <div class="segmented-control instruction-start-control" role="group" aria-label="Instructions start">
                    <button type="button" class="segmented-control-button ${normalizedStartMode === 'auto' ? 'is-active' : ''}" data-instruction-start-mode="auto" aria-pressed="${normalizedStartMode === 'auto'}">Auto</button>
                    <button type="button" class="segmented-control-button ${normalizedStartMode === 'force-right-column' ? 'is-active' : ''}" data-instruction-start-mode="force-right-column" aria-pressed="${normalizedStartMode === 'force-right-column'}">Right Column</button>
                    <button type="button" class="segmented-control-button ${normalizedStartMode === 'force-next-page' ? 'is-active' : ''}" data-instruction-start-mode="force-next-page" aria-pressed="${normalizedStartMode === 'force-next-page'}">Next Page</button>
                </div>
            </div>
            <input type="hidden" class="instruction-section-step-style" value="numbered">
        </div>
        <div class="instruction-section-steps"></div>
        <div class="instruction-section-actions">
            <button type="button" class="btn-add btn-add-step-inline">+ Add Step</button>
        </div>
    `;

    const labelInput = section.querySelector('.instruction-section-label');
    if (isPrimary) {
        labelInput.value = label || '';
    }
    labelInput.addEventListener('input', debounce(updateRecipeFromForm, 150));

    section.querySelectorAll('[data-instruction-start-mode]').forEach((button) => {
        button.addEventListener('click', () => {
            const startModeInput = section.querySelector('.instruction-section-start-mode');
            if (startModeInput) {
                startModeInput.value = normalizeInstructionStartMode(button.dataset.instructionStartMode);
            }
            section.querySelectorAll('[data-instruction-start-mode]').forEach((modeButton) => {
                const isActive = modeButton === button;
                modeButton.classList.toggle('is-active', isActive);
                modeButton.setAttribute('aria-pressed', String(isActive));
            });
            updateRecipeFromForm();
        });
    });

    section.querySelectorAll('[data-move-section]').forEach((button) => {
        button.addEventListener('click', () => {
            moveSectionEditor(section, button.dataset.moveSection, '.instruction-section-editor', () => {
                renumberInstructions();
                updateRecipeFromForm();
            });
        });
    });

    section.querySelector('.instruction-section-step-style')?.addEventListener('change', () => {
        renumberInstructions();
        updateRecipeFromForm();
    });

    section.querySelector('.btn-add-step-inline')?.addEventListener('click', () => {
        addInstructionRow('', section.querySelector('.instruction-section-steps'));
        updateRecipeFromForm();
    });

    section.querySelector('.btn-remove')?.addEventListener('click', () => {
        section.remove();
        refreshSectionMoveButtons(container, '.instruction-section-editor');
        renumberInstructions();
        updateRecipeFromForm();
    });

    container.appendChild(section);

    const stepsContainer = section.querySelector('.instruction-section-steps');
    (steps.length ? steps : ['']).forEach((step) => {
        if (isInstructionHeaderStep(step)) {
            const marker = getInstructionLabelType(step) === 'subtitle' ? ':SUBTITLE:' : ':HEADER:';
            addInstructionRow(`${marker} ${getInstructionStepText(step)}`, stepsContainer, []);
        } else if (typeof step === 'string') {
            addInstructionRow(step, stepsContainer, []);
        } else {
            addInstructionRow(step.text || '', stepsContainer, step.checkboxItems || []);
        }
    });

    renumberInstructions();
    refreshSectionMoveButtons(container, '.instruction-section-editor');
}

function addInstructionRowToLastSection(text = '') {
    let lastSectionSteps = elements.instructionsList()?.querySelector('.instruction-section-editor:last-child .instruction-section-steps');

    if (!lastSectionSteps) {
        addInstructionSectionEditor('', [], true, currentRecipe.instructionsStartMode || 'force-right-column');
        lastSectionSteps = elements.instructionsList()?.querySelector('.instruction-section-editor:last-child .instruction-section-steps');
    }

    addInstructionRow(text, lastSectionSteps);
}

function addInstructionRow(text = '', container = null, checkboxItems = []) {
    const targetContainer = container || elements.instructionsList();
    const stepNumber = targetContainer.querySelectorAll('.instruction-row').length + 1;

    const row = document.createElement('div');
    row.className = 'instruction-row';
    row.innerHTML = `
        <button type="button" class="instruction-drag-handle drag-handle" title="Drag to reorder" aria-label="Drag to reorder instruction step"></button>
        <button type="button" class="step-number" title="Toggle instruction header" aria-label="Toggle instruction header">${stepNumber}</button>
        <div class="instruction-content">
            <textarea placeholder="Enter instruction step...">${escapeHtml(text)}</textarea>
            <div class="instruction-checkbox-section" style="display: none;">
                <div class="instruction-checkbox-items"></div>
                <button type="button" class="btn-add-checkbox-item">+ Add Checkbox Item</button>
            </div>
        </div>
        <div class="instruction-row-actions">
            <button type="button" class="btn-toggle-checkboxes" title="Toggle Checkboxes">☑</button>
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
    `;

    const textarea = row.querySelector('textarea');
    const checkboxSection = row.querySelector('.instruction-checkbox-section');
    const checkboxItemsContainer = row.querySelector('.instruction-checkbox-items');
    const toggleBtn = row.querySelector('.btn-toggle-checkboxes');
    const addCheckboxBtn = row.querySelector('.btn-add-checkbox-item');
    const markerBtn = row.querySelector('.step-number');

    textarea.addEventListener('input', debounce(() => {
        renumberInstructions();
        updateRecipeFromForm();
    }, 150));

    markerBtn?.addEventListener('click', () => {
        const headerText = parseInstructionHeaderText(textarea.value);
        const subtitleText = parseInstructionSubtitleText(textarea.value);
        if (headerText) {
            textarea.value = formatInstructionSubtitleText(headerText);
        } else if (subtitleText) {
            textarea.value = subtitleText;
        } else {
            textarea.value = formatInstructionHeaderText(textarea.value);
        }
        textarea.focus();
        renumberInstructions();
        updateRecipeFromForm();
    });

    row.querySelector('.btn-remove').addEventListener('click', () => {
        row.remove();
        renumberInstructions();
        updateRecipeFromForm();
    });

    toggleBtn.addEventListener('click', () => {
        const isVisible = checkboxSection.style.display !== 'none';
        checkboxSection.style.display = isVisible ? 'none' : 'block';
        toggleBtn.style.opacity = isVisible ? '0.5' : '1';
    });

    addCheckboxBtn.addEventListener('click', () => {
        addCheckboxItem('', checkboxItemsContainer);
    });

    targetContainer.appendChild(row);
    initializeInstructionSortable(targetContainer);

    // Add existing checkbox items
    if (checkboxItems && checkboxItems.length > 0) {
        checkboxSection.style.display = 'block';
        toggleBtn.style.opacity = '1';
        checkboxItems.forEach(item => {
            addCheckboxItem(item, checkboxItemsContainer);
        });
    }

    renumberInstructions();
}

function initializeInstructionSortable(container) {
    initializeRowSortable(container, {
        readyKey: 'instructionSortableReady',
        groupName: 'instruction-steps',
        handle: '.instruction-drag-handle',
        draggable: '.instruction-row',
        ghostClass: 'row-sortable-ghost',
        chosenClass: 'row-sortable-chosen',
        dragClass: 'row-sortable-drag',
        onEnd: () => {
            renumberInstructions();
            updateRecipeFromForm();
        }
    });
}

function initializeRowSortable(container, options) {
    if (!container || container.dataset[options.readyKey] === 'true' || typeof Sortable === 'undefined') {
        return;
    }

    container.dataset[options.readyKey] = 'true';
    Sortable.create(container, {
        group: {
            name: options.groupName,
            pull: true,
            put: true
        },
        animation: 150,
        handle: options.handle,
        draggable: options.draggable,
        ghostClass: options.ghostClass,
        chosenClass: options.chosenClass,
        dragClass: options.dragClass,
        emptyInsertThreshold: 24,
        preventOnFilter: false,
        filter: 'textarea, input, button:not(.drag-handle)',
        onEnd: options.onEnd
    });
}

function addCheckboxItem(text = '', container) {
    const item = document.createElement('div');
    item.className = 'instruction-checkbox-item';
    item.innerHTML = `
        <input type="text" placeholder="Checkbox item text..." value="${escapeHtml(text)}">
        <button type="button" class="btn-remove-small" title="Remove">×</button>
    `;

    item.querySelector('input').addEventListener('input', debounce(updateRecipeFromForm, 150));
    item.querySelector('.btn-remove-small').addEventListener('click', () => {
        item.remove();
        updateRecipeFromForm();
    });

    container.appendChild(item);
}

function getInstructionSectionStepStyle(section) {
    return section?.querySelector('.instruction-section-step-style')?.value || 'numbered';
}

function updateInstructionRowMarker(row, index, stepStyle = 'numbered') {
    const marker = row.querySelector('.step-number');
    if (!marker) return;

    const labelType = getInstructionLabelType(row.querySelector('textarea')?.value || '');
    if (labelType) {
        marker.textContent = labelType === 'subtitle' ? 'S' : 'H';
        marker.classList.remove('step-bullet');
        marker.classList.add('step-header');
        marker.classList.toggle('step-subtitle', labelType === 'subtitle');
        marker.setAttribute('aria-pressed', 'true');
        marker.setAttribute('title', labelType === 'subtitle' ? 'Change subtitle to numbered instruction' : 'Change header to subtitle');
        marker.setAttribute('aria-label', labelType === 'subtitle' ? 'Change subtitle to numbered instruction' : 'Change header to subtitle');
        return;
    }

    marker.classList.remove('step-header');
    marker.classList.remove('step-subtitle');
    marker.setAttribute('aria-pressed', 'false');
    marker.setAttribute('title', 'Change instruction to header');
    marker.setAttribute('aria-label', 'Change instruction to header');

    if (stepStyle === 'bulleted') {
        marker.textContent = '';
        marker.classList.add('step-bullet');
        return;
    }

    marker.textContent = index + 1;
    marker.classList.remove('step-bullet');
}

/**
 * Renumber instruction steps after deletion
 */
function renumberInstructions() {
    const sections = elements.instructionsList()?.querySelectorAll('.instruction-section-editor');
    sections?.forEach((section) => {
        const stepStyle = getInstructionSectionStepStyle(section);
        const rows = section.querySelectorAll('.instruction-row');
        let visibleStepIndex = 0;
        rows.forEach((row) => {
            const isHeader = Boolean(getInstructionLabelType(row.querySelector('textarea')?.value || ''));
            updateInstructionRowMarker(row, visibleStepIndex, stepStyle);
            if (isHeader) {
                visibleStepIndex = 0;
            } else {
                visibleStepIndex += 1;
            }
        });
    });
}

// ================================================
// IMAGE HANDLING
// ================================================

/**
 * Handle image file upload
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const imageData = e.target.result;
        setHeroImageSource(imageData);
    };
    reader.readAsDataURL(file);
}

function handleHeroImageLoadError() {
    alert('Unable to load that image.');
}

function setHeroImageSource(imageSource) {
    if (!imageSource) return;

    elements.imagePreviewThumb().src = imageSource;
    elements.imageUploadArea().classList.add('has-image');
    setImageControlsDisabled(false);
    currentRecipe.image = imageSource;
    currentRecipe.imageSettings = { scale: 100, posX: 50, posY: 50 };

    if (elements.imageScale()) {
        elements.imageScale().value = 100;
        elements.imageScaleValue().value = 100;
    }

    if (elements.imagePosX()) {
        elements.imagePosX().value = 50;
        elements.imagePosXValue().value = 50;
    }

    if (elements.imagePosY()) {
        elements.imagePosY().value = 50;
        elements.imagePosYValue().value = 50;
    }

    renderRecipePage();
}

function getHeroImageValue() {
    const previewSource = elements.imagePreviewThumb()?.getAttribute('src') || '';
    return previewSource || currentRecipe.image || '';
}

function removeHeroImage() {
    currentRecipe.image = '';
    currentRecipe.imageSettings = { scale: 100, posX: 50, posY: 50 };

    if (elements.heroImage()) {
        elements.heroImage().value = '';
    }

    if (elements.imagePreviewThumb()) {
        elements.imagePreviewThumb().removeAttribute('src');
    }

    elements.imageUploadArea()?.classList.remove('has-image');
    setImageControlsDisabled(true);

    if (elements.imageScale()) {
        elements.imageScale().value = 100;
        elements.imageScaleValue().value = 100;
    }

    if (elements.imagePosX()) {
        elements.imagePosX().value = 50;
        elements.imagePosXValue().value = 50;
    }

    if (elements.imagePosY()) {
        elements.imagePosY().value = 50;
        elements.imagePosYValue().value = 50;
    }

    updateRecipeFromForm();
}

function getNumericControlValue(control, fallback) {
    const value = Number.parseInt(control?.value, 10);
    return Number.isFinite(value) ? value : fallback;
}

function bindImageValueInput(input, slider, fallback) {
    if (!input || !slider) return;

    input.addEventListener('input', () => {
        const min = Number.parseInt(slider.min, 10);
        const max = Number.parseInt(slider.max, 10);
        let value = getNumericControlValue(input, fallback);

        if (Number.isFinite(min)) {
            value = Math.max(min, value);
        }

        if (Number.isFinite(max)) {
            value = Math.min(max, value);
        }

        input.value = value;
        slider.value = value;
        updateRecipeFromForm();
    });
}

function setImageControlsDisabled(disabled) {
    [
        elements.imageScale(),
        elements.imageScaleValue(),
        elements.heroHeight(),
        elements.heroHeightValue(),
        elements.imagePosX(),
        elements.imagePosXValue(),
        elements.imagePosY(),
        elements.imagePosYValue(),
        elements.btnResetImageControls()
    ].forEach((control) => {
        if (control) {
            control.disabled = disabled;
        }
    });
}

function resetImageControlsToDefaults() {
    if (elements.imageScale()) {
        elements.imageScale().value = 100;
        elements.imageScaleValue().value = 100;
    }

    if (elements.heroHeight()) {
        elements.heroHeight().value = 309;
        elements.heroHeightValue().value = 309;
    }

    if (elements.imagePosX()) {
        elements.imagePosX().value = 50;
        elements.imagePosXValue().value = 50;
    }

    if (elements.imagePosY()) {
        elements.imagePosY().value = 50;
        elements.imagePosYValue().value = 50;
    }

    currentRecipe.imageSettings = { scale: 100, posX: 50, posY: 50 };
    currentRecipe.heroHeight = 309;
    updateRecipeFromForm();
}

// ================================================
// RECIPE PAGE RENDERING
// ================================================

/**
 * Render the recipe page preview
 */
function renderRecipePage() {
    const page = elements.recipePage();
    const recipe = currentRecipe;
    page.className = `recipe-page-stack${isBottomMarginGuideVisible ? ' show-bottom-margin-guide' : ''}`;

    if ((recipe.pageType || 'recipe') === 'day-of-eating') {
        renderDayOfEatingPage(page, recipe);
        return;
    }

    // Build materials HTML
    const materialsLayout = recipe.materialsLayout || 'column';
    const showMaterials = recipe.showMaterials !== false;
    const materialsAutoSpacing = recipe.materialsAutoSpacing === true;
    const materialsHtml = showMaterials ? recipe.materials?.map(materialId => {
        const material = AVAILABLE_MATERIALS.find(m => m.id === materialId);
        if (!material) return '';
        return `<div class="material-icon-item" title="${material.name}">${material.svg}</div>`;
    }).join('') || '' : '';

    // Materials section HTML
    const materialsSection = materialsHtml ? `
        <div class="materials-section" data-materials-auto-spacing="${materialsAutoSpacing ? 'true' : 'false'}">
            <h2 class="section-title">Materials</h2>
            <div class="materials-icons">
                ${materialsHtml}
            </div>
        </div>
    ` : '';

    // Helper function to format note text with bold before colon
    function formatNoteText(text) {
        const colonIndex = text.indexOf(':');
        if (colonIndex > 0) {
            const beforeColon = escapeHtml(text.substring(0, colonIndex + 1));
            const afterColon = escapeHtml(text.substring(colonIndex + 1));
            return `<strong>${beforeColon}</strong>${afterColon}`;
        }
        return escapeHtml(text);
    }

    // Build note callout HTML for multiple notes
    const notesHtml = (recipe.notes || []).map((noteText, index) => `
        <div class="note-callout">
            <span class="note-icon">
                <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.61077 2.89669L8.69799 2.17188L10.5101 2.89669L15.9462 9.05762L18.483 12.6817L17.3958 14.8561L11.9597 15.9434L6.16118 16.6682H3.62433L2.53711 14.8561L5.43637 6.88317L7.61077 2.89669Z" fill="white"/>
                    <g clip-path="url(#note-alert-clip-${index})">
                        <path d="M18.9403 12.1813C18.9931 12.371 19.0667 12.8187 19.0775 13.016C19.1459 14.3101 18.1222 15.7543 16.8714 16.0776L5.27533 17.9952C3.0536 18.1176 1.4219 15.8355 2.24473 13.7381L6.27485 2.98732C7.5625 0.91819 9.89823 0.837898 11.4706 2.65637C13.9332 5.50314 16.2155 8.6012 18.617 11.5052C18.7084 11.7111 18.8805 11.9702 18.9403 12.1813ZM8.43708 2.87809C8.09644 2.98267 7.7394 3.28834 7.56083 3.59546C6.16362 7.22805 4.80389 10.8825 3.47758 14.5424C3.25967 15.6448 4.10124 16.6332 5.21018 16.5644L16.422 14.721C17.5977 14.3779 18.0466 12.9248 17.2273 11.9814L10.1333 3.26485C9.6573 2.82249 9.06082 2.68591 8.43708 2.87809Z" fill="black"/>
                        <path d="M9.12364 6.22816C9.51047 6.10778 9.94397 6.25884 10.1515 6.60989C10.3992 7.02821 10.3722 7.82076 10.4271 8.31936C10.5321 9.27083 10.6374 10.2209 10.7517 11.1715C10.7006 11.9037 9.72734 12.0637 9.44451 11.3864C9.19849 10.1044 8.81313 8.84059 8.56853 7.56318C8.46749 7.03523 8.52783 6.41301 9.12298 6.22827L9.12364 6.22816Z" fill="black"/>
                        <path d="M10.5686 14.1642C11.0525 14.0846 11.3798 13.6241 11.2994 13.1355C11.2191 12.6469 10.7616 12.3154 10.2777 12.395C9.7937 12.4746 9.46649 12.9351 9.54682 13.4237C9.62714 13.9122 10.0846 14.2438 10.5686 14.1642Z" fill="black"/>
                    </g>
                    <defs>
                        <clipPath id="note-alert-clip-${index}">
                            <rect width="17.1816" height="15.86" fill="white" transform="translate(0 2.78906) rotate(-9.33713)"/>
                        </clipPath>
                    </defs>
                </svg>
            </span>
            <span class="note-text">${formatNoteText(noteText)}</span>
        </div>
    `).join('');

    const heroHeight = isPrinterFriendly(recipe) ? getPrinterFriendlyHeroHeight(recipe) : (Number.parseInt(recipe.heroHeight, 10) || 309);
    const titleFontSize = Number.parseInt(recipe.titleFontSize, 10) || 40;
    const printerTitleTopPadding = getPrinterTitleTopPadding(recipe);
    const printerTitleMacroSpacing = getPrinterTitleMacroSpacing(recipe);
    const heroStyle = isPrinterFriendly(recipe)
        ? `--printer-title-top-padding: ${printerTitleTopPadding}px; --printer-title-macro-spacing: ${printerTitleMacroSpacing}px;`
        : `height: ${heroHeight}px; --printer-title-macro-spacing: ${printerTitleMacroSpacing}px;`;
    const heroImageHtml = createHeroImageMarkup(recipe);

    const macroValues = [
        recipe.macros?.calories,
        recipe.macros?.protein,
        recipe.macros?.carbs,
        recipe.macros?.fat
    ];
    const hasMacroData = macroValues.some(value => String(value || '').trim() !== '');
    const shouldShowMacroBar = recipe.showMacroBar !== false && hasMacroData;
    const shouldShowDescription = recipe.showDescription !== false;
    const macroBarHtml = hasMacroData ? createMacroBarMarkup(recipe.macros, recipe.macroBarPrefix) : '';

    // Render the complete page
    page.innerHTML = `
        <div class="recipe-page page-primary${isPrinterFriendly(recipe) ? ' printer-friendly-page' : ''}">
            <!-- Hero Section -->
            <div class="hero-section" style="${heroStyle}">
                ${heroImageHtml}
                <div class="hero-overlay"></div>
                <h1 class="recipe-title" style="font-size: ${titleFontSize}px;">${escapeHtml(recipe.title || 'Recipe Title')}</h1>
            </div>

            <!-- Macro Bar -->
            ${shouldShowMacroBar ? `
            <div class="macro-bar">
                <div class="macro-bar-content">
                    ${macroBarHtml}
                </div>
            </div>
            ` : ''}

            <!-- Description -->
            ${shouldShowDescription ? `
            <div class="description-section">
                <p class="description-text">${escapeHtml(recipe.description || 'Recipe description goes here...')}</p>
            </div>
            ` : ''}

            <!-- Content Area -->
            <div class="content-area" data-materials-layout="${materialsLayout}">
                ${materialsLayout === 'full-width' ? materialsSection : ''}

                <div class="page-flow-grid" id="page-flow-grid">
                    <div class="flow-column" id="flow-slot-1"></div>
                    <div class="flow-column" id="flow-slot-2"></div>
                </div>
            </div>

            <!-- Page Footer -->
            <div class="page-bottom-margin-guide" aria-hidden="true"></div>
            <div class="page-footer">
                <span class="page-number">${escapeHtml(recipe.pageNumber || '')}</span>
            </div>
        </div>

        <div id="continuation-pages"></div>`;

    // Paginate ingredients and instructions in reading order after rendering
    requestAnimationFrame(() => {
        layoutHeroImageLayers(page);
        paginateRecipeFlow(notesHtml);
    });
}

function renderDayOfEatingPage(page, recipe) {
    const heroHeight = isPrinterFriendly(recipe) ? getPrinterFriendlyHeroHeight(recipe) : (Number.parseInt(recipe.heroHeight, 10) || 309);
    const titleFontSize = Number.parseInt(recipe.titleFontSize, 10) || 40;
    const printerTitleTopPadding = getPrinterTitleTopPadding(recipe);
    const printerTitleMacroSpacing = getPrinterTitleMacroSpacing(recipe);
    const heroStyle = isPrinterFriendly(recipe)
        ? `--printer-title-top-padding: ${printerTitleTopPadding}px; --printer-title-macro-spacing: ${printerTitleMacroSpacing}px;`
        : `height: ${heroHeight}px; --printer-title-macro-spacing: ${printerTitleMacroSpacing}px;`;
    const heroImageHtml = createHeroImageMarkup(recipe);
    const macroBarHtml = createMacroBarMarkup(recipe.macros, recipe.macroBarPrefix);
    const hasMacroData = hasAnyMacroData(recipe.macros);
    const shouldShowMacroBar = recipe.showMacroBar !== false && hasMacroData;
    const shouldShowDescription = recipe.showDescription !== false;

    // Helper function to format note text with bold before colon
    function formatNoteText(text) {
        const colonIndex = text.indexOf(':');
        if (colonIndex > 0) {
            const beforeColon = escapeHtml(text.substring(0, colonIndex + 1));
            const afterColon = escapeHtml(text.substring(colonIndex + 1));
            return `<strong>${beforeColon}</strong>${afterColon}`;
        }
        return escapeHtml(text);
    }

    const notesHtml = (recipe.notes || []).map((noteText, index) => `
        <div class="note-callout">
            <span class="note-icon">
                <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.61077 2.89669L8.69799 2.17188L10.5101 2.89669L15.9462 9.05762L18.483 12.6817L17.3958 14.8561L11.9597 15.9434L6.16118 16.6682H3.62433L2.53711 14.8561L5.43637 6.88317L7.61077 2.89669Z" fill="white"/>
                    <g clip-path="url(#note-alert-clip-day-${index})">
                        <path d="M18.9403 12.1813C18.9931 12.371 19.0667 12.8187 19.0775 13.016C19.1459 14.3101 18.1222 15.7543 16.8714 16.0776L5.27533 17.9952C3.0536 18.1176 1.4219 15.8355 2.24473 13.7381L6.27485 2.98732C7.5625 0.91819 9.89823 0.837898 11.4706 2.65637C13.9332 5.50314 16.2155 8.6012 18.617 11.5052C18.7084 11.7111 18.8805 11.9702 18.9403 12.1813ZM8.43708 2.87809C8.09644 2.98267 7.7394 3.28834 7.56083 3.59546C6.16362 7.22805 4.80389 10.8825 3.47758 14.5424C3.25967 15.6448 4.10124 16.6332 5.21018 16.5644L16.422 14.721C17.5977 14.3779 18.0466 12.9248 17.2273 11.9814L10.1333 3.26485C9.6573 2.82249 9.06082 2.68591 8.43708 2.87809Z" fill="black"/>
                        <path d="M9.12364 6.22816C9.51047 6.10778 9.94397 6.25884 10.1515 6.60989C10.3992 7.02821 10.3722 7.82076 10.4271 8.31936C10.5321 9.27083 10.6374 10.2209 10.7517 11.1715C10.7006 11.9037 9.72734 12.0637 9.44451 11.3864C9.19849 10.1044 8.81313 8.84059 8.56853 7.56318C8.46749 7.03523 8.52783 6.41301 9.12298 6.22827L9.12364 6.22816Z" fill="black"/>
                        <path d="M10.5686 14.1642C11.0525 14.0846 11.3798 13.6241 11.2994 13.1355C11.2191 12.6469 10.7616 12.3154 10.2777 12.395C9.7937 12.4746 9.46649 12.9351 9.54682 13.4237C9.62714 13.9122 10.0846 14.2438 10.5686 14.1642Z" fill="black"/>
                    </g>
                    <defs>
                        <clipPath id="note-alert-clip-day-${index}">
                            <rect width="17.1816" height="15.86" fill="white" transform="translate(0 2.78906) rotate(-9.33713)"/>
                        </clipPath>
                    </defs>
                </svg>
            </span>
            <span class="note-text">${formatNoteText(noteText)}</span>
        </div>
    `).join('');

    const mealsHtml = (recipe.dayMeals || []).map((meal) => createDayMealCardMarkup(meal)).join('');
    const breakdownSvg = createMacroBreakdownSvg(recipe.macros);
    const highlightsHtml = createDayListMarkup(recipe.dayHighlights || [], 'star');
    const tipsHtml = createDayListMarkup(recipe.dayTips || [], 'dot');

    page.innerHTML = `
        <div class="recipe-page page-primary day-plan-page${isPrinterFriendly(recipe) ? ' printer-friendly-page' : ''}">
            <div class="hero-section" style="${heroStyle}">
                ${heroImageHtml}
                <div class="hero-overlay"></div>
                <h1 class="recipe-title" style="font-size: ${titleFontSize}px;">${escapeHtml(recipe.title || 'Day of Eating')}</h1>
            </div>

            ${shouldShowMacroBar ? `
            <div class="macro-bar">
                <div class="macro-bar-content">
                    ${macroBarHtml}
                </div>
            </div>
            ` : ''}

            ${shouldShowDescription ? `<div class="description-section">
                <p class="description-text">${escapeHtml(recipe.description || '')}</p>
            </div>` : ''}

            <div class="content-area day-plan-content">
                <div class="day-plan-grid" id="day-plan-grid">
                    <div class="day-plan-column day-plan-column-left" id="day-plan-left-column">
                        ${(recipe.dayMeals || []).length > 0 ? `
                        <h2 class="section-title">${escapeHtml(recipe.dayMealsTitle || 'Meals')}</h2>
                        <div class="day-meal-card-list" id="day-meal-card-list-primary">${mealsHtml}</div>
                        ` : ''}
                    </div>
                    <div class="day-plan-column day-plan-column-right" id="day-plan-right-column">
                        ${hasMacroData ? `
                        <div class="day-plan-panel">
                            <div class="instructions-header">${escapeHtml(recipe.dayBreakdownTitle || 'Macronutrient Breakdown')}</div>
                            <div class="day-breakdown-body">
                                ${breakdownSvg}
                                ${createMacroLegendMarkup(recipe.macros)}
                            </div>
                        </div>
                        ` : ''}
                        ${(recipe.dayHighlights || []).length > 0 ? `
                        <div class="day-plan-panel">
                            <div class="instructions-header">${escapeHtml(recipe.dayHighlightsTitle || 'Nutrition Highlights')}</div>
                            ${highlightsHtml}
                        </div>
                        ` : ''}
                        ${(recipe.dayTips || []).length > 0 ? `
                        <div class="day-plan-panel">
                            <div class="instructions-header">${escapeHtml(recipe.dayTipsTitle || 'Tips for Success')}</div>
                            ${tipsHtml}
                        </div>
                        ` : ''}
                        ${notesHtml ? `<div class="day-plan-note">${notesHtml}</div>` : ''}
                    </div>
                </div>
                ${hasMacroData ? `
                <div class="day-totals-section">
                    <h2 class="section-title">${escapeHtml(recipe.dayTotalsTitle || 'Daily Totals')}</h2>
                    <div class="day-totals-card">
                        ${createDayTotalsMarkup(recipe.macros)}
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="page-bottom-margin-guide" aria-hidden="true"></div>
            <div class="page-footer">
                <span class="page-number">${escapeHtml(recipe.pageNumber || '')}</span>
            </div>
        </div>
        <div id="continuation-pages"></div>
    `;

    requestAnimationFrame(() => {
        layoutHeroImageLayers(page);
        paginateDayPlanFlow();
    });
}

function createHeroImageMarkup(recipe) {
    const isPrintFriendly = isPrinterFriendly(recipe);
    const imgSettings = recipe.imageSettings || { scale: 100, posX: 50, posY: 50 };
    const imageHtml = isPrintFriendly
        ? `<div class="hero-print-background"></div>`
        : recipe.image
        ? `<img class="hero-image-layer" src="${escapeHtml(recipe.image)}" alt="${escapeHtml(recipe.title)}" style="--hero-image-zoom: ${imgSettings.scale / 100}; --hero-image-pos-x: ${imgSettings.posX}%; --hero-image-pos-y: ${imgSettings.posY}%;">`
        : `<div class="hero-placeholder">No image uploaded</div>`;

    return `${imageHtml}${createCornerLogoMarkup(recipe)}`;
}

function createCornerLogoMarkup(recipe = {}) {
    const cornerLogoSrc = isPrinterFriendly(recipe) ? 'logo-grayscale.png' : 'logo.png';
    return recipe.showCornerLogo === true
        ? `<div class="hero-corner-logo"><img src="${cornerLogoSrc}" alt="The Vegan Gym"></div>`
        : '';
}

function isPrinterFriendly(recipe = {}) {
    return recipe.pageStyle === 'printer-friendly';
}

function hasAnyMacroData(macros = {}) {
    return ['calories', 'protein', 'carbs', 'fat'].some((key) => String(macros?.[key] || '').trim() !== '');
}

function createMacroBarMarkup(macros = {}, macroBarPrefix = '') {
    const prefix = String(macroBarPrefix || '').trim();
    const prefixHtml = prefix ? `<span class="macro-prefix">${escapeHtml(prefix)}</span>` : '';

    return `
        ${prefixHtml}
        <span>${macros?.calories || '0'} CAL</span>
        <span class="macro-divider">|</span>
        <span>${macros?.protein || '0'} G PROTEIN</span>
        <span class="macro-divider">|</span>
        <span>${macros?.carbs || '0'} G CARBS</span>
        <span class="macro-divider">|</span>
        <span>${macros?.fat || '0'} G FAT</span>
    `;
}

function createDayMealCardMarkup(meal = {}) {
    const mealImage = meal.image
        ? `<img class="day-meal-card-image" src="${escapeHtml(meal.image)}" alt="${escapeHtml(meal.name || meal.mealLabel || 'Meal')}">`
        : `<div class="day-meal-card-image day-meal-card-image--placeholder">No image</div>`;

    return `
        <div class="day-meal-card">
            <div class="day-meal-card-media">${mealImage}</div>
            <div class="day-meal-card-main">
                ${meal.mealLabel ? `<div class="day-meal-card-badge">${escapeHtml(meal.mealLabel)}</div>` : ''}
                <div class="day-meal-card-name">${escapeHtml(meal.name || '')}</div>
                ${meal.portionNote ? `<div class="day-meal-card-portion">${escapeHtml(meal.portionNote)}</div>` : ''}
            </div>
            <div class="day-meal-card-macros">
                <div class="day-meal-card-calories">${escapeHtml(meal.calories || '0')} CAL</div>
                <div class="day-meal-card-macro-line">${escapeHtml(meal.protein || '0')}g protein</div>
                <div class="day-meal-card-macro-line">${escapeHtml(meal.carbs || '0')}g carbs</div>
                <div class="day-meal-card-macro-line">${escapeHtml(meal.fat || '0')}g fat</div>
            </div>
        </div>
    `;
}

function createMacroBreakdownSvg(macros = {}) {
    const calories = parseNumericValue(macros?.calories);
    const protein = parseNumericValue(macros?.protein);
    const carbs = parseNumericValue(macros?.carbs);
    const fat = parseNumericValue(macros?.fat);
    const slices = [
        { value: protein * 4, color: '#4fd67b', label: 'Protein' },
        { value: carbs * 4, color: '#27c3d8', label: 'Carbs' },
        { value: fat * 9, color: '#f04a00', label: 'Fat' }
    ];
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    const center = 90;
    const outerRadius = 81;
    const innerRadius = 43;
    let boundaryAngle = -Math.PI / 2;

    const polarToPoint = (angle, radius) => ({
        x: center + (Math.cos(angle) * radius),
        y: center + (Math.sin(angle) * radius)
    });

    const describeRingSlice = (startAngle, endAngle) => {
        const outerStart = polarToPoint(startAngle, outerRadius);
        const outerEnd = polarToPoint(endAngle, outerRadius);
        const innerEnd = polarToPoint(endAngle, innerRadius);
        const innerStart = polarToPoint(startAngle, innerRadius);
        const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

        return [
            `M ${outerStart.x} ${outerStart.y}`,
            `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
            `L ${innerEnd.x} ${innerEnd.y}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
            'Z'
        ].join(' ');
    };

    const arcs = slices.map((slice) => {
        const portion = total > 0 ? slice.value / total : 1 / slices.length;
        const startAngle = boundaryAngle;
        const endAngle = boundaryAngle + (portion * Math.PI * 2);
        boundaryAngle = endAngle;
        return `<path d="${describeRingSlice(startAngle, endAngle)}" fill="${slice.color}"/>`;
    }).join('');

    boundaryAngle = -Math.PI / 2;
    const separators = total > 0
        ? slices.map((slice) => {
            const currentAngle = boundaryAngle;
            const x1 = center + (Math.cos(currentAngle) * innerRadius);
            const y1 = center + (Math.sin(currentAngle) * innerRadius);
            const x2 = center + (Math.cos(currentAngle) * outerRadius);
            const y2 = center + (Math.sin(currentAngle) * outerRadius);
            boundaryAngle += (slice.value / total) * Math.PI * 2;
            return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ffffff" stroke-width="8" stroke-linecap="butt"/>`;
        }).join('')
        : '';

    return `
        <svg class="day-breakdown-chart" viewBox="0 0 180 180" aria-hidden="true">
            <circle cx="${center}" cy="${center}" r="${outerRadius}" fill="#eceff3"/>
            <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="#ffffff"/>
            ${arcs}
            ${separators}
            <circle cx="${center}" cy="${center}" r="34" fill="#ffffff"/>
            <text x="${center}" y="82" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="800" fill="#2a3140">${escapeHtml(String(macros?.calories || '0'))}</text>
            <text x="${center}" y="106" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="700" fill="#9aa3b2">kcal</text>
        </svg>
    `;
}

function createMacroLegendMarkup(macros = {}) {
    return `
        <div class="day-breakdown-legend">
            <div class="day-breakdown-legend-item"><span class="day-breakdown-dot" style="background:#4fd67b"></span><span>Protein: ${escapeHtml(macros?.protein || '0')}g</span></div>
            <div class="day-breakdown-legend-item"><span class="day-breakdown-dot" style="background:#27c3d8"></span><span>Carbs: ${escapeHtml(macros?.carbs || '0')}g</span></div>
            <div class="day-breakdown-legend-item"><span class="day-breakdown-dot" style="background:#f04a00"></span><span>Fat: ${escapeHtml(macros?.fat || '0')}g</span></div>
        </div>
    `;
}

function createDayListMarkup(items = [], bulletStyle = 'dot') {
    const bullet = bulletStyle === 'star' ? '★' : '●';
    return `
        <div class="day-plan-list">
            ${items.map((item) => `
                <div class="day-plan-list-item">
                    <span class="day-plan-list-bullet">${bullet}</span>
                    <span>${escapeHtml(item)}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function createDayTotalsMarkup(macros = {}) {
    return `
        <div class="day-total-item"><strong>${escapeHtml(macros?.calories || '0')}</strong><span>calories</span></div>
        <div class="day-total-item"><strong>${escapeHtml(macros?.protein || '0')}g</strong><span>protein</span></div>
        <div class="day-total-item"><strong>${escapeHtml(macros?.carbs || '0')}g</strong><span>carbs</span></div>
        <div class="day-total-item"><strong>${escapeHtml(macros?.fat || '0')}g</strong><span>fat</span></div>
    `;
}

function createIngredientNode(ingredient) {
    if (ingredient.type === 'header' || ingredient.type === 'subtitle') {
        const title = document.createElement('h2');
        title.className = `section-title flow-section-title ingredient-inline-label ingredient-inline-label--${ingredient.type}`;
        if (ingredient.type === 'subtitle' && currentRecipe.instructionSubtitleCase === 'preserve') {
            title.classList.add('instruction-subtitle--preserve-case');
        }
        title.textContent = ingredient.text || '';
        return title;
    }

    const item = document.createElement('div');
    item.className = 'ingredient-item';
    item.innerHTML = `
        <span class="ingredient-name-cell">${escapeHtml(ingredient.name)}</span>
        <span class="ingredient-amount-cell">${escapeHtml(ingredient.amount)}</span>
    `;
    return item;
}

function createMaterialsNode(materialsHtml, autoSpacing = true) {
    const wrapper = document.createElement('div');
    wrapper.className = 'materials-section materials-section--flow';
    wrapper.dataset.materialsAutoSpacing = autoSpacing ? 'true' : 'false';
    wrapper.innerHTML = `
        <h2 class="section-title">Materials</h2>
        <div class="materials-icons">
            ${materialsHtml}
        </div>
    `;
    return wrapper;
}

function getPortionVariationIconSvg(selectedIconId = '') {
    if (selectedIconId === 'none') {
        return '';
    }
    const selectedIcon = AVAILABLE_PORTION_VARIATION_ICONS.find(material => material.id === selectedIconId);
    return selectedIcon?.svg || DEFAULT_PORTION_VARIATION_SVG;
}

function createPortionVariationsNode(section) {
    const iconSvg = getPortionVariationIconSvg(section.icon || '');
    const variations = section.variations || [];
    const linkIconPosition = section.linkIconPosition === 'left' ? 'left' : 'right';
    const wrapper = document.createElement('div');
    wrapper.className = 'portion-variations-section portion-variations-section--flow';
    wrapper.innerHTML = `
        <h2 class="section-title">${escapeHtml(section.label || 'Portion Variations')}</h2>
        <div class="portion-variation-cards">
            ${variations.map((variation) => `
                ${buildPortionVariationCardHtml(variation, iconSvg, linkIconPosition)}
            `).join('')}
        </div>
    `;
    return wrapper;
}

function buildPortionVariationCardHtml(variation, iconSvg, linkIconPosition = 'right') {
    const safeUrl = normalizeExternalUrl(variation.url || '');
    const showMacros = variation.showMacros !== false;
    const linkIconHtml = safeUrl ? `
        <span class="portion-variation-card-link-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 5H19V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 14L19 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M19 14V18C19 18.5304 18.7893 19.0391 18.4142 19.4142C18.0391 19.7893 17.5304 20 17 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </span>
    ` : '';
    const contentHtml = `
        <div class="portion-variation-card-serving">
            ${iconSvg ? `<span class="portion-variation-card-icon">${iconSvg}</span>` : ''}
            ${linkIconPosition === 'left' ? linkIconHtml : ''}
            <span class="portion-variation-card-label">${escapeHtml(variation.label || '')}</span>
            ${linkIconPosition === 'left' ? '' : linkIconHtml}
        </div>
        ${showMacros ? `<div class="portion-variation-card-macros">
            <div class="portion-variation-card-macro">
                <span class="portion-variation-card-value">${escapeHtml(variation.calories || '0')}</span>
                <span class="portion-variation-card-unit">cal</span>
            </div>
            <div class="portion-variation-card-macro">
                <span class="portion-variation-card-value">${escapeHtml(variation.protein || '0')}</span>
                <span class="portion-variation-card-unit">pro</span>
            </div>
            <div class="portion-variation-card-macro">
                <span class="portion-variation-card-value">${escapeHtml(variation.carbs || '0')}</span>
                <span class="portion-variation-card-unit">carb</span>
            </div>
            <div class="portion-variation-card-macro">
                <span class="portion-variation-card-value">${escapeHtml(variation.fat || '0')}</span>
                <span class="portion-variation-card-unit">fat</span>
            </div>
            <div class="portion-variation-card-macro">
                <span class="portion-variation-card-value">${escapeHtml(variation.fiber || '0')}</span>
                <span class="portion-variation-card-unit">fiber</span>
            </div>
        </div>` : ''}
    `;
    const cardClass = `portion-variation-card${showMacros ? '' : ' portion-variation-card--no-macros'}`;

    if (safeUrl) {
        return `
            <a class="${cardClass} portion-variation-card--link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">
                ${contentHtml}
            </a>
        `;
    }

    return `
        <div class="${cardClass}">
            ${contentHtml}
        </div>
    `;
}

function createInstructionHeaderNode(text) {
    const header = document.createElement('div');
    header.className = 'instructions-header';
    header.textContent = text;
    return header;
}

function createIngredientsHeaderNode(text) {
    const header = document.createElement('div');
    header.className = 'instructions-header ingredients-header';
    header.textContent = text;
    return header;
}

function createInstructionContinuationHeaderNode() {
    const title = (currentRecipe.title || 'Recipe').trim();
    return createInstructionHeaderNode(`${title} - Directions continued`);
}

function createInstructionPartHeaderNode(text) {
    const title = document.createElement('h2');
    title.className = 'section-title flow-section-title instruction-part-header';
    title.textContent = text;
    return title;
}

function createInstructionSubtitleNode(text) {
    const title = createInstructionPartHeaderNode(text);
    title.classList.add('instruction-subtitle');
    if (currentRecipe.instructionSubtitleCase === 'preserve') {
        title.classList.add('instruction-subtitle--preserve-case');
    }
    return title;
}

function createInstructionNode(step, index, stepStyle = 'numbered') {
    const item = document.createElement('div');
    item.className = 'instruction-item';

    const text = getInstructionStepText(step);
    const checkboxItems = typeof step === 'object' && step.checkboxItems ? step.checkboxItems : null;

    const markerHtml = stepStyle === 'bulleted'
        ? '<span class="instruction-bullet" aria-hidden="true"></span>'
        : `<span class="instruction-number">${index + 1}</span>`;

    let checkboxHtml = '';
    if (checkboxItems && checkboxItems.length > 0) {
        const checkboxListHtml = checkboxItems
            .map(itemText => `
                <div class="instruction-checkbox-item-preview">
                    <span class="checkbox-box">☐</span>
                    <span class="checkbox-text">${escapeHtml(itemText)}</span>
                </div>
            `)
            .join('');
        checkboxHtml = `<div class="instruction-checkbox-list">${checkboxListHtml}</div>`;
    }

    item.innerHTML = `
        ${markerHtml}
        <div class="instruction-text-wrapper">
            <span class="instruction-text">${escapeHtml(text)}</span>
            ${checkboxHtml}
        </div>
    `;
    return item;
}

function createInstructionFlowNode(step, index, stepStyle = 'numbered') {
    if (isInstructionHeaderStep(step)) {
        if (getInstructionLabelType(step) === 'subtitle') {
            return createInstructionSubtitleNode(getInstructionStepText(step));
        }
        return createInstructionPartHeaderNode(getInstructionStepText(step));
    }

    return createInstructionNode(step, index, stepStyle);
}

function createEmptyStateNode(text, type = 'plain') {
    const item = document.createElement('div');
    item.className = `flow-empty-state ${type === 'instruction' ? 'instruction-item' : 'ingredient-item'}`;
    item.innerHTML = `<span style="color:#999;">${escapeHtml(text)}</span>`;
    return item;
}

function createNoteNode(noteHtml) {
    const wrapper = document.createElement('div');
    wrapper.className = 'note-section-wrapper';
    wrapper.innerHTML = noteHtml;
    return wrapper;
}

function createDayMealsOverflowSection(titleText = '', options = {}) {
    const section = document.createElement('div');
    section.className = 'day-meals-overflow-section';

    if (titleText || options.reserveTitleSpace) {
        const title = document.createElement('h2');
        title.className = `section-title${options.reserveTitleSpace && !titleText ? ' section-title--ghost' : ''}`;
        title.textContent = titleText || currentRecipe.dayMealsTitle || 'Meals';
        section.appendChild(title);
    }

    const list = document.createElement('div');
    list.className = 'day-meal-card-list';
    section.appendChild(list);

    return { section, list };
}

function createContinuationPage(pageNumberText = '') {
    const pageNumberMarkup = pageNumberText ? `<span class="page-number">${escapeHtml(pageNumberText)}</span>` : '';
    const printerFriendly = isPrinterFriendly(currentRecipe);
    const heroHeight = printerFriendly ? getPrinterFriendlyHeroHeight(currentRecipe) : (Number.parseInt(currentRecipe.heroHeight, 10) || 309);
    const titleFontSize = Number.parseInt(currentRecipe.titleFontSize, 10) || 40;
    const contentSpacing = getContinuationContentSpacing(currentRecipe);
    const heroImageHtml = createHeroImageMarkup(currentRecipe);
    const printerContinuationLogo = printerFriendly ? createCornerLogoMarkup(currentRecipe) : '';
    const continuationTitle = escapeHtml(currentRecipe.title || 'Recipe Title');

    return `
        <div class="recipe-page recipe-page--continuation${printerFriendly ? ' printer-friendly-page' : ''}" style="--continuation-content-spacing: ${contentSpacing}px;">
            ${printerContinuationLogo}
            <div class="hero-section hero-section--continuation" style="height: ${heroHeight}px;">
                ${heroImageHtml}
                <div class="hero-overlay"></div>
                <h1 class="recipe-title" style="font-size: ${titleFontSize}px;">${continuationTitle}</h1>
            </div>
            <div class="content-area content-area--continuation">
                <div class="page-flow-grid">
                    <div class="flow-column" data-flow-slot="continuation-left"></div>
                    <div class="flow-column" data-flow-slot="continuation-right"></div>
                </div>
            </div>
            <div class="page-bottom-margin-guide" aria-hidden="true"></div>
            <div class="page-footer">
                ${pageNumberMarkup}
            </div>
        </div>
    `;
}

function getContinuationPageNumber(basePageNumber, pageOffset) {
    if (!basePageNumber) {
        return '';
    }

    const numericPage = Number.parseInt(basePageNumber, 10);
    if (Number.isNaN(numericPage)) {
        return basePageNumber;
    }

    return String(numericPage + pageOffset);
}

function canFitNode(slot, maxHeight, node) {
    slot.appendChild(node);
    const fits = slot.scrollHeight <= maxHeight || slot.children.length === 1;
    slot.removeChild(node);
    return fits;
}

function canFitNodeGroup(slot, maxHeight, nodes) {
    nodes.forEach((node) => slot.appendChild(node));
    const fits = slot.scrollHeight <= maxHeight || slot.children.length === nodes.length;
    nodes.forEach((node) => slot.removeChild(node));
    return fits;
}

function getPageContentCutoffTop(page, fallbackFooter, bottomMargin = getPageBottomMargin()) {
    const footerTop = fallbackFooter?.offsetTop ?? page?.offsetHeight ?? 0;
    return Math.max(0, footerTop - bottomMargin);
}

function getFlowSlotHeight(page, grid, fallbackFooter, bottomMargin = getPageBottomMargin()) {
    const cutoffTop = getPageContentCutoffTop(page, fallbackFooter, bottomMargin);
    return Math.max(0, cutoffTop - (grid?.offsetTop || 0));
}

function updateBottomMarginGuidePosition(page, fallbackFooter, bottomMargin = getPageBottomMargin()) {
    if (!page) {
        return;
    }

    const cutoffTop = getPageContentCutoffTop(page, fallbackFooter, bottomMargin);
    const guideBottom = Math.max(0, (page.offsetHeight || 0) - cutoffTop);
    page.style.setProperty('--page-bottom-margin-guide-bottom', `${guideBottom}px`);
}

function paginateRecipeFlow(noteHtml = '') {
    const pageStack = elements.recipePage();
    const primaryPage = pageStack?.querySelector('.page-primary');
    const primaryGrid = document.getElementById('page-flow-grid');
    const slot1 = document.getElementById('flow-slot-1');
    const slot2 = document.getElementById('flow-slot-2');
    const continuationPages = document.getElementById('continuation-pages');
    const footer = primaryPage?.querySelector('.page-footer');

    if (!pageStack || !primaryPage || !primaryGrid || !slot1 || !slot2 || !continuationPages || !footer) {
        return;
    }

    slot1.innerHTML = '';
    slot2.innerHTML = '';
    continuationPages.innerHTML = '';

    const pageBottomMargin = getPageBottomMargin();
    updateBottomMarginGuidePosition(primaryPage, footer, pageBottomMargin);

    const primarySlotHeight = getFlowSlotHeight(primaryPage, primaryGrid, footer, pageBottomMargin);

    slot1.style.maxHeight = `${primarySlotHeight}px`;
    slot2.style.maxHeight = `${primarySlotHeight}px`;

    const slots = [
        { element: slot1, maxHeight: primarySlotHeight, pageIndex: 0, columnIndex: 0 },
        { element: slot2, maxHeight: primarySlotHeight, pageIndex: 0, columnIndex: 1 }
    ];

    let currentSlotIndex = 0;

    function ensureContinuationSlot() {
        const pageOffset = continuationPages.children.length + 1;
        continuationPages.insertAdjacentHTML(
            'beforeend',
            createContinuationPage(getContinuationPageNumber(currentRecipe.pageNumber, pageOffset))
        );

        const continuationPage = continuationPages.lastElementChild;
        const continuationFooter = continuationPage?.querySelector('.page-footer');
        const continuationLeftSlot = continuationPage?.querySelector('[data-flow-slot="continuation-left"]');
        const continuationRightSlot = continuationPage?.querySelector('[data-flow-slot="continuation-right"]');

        if (!continuationPage || !continuationLeftSlot || !continuationRightSlot || !continuationFooter) {
            return null;
        }

        const continuationGrid = continuationPage.querySelector('.page-flow-grid');
        updateBottomMarginGuidePosition(continuationPage, continuationFooter, pageBottomMargin);
        const continuationHeight = getFlowSlotHeight(continuationPage, continuationGrid, continuationFooter, pageBottomMargin);

        continuationLeftSlot.style.maxHeight = `${continuationHeight}px`;
        continuationRightSlot.style.maxHeight = `${continuationHeight}px`;

        const pageIndex = pageOffset;
        const leftSlotConfig = { element: continuationLeftSlot, maxHeight: continuationHeight, pageIndex, columnIndex: 0 };
        const rightSlotConfig = { element: continuationRightSlot, maxHeight: continuationHeight, pageIndex, columnIndex: 1 };

        slots.push(leftSlotConfig, rightSlotConfig);
        return leftSlotConfig;
    }

    function getCurrentSlot() {
        while (!slots[currentSlotIndex]) {
            ensureContinuationSlot();
        }
        return slots[currentSlotIndex];
    }

    function advanceSlot() {
        currentSlotIndex += 1;
        if (!slots[currentSlotIndex]) {
            ensureContinuationSlot();
        }
        return slots[currentSlotIndex];
    }

    function placeNode(factory) {
        let slot = getCurrentSlot();
        let node = factory();

        if (!canFitNode(slot.element, slot.maxHeight, node) && slot.element.children.length > 0) {
            slot = advanceSlot();
            node = factory();
        }

        slot.element.appendChild(node);
    }

    function isContinuationSlot(slot) {
        return slot.pageIndex > 0;
    }

    const instructionContinuationHeadersAdded = new Set();
    let instructionFlowStarted = false;

    function ensureInstructionContinuationHeader() {
        const slot = getCurrentSlot();
        if (currentRecipe.showDirectionsContinuedHeader === false || !instructionFlowStarted || !isContinuationSlot(slot) || slot.columnIndex !== 0 || slot.element.children.length > 0) {
            return;
        }

        const headerKey = `page-${slot.pageIndex}`;
        if (instructionContinuationHeadersAdded.has(headerKey)) {
            return;
        }

        slot.element.appendChild(createInstructionContinuationHeaderNode());
        instructionContinuationHeadersAdded.add(headerKey);
    }

    function placeInstructionNode(factory) {
        ensureInstructionContinuationHeader();
        let slot = getCurrentSlot();
        let node = factory();

        if (!canFitNode(slot.element, slot.maxHeight, node) && slot.element.children.length > 0) {
            slot = advanceSlot();
            ensureInstructionContinuationHeader();
            slot = getCurrentSlot();
            node = factory();
        }

        slot.element.appendChild(node);
        instructionFlowStarted = true;
    }

    const ingredientSections = getIngredientSectionsForForm(currentRecipe)
        .filter((section) => section.ingredients.length > 0);
    const portionVariationSections = getPortionVariationSectionsForForm(currentRecipe)
        .filter((section) => section.variations.length > 0);
    const instructionSections = getInstructionSectionsForForm(currentRecipe)
        .filter(section => section.steps.length > 0);
    const materialsLayout = currentRecipe.materialsLayout || 'column';
    const materialsAutoSpacing = currentRecipe.materialsAutoSpacing === true;
    const materialsHtml = currentRecipe.showMaterials !== false ? (currentRecipe.materials || []).map((materialId) => {
        const material = AVAILABLE_MATERIALS.find(m => m.id === materialId);
        if (!material) return '';
        return `<div class="material-icon-item" title="${material.name}">${material.svg}</div>`;
    }).join('') : '';

    if (materialsLayout === 'column' && materialsHtml) {
        placeNode(() => createMaterialsNode(materialsHtml, materialsAutoSpacing));
    }

    portionVariationSections.forEach((section) => {
        placeNode(() => createPortionVariationsNode(section));
    });

    function applyIngredientStartMode(startMode) {
        if (startMode !== 'force-right-column') {
            return;
        }

        const slot = getCurrentSlot();
        if (slot.columnIndex === 0 && slot.element.children.length > 0) {
            advanceSlot();
        }
    }

    ingredientSections.forEach((section) => {
        applyIngredientStartMode(section.startMode || 'auto');

        if (section === ingredientSections[0] && currentRecipe.showIngredientsHeader !== false) {
            placeNode(() => createIngredientsHeaderNode(currentRecipe.servingsLabel || section.label || 'Ingredients for 1 Serving'));
        }

        const sectionLabel = section.label || '';
        const mainLabel = currentRecipe.servingsLabel || '';
        const shouldShowSetHeader = sectionLabel && sectionLabel !== mainLabel && ingredientSections.length > 1;
        if (shouldShowSetHeader) {
            placeNode(() => {
                const title = document.createElement('h2');
                title.className = 'section-title flow-section-title';
                title.textContent = sectionLabel;
                return title;
            });
        }

        section.ingredients.forEach((ingredient) => {
            placeNode(() => createIngredientNode(ingredient));
        });
    });

    function shouldShowInstructionSetHeader(sectionLabel) {
        const normalizedSectionLabel = String(sectionLabel || '').trim();
        const normalizedMainLabel = String(currentRecipe.instructionsLabel || '').trim();
        return normalizedSectionLabel && normalizedSectionLabel !== normalizedMainLabel;
    }

    function applyInstructionStartMode(startMode) {
        if (startMode === 'force-next-page') {
            const startingPageIndex = getCurrentSlot().pageIndex;
            let slot = getCurrentSlot();
            while (slot.pageIndex <= startingPageIndex || slot.columnIndex !== 0) {
                slot = advanceSlot();
            }
            return;
        }

        if (startMode === 'force-right-column') {
            const slot = getCurrentSlot();
            if (slot.columnIndex === 0 && slot.element.children.length > 0) {
                advanceSlot();
            }
            return;
        }
    }

    if (instructionSections.length > 0) {
        instructionSections.forEach((section, sectionIndex) => {
            const stepStyle = section.stepStyle || 'numbered';
            const includeMainHeader = sectionIndex === 0;
            const sectionLabel = shouldShowInstructionSetHeader(section.label) ? section.label : '';
            applyInstructionStartMode(normalizeInstructionStartMode(section.startMode));

            if (includeMainHeader && currentRecipe.showInstructionsHeader !== false) {
                placeInstructionNode(() => createInstructionHeaderNode(currentRecipe.instructionsLabel || 'Instructions for 1 Serving'));
            }

            if (sectionLabel) {
                placeInstructionNode(() => createInstructionPartHeaderNode(sectionLabel));
            }

            let visibleStepIndex = 0;
            section.steps.forEach((instruction) => {
                if (isInstructionHeaderStep(instruction)) {
                    placeInstructionNode(() => createInstructionFlowNode(instruction, 0, stepStyle));
                    visibleStepIndex = 0;
                    return;
                }

                const stepIndex = visibleStepIndex;
                visibleStepIndex += 1;
                placeInstructionNode(() => createInstructionFlowNode(instruction, stepIndex, stepStyle));
            });
        });
    }

    if (noteHtml) {
        placeNode(() => createNoteNode(noteHtml));
    }

    layoutHeroImageLayers(pageStack);
}

function paginateDayPlanFlow() {
    const pageStack = elements.recipePage();
    const primaryPage = pageStack?.querySelector('.day-plan-page');
    const grid = document.getElementById('day-plan-grid');
    const leftColumn = document.getElementById('day-plan-left-column');
    const rightColumn = document.getElementById('day-plan-right-column');
    const primaryList = document.getElementById('day-meal-card-list-primary');
    const continuationPages = document.getElementById('continuation-pages');
    const footer = primaryPage?.querySelector('.page-footer');
    const totalsSection = primaryPage?.querySelector('.day-totals-section');

    if (!pageStack || !primaryPage || !grid || !leftColumn || !rightColumn || !primaryList || !continuationPages || !footer) {
        return;
    }

    continuationPages.innerHTML = '';
    rightColumn.querySelectorAll('.day-meals-overflow-section').forEach((section) => section.remove());
    grid.classList.remove('day-plan-grid--meal-overflow');

    const pageBottomMargin = getPageBottomMargin();
    const primaryFallback = totalsSection || footer;
    updateBottomMarginGuidePosition(primaryPage, primaryFallback, pageBottomMargin);
    const primaryMaxHeight = getFlowSlotHeight(primaryPage, grid, primaryFallback, pageBottomMargin);

    leftColumn.style.maxHeight = `${primaryMaxHeight}px`;
    rightColumn.style.maxHeight = `${primaryMaxHeight}px`;

    if (leftColumn.scrollHeight <= primaryMaxHeight) {
        return;
    }

    const overflowCards = [];
    while (leftColumn.scrollHeight > primaryMaxHeight && primaryList.lastElementChild) {
        overflowCards.unshift(primaryList.removeChild(primaryList.lastElementChild));
    }

    if (overflowCards.length === 0) {
        return;
    }

    grid.classList.add('day-plan-grid--meal-overflow');

    const slots = [
        { element: rightColumn, maxHeight: primaryMaxHeight, pageIndex: 0, columnIndex: 1, list: null, section: null }
    ];
    let currentSlotIndex = 0;

    function ensureContinuationDaySlots() {
        const pageOffset = continuationPages.children.length + 1;
        continuationPages.insertAdjacentHTML(
            'beforeend',
            createContinuationPage(getContinuationPageNumber(currentRecipe.pageNumber, pageOffset))
        );

        const continuationPage = continuationPages.lastElementChild;
        const continuationFooter = continuationPage?.querySelector('.page-footer');
        const continuationGrid = continuationPage?.querySelector('.page-flow-grid');
        const continuationLeftSlot = continuationPage?.querySelector('[data-flow-slot="continuation-left"]');
        const continuationRightSlot = continuationPage?.querySelector('[data-flow-slot="continuation-right"]');

        if (!continuationPage || !continuationFooter || !continuationGrid || !continuationLeftSlot || !continuationRightSlot) {
            return;
        }

        updateBottomMarginGuidePosition(continuationPage, continuationFooter, pageBottomMargin);
        const continuationMaxHeight = getFlowSlotHeight(continuationPage, continuationGrid, continuationFooter, pageBottomMargin);
        continuationLeftSlot.style.maxHeight = `${continuationMaxHeight}px`;
        continuationRightSlot.style.maxHeight = `${continuationMaxHeight}px`;

        slots.push(
            { element: continuationLeftSlot, maxHeight: continuationMaxHeight, pageIndex: pageOffset, columnIndex: 0, list: null, section: null },
            { element: continuationRightSlot, maxHeight: continuationMaxHeight, pageIndex: pageOffset, columnIndex: 1, list: null, section: null }
        );
    }

    function getCurrentSlot() {
        while (!slots[currentSlotIndex]) {
            ensureContinuationDaySlots();
        }
        return slots[currentSlotIndex];
    }

    function advanceSlot() {
        currentSlotIndex += 1;
        if (!slots[currentSlotIndex]) {
            ensureContinuationDaySlots();
        }
        return slots[currentSlotIndex];
    }

    function ensureOverflowSection(slot) {
        if (slot.list && slot.section) {
            return slot;
        }

        const titleText = slot.pageIndex > 0 && slot.columnIndex === 0
            ? `${currentRecipe.dayMealsTitle || 'Meals'} Continued`
            : '';
        const { section, list } = createDayMealsOverflowSection(titleText, {
            reserveTitleSpace: slot.pageIndex === 0 && slot.columnIndex === 1
        });
        slot.section = section;
        slot.list = list;
        slot.element.appendChild(section);
        return slot;
    }

    function tryAppendCardToSlot(slot, card) {
        const hadSection = Boolean(slot.section);
        ensureOverflowSection(slot);
        slot.list.appendChild(card);
        const fits = slot.element.scrollHeight <= slot.maxHeight
            || (slot.element.children.length === 1 && slot.list.children.length === 1);

        if (fits) {
            return true;
        }

        slot.list.removeChild(card);
        if (!hadSection && slot.section) {
            slot.section.remove();
            slot.section = null;
            slot.list = null;
        }
        return false;
    }

    overflowCards.forEach((card) => {
        let slot = getCurrentSlot();
        if (!tryAppendCardToSlot(slot, card)) {
            slot = advanceSlot();
            while (!tryAppendCardToSlot(slot, card)) {
                slot = advanceSlot();
            }
        }
    });

    layoutHeroImageLayers(pageStack);
}

// ================================================
// ACTION HANDLERS
// ================================================

/**
 * Handle JPG export (A4 at 300 DPI = 2480x3508 pixels)
 */
async function handleExportJpg(options = {}) {
    const recipePageStack = elements.recipePage();
    const recipePages = Array.from(recipePageStack?.querySelectorAll('.recipe-page') || []);
    const exportBtn = options?.exportButton || elements.btnExportJpg();
    const shouldManageButtonState = options?.manageButtonState !== false;

    if (typeof html2canvas !== 'function') {
        alert('JPG export is unavailable because html2canvas did not load.');
        return;
    }

    // Show loading state
    const originalText = exportBtn?.textContent || 'Export JPG';
    if (shouldManageButtonState && exportBtn) {
        exportBtn.textContent = 'Exporting...';
        exportBtn.disabled = true;
    }

    try {
        if (recipePages.length === 0) {
            throw new Error('No recipe pages found for JPG export.');
        }

        const brandPrimary = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-primary')
            .trim() || '#42d53b';
        const printerFriendly = isPrinterFriendly(currentRecipe);
        const macroBarColor = printerFriendly ? '#d9d9d9' : brandPrimary;
        const recipeTitleColor = printerFriendly ? '#222222' : '#ffffff';

        const baseFilename = getExportTitle();

        for (let pageIndex = 0; pageIndex < recipePages.length; pageIndex += 1) {
            const recipePage = recipePages[pageIndex];

            // Use the page's natural box size, not the zoomed preview size.
            const cssPageWidth = recipePage.offsetWidth || Math.round(recipePage.getBoundingClientRect().width);
            const cssPageHeight = recipePage.offsetHeight || Math.round(recipePage.getBoundingClientRect().height);

            // Target export dimensions (locked)
            const targetWidth = 2480;
            const targetHeight = 3508;

            // Scale ratio for html2canvas
            const scaleRatio = Math.max(targetWidth / cssPageWidth, targetHeight / cssPageHeight);

            // Create a clone for export
            const exportContainer = document.createElement('div');
            exportContainer.style.position = 'absolute';
            exportContainer.style.left = '-9999px';
            exportContainer.style.top = '0';
            exportContainer.style.overflow = 'hidden';
            exportContainer.style.backgroundColor = '#ffffff';

            const clone = recipePage.cloneNode(true);
            // Lock to CSS page dimensions to maintain proper layout
            clone.style.width = `${cssPageWidth}px`;
            clone.style.minWidth = `${cssPageWidth}px`;
            clone.style.maxWidth = `${cssPageWidth}px`;
            clone.style.height = `${cssPageHeight}px`;
            clone.style.minHeight = `${cssPageHeight}px`;
            clone.style.maxHeight = `${cssPageHeight}px`;
            clone.style.transform = 'none';
            clone.style.position = 'relative';
            clone.style.margin = '0';
            clone.style.boxShadow = 'none';
            clone.querySelectorAll('.page-bottom-margin-guide').forEach((guide) => guide.remove());

            // Fix hero image for export. html2canvas is unreliable with object-fit on img tags.
            const heroImage = clone.querySelector('.hero-image, .hero-image-layer');
            if (heroImage) {
                const imgSettings = currentRecipe.imageSettings || { scale: 100, posX: 50, posY: 50 };
                const heroImageExport = document.createElement('div');
                heroImageExport.className = 'hero-image hero-image-export';
                heroImageExport.style.backgroundImage = `url("${currentRecipe.image}")`;
                heroImageExport.style.backgroundRepeat = 'no-repeat';
                heroImageExport.style.backgroundSize = 'cover';
                heroImageExport.style.backgroundPosition = `${imgSettings.posX}% ${imgSettings.posY}%`;
                heroImageExport.style.transform = `scale(${imgSettings.scale / 100})`;
                heroImageExport.style.transformOrigin = 'center center';
                heroImageExport.style.position = 'absolute';
                heroImageExport.style.inset = '0';

                heroImage.replaceWith(heroImageExport);
            }

            if (printerFriendly) {
                clone.querySelectorAll('.hero-overlay').forEach((overlay) => overlay.remove());
            }

            // Apply bold text styles and force light mode for export
            const styleTag = document.createElement('style');
            styleTag.textContent = `
                .description-text,
                .ingredient-name-cell,
                .ingredient-amount-cell,
                .instruction-text,
                .note-text {
                    font-weight: 600 !important;
                }
                /* Force light mode colors for export */
                .recipe-page { background: #ffffff !important; }
                .recipe-title { color: ${recipeTitleColor} !important; }
                .hero-print-background { background: #ffffff !important; }
                .macro-bar-content { background: ${macroBarColor} !important; color: #000000 !important; position: relative !important; }
                .macro-bar-content span { color: #000000 !important; position: relative !important; z-index: 1 !important; }
                .macro-bar-content .macro-divider { color: #000000 !important; }
                .description-text { color: #424242 !important; }
                .section-title { color: #000000 !important; }
                .ingredient-name-cell, .ingredient-amount-cell { color: #424242 !important; }
                .ingredient-item { border-bottom-color: #E0E0E0 !important; }
                .instruction-number { background: #b2b2b2 !important; color: #000000 !important; }
                .instructions-header { background: #000000 !important; color: #ffffff !important; }
                .instruction-text, .checkbox-text, .checkbox-box { color: #000000 !important; }
                .note-callout { background: #dbdbdb !important; }
                .note-text { color: #616161 !important; }
                .page-number { color: #424242 !important; }
                .description-section { border-bottom-color: #E0E0E0 !important; }
            `;
            clone.appendChild(styleTag);

            exportContainer.appendChild(clone);
            document.body.appendChild(exportContainer);

            // Wait for fonts and images to load
            await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 100));

            const scaleX = targetWidth / cssPageWidth;
            const scaleY = targetHeight / cssPageHeight;
            const mealImageRects = Array.from(clone.querySelectorAll('.day-meal-card-image'))
                .map((mealImage) => {
                    const mealImageSrc = mealImage.getAttribute('src');
                    if (!mealImageSrc) {
                        return null;
                    }

                    const media = mealImage.closest('.day-meal-card-media');
                    if (!media) {
                        return null;
                    }

                    const cloneRect = clone.getBoundingClientRect();
                    const mediaRect = media.getBoundingClientRect();
                    const borderRadius = parseFloat(getComputedStyle(media).borderTopLeftRadius || '0') || 0;

                    const placeholder = document.createElement('div');
                    placeholder.className = 'day-meal-card-image day-meal-card-image-export-placeholder';
                    placeholder.style.width = '100%';
                    placeholder.style.height = '100%';
                    placeholder.style.display = 'block';
                    placeholder.style.background = getComputedStyle(media).backgroundColor || '#edf1f5';
                    placeholder.style.borderRadius = 'inherit';
                    mealImage.replaceWith(placeholder);

                    return {
                        src: mealImageSrc,
                        x: (mediaRect.left - cloneRect.left) * scaleX,
                        y: (mediaRect.top - cloneRect.top) * scaleY,
                        width: mediaRect.width * scaleX,
                        height: mediaRect.height * scaleY,
                        radius: borderRadius * scaleX
                    };
                })
                .filter(Boolean);

            const heroSection = clone.querySelector('.hero-section');
            const macroBar = clone.querySelector('.macro-bar');
            const cornerLogo = clone.querySelector('.hero-corner-logo');
            let cornerLogoRect = null;
            if (cornerLogo) {
                const cloneRect = clone.getBoundingClientRect();
                const logoRect = cornerLogo.getBoundingClientRect();
                cornerLogoRect = {
                    x: (logoRect.left - cloneRect.left) * scaleX,
                    y: (logoRect.top - cloneRect.top) * scaleY,
                    width: logoRect.width * scaleX,
                    height: logoRect.height * scaleY
                };
                cornerLogo.remove();
            }
            const heroSectionHeight = heroSection?.offsetHeight || 0;
            const heroRect = heroSection && heroSectionHeight > 0 ? {
                x: 0,
                y: 0,
                width: heroSection.offsetWidth * scaleX,
                height: heroSectionHeight * scaleY
            } : null;
            const restoreFromY = macroBar
                ? Math.max(0, macroBar.offsetTop * scaleY)
                : null;
            const restoreFromCanvasY = macroBar
                ? Math.max(0, macroBar.offsetTop * scaleRatio)
                : null;

            const heroOverlayCanvas = !printerFriendly && heroSection
                ? await createHeroOverlayCanvas(heroSection, scaleRatio)
                : null;

            // Capture with html2canvas - scale up from natural size to target
            const canvas = await html2canvas(clone, {
                scale: scaleRatio,
                useCORS: true,
                backgroundColor: '#ffffff',
                width: cssPageWidth,
                height: cssPageHeight,
                windowWidth: cssPageWidth,
                windowHeight: cssPageHeight
            });

            // Remove the temporary container
            document.body.removeChild(exportContainer);

            // Resize canvas to exact target dimensions
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = targetWidth;
            finalCanvas.height = targetHeight;
            const ctx = finalCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

            if (!printerFriendly && currentRecipe.image && heroRect) {
                try {
                    const sourceHeroImage = await loadImageElement(currentRecipe.image);
                    drawHeroImageToCanvas(ctx, sourceHeroImage, heroRect, currentRecipe.imageSettings || { scale: 100, posX: 50, posY: 50 });

                    if (heroOverlayCanvas) {
                        ctx.drawImage(heroOverlayCanvas, heroRect.x, heroRect.y, heroRect.width, heroRect.height);
                    }
                } catch (heroError) {
                    console.warn('Unable to redraw original hero image at export resolution.', heroError);
                }
            }

            if (cornerLogoRect && currentRecipe.showCornerLogo === true) {
                try {
                    const cornerLogoImage = await loadImageElement(printerFriendly ? 'logo-grayscale.png' : 'logo.png');
                    drawCornerLogoToCanvas(ctx, cornerLogoImage, cornerLogoRect, { printerFriendly });
                } catch (cornerLogoError) {
                    console.warn('Unable to redraw corner logo at export resolution.', cornerLogoError);
                }
            }

            if (macroBar && restoreFromY !== null && restoreFromCanvasY !== null) {
                ctx.drawImage(
                    canvas,
                    0,
                    restoreFromCanvasY,
                    canvas.width,
                    canvas.height - restoreFromCanvasY,
                    0,
                    restoreFromY,
                    targetWidth,
                    targetHeight - restoreFromY
                );
            }

            const mealImageCache = new Map();
            for (const mealImageRect of mealImageRects) {
                try {
                    if (!mealImageCache.has(mealImageRect.src)) {
                        mealImageCache.set(mealImageRect.src, await loadImageElement(mealImageRect.src));
                    }

                    drawCoverImageToCanvas(
                        ctx,
                        mealImageCache.get(mealImageRect.src),
                        mealImageRect,
                        { radius: mealImageRect.radius }
                    );
                } catch (mealImageError) {
                    console.warn('Unable to redraw meal image at export resolution.', mealImageError);
                }
            }

            // Convert to JPG and download
            const jpgDataUrl = finalCanvas.toDataURL('image/jpeg', 1);
            const link = document.createElement('a');
            link.href = jpgDataUrl;
            link.download = recipePages.length === 1
                ? `${baseFilename}.jpg`
                : `${baseFilename} - Page ${pageIndex + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (error) {
        console.error('Export error:', error);
        if (options?.rethrow === true) {
            throw error;
        }
        alert('Error exporting image. Please try again.');
    } finally {
        // Restore button state
        if (shouldManageButtonState && exportBtn) {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
    }
}

function waitForPreviewRender() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
        });
    });
}

async function handleExportAll() {
    const exportBtn = elements.btnExportAll();
    const originalText = exportBtn?.textContent || 'Export All';
    const originalRecipe = JSON.parse(JSON.stringify(currentRecipe));
    const variants = [
        { pageStyle: 'standard', showMacroBar: true, clearHeroImage: false },
        { pageStyle: 'standard', showMacroBar: false, clearHeroImage: false },
        { pageStyle: 'printer-friendly', showMacroBar: true, clearHeroImage: true },
        { pageStyle: 'printer-friendly', showMacroBar: false, clearHeroImage: true }
    ];

    if (exportBtn) {
        exportBtn.disabled = true;
    }

    try {
        for (let index = 0; index < variants.length; index += 1) {
            const variant = variants[index];
            if (exportBtn) {
                exportBtn.textContent = `Exporting ${index + 1}/4...`;
            }

            currentRecipe = normalizeRecipe({
                ...originalRecipe,
                pageStyle: variant.pageStyle,
                showMacroBar: variant.showMacroBar,
                image: variant.clearHeroImage ? '' : originalRecipe.image
            });
            loadRecipeToForm(currentRecipe);
            renderRecipePage();
            await waitForPreviewRender();
            await handleExportJpg({
                exportButton: exportBtn,
                manageButtonState: false,
                rethrow: true
            });
        }
    } catch (error) {
        console.error('Export all error:', error);
        alert('Error exporting all recipe versions. Please try again.');
    } finally {
        currentRecipe = normalizeRecipe(originalRecipe);
        loadRecipeToForm(currentRecipe);
        renderRecipePage();

        if (exportBtn) {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }
    }
}

// ================================================
// MASTER PASTE FUNCTIONALITY
// ================================================

function initializeMasterPasteAiControls() {
    const dropzone = elements.masterPasteAiDropzone();
    const fileInput = elements.masterPasteAiImages();

    elements.btnMasterPasteAiImages()?.addEventListener('click', () => {
        fileInput?.click();
    });

    fileInput?.addEventListener('change', (event) => {
        addMasterPasteAiFiles(Array.from(event.target.files || []));
        event.target.value = '';
    });

    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (event) => {
            event.preventDefault();
            dropzone.classList.add('is-drag-over');
        });
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('is-drag-over');
    });

    dropzone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropzone.classList.remove('is-drag-over');

        const imageFiles = getImageFilesFromTransfer(event.dataTransfer);
        if (imageFiles.length) {
            addMasterPasteAiFiles(imageFiles);
            return;
        }

        const droppedText = event.dataTransfer?.getData('text/plain') || '';
        if (droppedText.trim()) {
            insertTextIntoMasterPasteAiSource(droppedText);
        }
    });

    dropzone.addEventListener('paste', (event) => {
        const imageFiles = getImageFilesFromTransfer(event.clipboardData);
        if (!imageFiles.length) return;

        event.preventDefault();
        addMasterPasteAiFiles(imageFiles);
    });
}

function getImageFilesFromTransfer(transfer) {
    if (!transfer) return [];

    const itemFiles = Array.from(transfer.items || [])
        .filter((item) => item.kind === 'file')
        .map((item) => item.getAsFile())
        .filter(Boolean);

    const files = itemFiles.length ? itemFiles : Array.from(transfer.files || []);
    return files.filter((file) => file.type.startsWith('image/'));
}

function insertTextIntoMasterPasteAiSource(text) {
    const textarea = elements.masterPasteAiSource();
    if (!textarea) return;

    const currentValue = textarea.value;
    const start = textarea.selectionStart ?? currentValue.length;
    const end = textarea.selectionEnd ?? currentValue.length;
    const spacerBefore = start > 0 && currentValue[start - 1] !== '\n' ? '\n' : '';
    const spacerAfter = end < currentValue.length && currentValue[end] !== '\n' ? '\n' : '';

    textarea.value = `${currentValue.slice(0, start)}${spacerBefore}${text}${spacerAfter}${currentValue.slice(end)}`;
    const cursorPosition = start + spacerBefore.length + text.length;
    textarea.focus();
    textarea.setSelectionRange(cursorPosition, cursorPosition);
}

function addMasterPasteAiFiles(files = []) {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    masterPasteAiImages = [...masterPasteAiImages, ...imageFiles].slice(0, 6);
    renderMasterPasteAiFiles();
}

function renderMasterPasteAiFiles() {
    const container = elements.masterPasteAiFiles();
    if (!container) return;

    container.innerHTML = masterPasteAiImages.map((file, index) => `
        <span class="master-paste-ai-file">
            ${escapeHtml(file.name || `Image ${index + 1}`)}
            <button type="button" data-remove-ai-image="${index}" aria-label="Remove ${escapeHtml(file.name || `Image ${index + 1}`)}">&times;</button>
        </span>
    `).join('');

    container.querySelectorAll('[data-remove-ai-image]').forEach((button) => {
        button.addEventListener('click', () => {
            const index = Number.parseInt(button.dataset.removeAiImage, 10);
            masterPasteAiImages.splice(index, 1);
            renderMasterPasteAiFiles();
        });
    });
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error || new Error(`Unable to read ${file.name}`));
        reader.readAsDataURL(file);
    });
}

async function handleGenerateMasterPasteAi() {
    const statusEl = elements.masterPasteStatus();
    const button = elements.btnGenerateMasterPasteAi();
    const sourceText = elements.masterPasteAiSource()?.value.trim() || '';

    if (!sourceText && masterPasteAiImages.length === 0) {
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = 'Add recipe text, images, or both before generating.';
        return;
    }

    const originalText = button?.textContent || 'Generate With AI';

    try {
        if (button) {
            button.disabled = true;
            button.textContent = 'Generating...';
        }

        statusEl.className = 'master-paste-status';
        statusEl.textContent = '';

        const images = await Promise.all(masterPasteAiImages.map(async (file) => ({
            name: file.name,
            type: file.type,
            dataUrl: await fileToDataUrl(file)
        })));

        const response = await fetch('/api/generate-master-paste', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: sourceText, images })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to generate structured recipe data.');
        }

        elements.masterPaste().value = data.text || '';
        statusEl.className = 'master-paste-status success';
        statusEl.textContent = 'AI structured data generated. Review it, then click Fill All.';
    } catch (error) {
        console.error('AI generation error:', error);
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = error.message || 'Unable to generate structured recipe data.';
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}

/**
 * Parse master paste text into recipe data
 */
function parseMasterPaste(text) {
    const result = {
        pageType: 'recipe',
        title: '',
        macros: { calories: '', protein: '', carbs: '', fat: '' },
        description: '',
        notes: [],
        dayMealsTitle: 'Meals',
        dayBreakdownTitle: 'Macronutrient Breakdown',
        dayHighlightsTitle: 'Nutrition Highlights',
        dayTipsTitle: 'Tips for Success',
        dayTotalsTitle: 'Daily Totals',
        dayMeals: [],
        dayHighlights: [],
        dayTips: [],
        servingsLabel: 'Ingredients for 1 Serving',
        showIngredientsHeader: true,
        instructionsLabel: 'Instructions for 1 Serving',
        showInstructionsHeader: true,
        materials: [],
        ingredients: [],
        ingredientSections: [],
        instructions: [],
        instructionSections: [],
        portionVariations: [],
        portionVariationsLabel: 'Portion Variations',
        portionVariationIcon: '',
        portionVariationSections: [],
        serves: ''
    };

    const lines = stripFencedCodeBlockLines(text).split('\n');
    let currentSection = null;
    let currentTable = null;
    let textBlockCount = 0;
    let textBlockTitle = '';
    let textBlockContent = [];
    let currentIngredientSection = null;
    let currentDirectionsSection = null;
    let currentPortionVariationSection = null;
    let currentDaySection = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Section markers
        if (line.startsWith('::META::')) {
            currentSection = 'META';
            currentTable = null;
            currentIngredientSection = null;
            currentDaySection = null;
            continue;
        } else if (line.startsWith('::TEXT::')) {
            // Save previous text block if exists
            if (currentSection === 'TEXT' && textBlockContent.length > 0) {
                saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
                textBlockCount++;
                textBlockTitle = '';
                textBlockContent = [];
            }
            currentSection = 'TEXT';
            currentTable = null;
            currentIngredientSection = null;
            currentDirectionsSection = null;
            currentPortionVariationSection = null;
            currentDaySection = null;
            continue;
        } else if (line.startsWith('::INGREDIENTS')) {
            // Save previous text block if exists
            if (currentSection === 'TEXT' && textBlockContent.length > 0) {
                saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
                textBlockCount++;
            }
            currentSection = 'INGREDIENTS';
            currentTable = null;
            const labelMatch = line.match(/^::INGREDIENTS(?:\s+(.+?))?::$/);
            const sectionLabel = labelMatch?.[1]?.trim();
            currentIngredientSection = {
                label: '',
                startMode: 'auto',
                ingredients: []
            };
            result.ingredientSections.push(currentIngredientSection);
            currentDirectionsSection = null;
            currentPortionVariationSection = null;
            currentDaySection = null;
            if (sectionLabel) {
                result.servingsLabel = sectionLabel;
            }
            continue;
        } else if (line.startsWith('::PORTION_VARIATIONS')) {
            if (currentSection === 'TEXT' && textBlockContent.length > 0) {
                saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
                textBlockCount++;
            }
            currentSection = 'PORTION_VARIATIONS';
            currentTable = null;
            currentIngredientSection = null;
            currentDirectionsSection = null;
            currentDaySection = null;
            const labelMatch = line.match(/^::PORTION_VARIATIONS(?:\s+(.+?))?::$/);
            currentPortionVariationSection = {
                label: labelMatch?.[1]?.trim() || 'Portion Variations',
                icon: '',
                linkIconPosition: 'right',
                variations: []
            };
            result.portionVariationSections.push(currentPortionVariationSection);
            if (result.portionVariationSections.length === 1) {
                result.portionVariationsLabel = currentPortionVariationSection.label;
            }
            continue;
        } else if (line.startsWith('::DIRECTIONS')) {
            if (currentSection === 'TEXT' && textBlockContent.length > 0) {
                saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
                textBlockCount++;
            }
            currentSection = 'DIRECTIONS';
            currentTable = null;
            currentIngredientSection = null;
            currentPortionVariationSection = null;
            currentDaySection = null;
            const directionMeta = line.match(/^::DIRECTIONS(?:\s+(.+?))?::$/);
            const parts = (directionMeta?.[1] || '')
                .split(';')
                .map((part) => part.trim())
                .filter(Boolean);
            currentDirectionsSection = {
                label: parts[0] || result.instructionsLabel || 'Instructions for 1 Serving',
                stepStyle: parts[1] || 'numbered',
                startMode: normalizeInstructionStartMode(parts[2] || result.instructionsStartMode || 'force-right-column'),
                steps: []
            };
            result.instructionSections.push(currentDirectionsSection);
            continue;
        } else if (line.startsWith('::DAY_MEALS')) {
            if (currentSection === 'TEXT' && textBlockContent.length > 0) {
                saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
                textBlockCount++;
            }
            currentSection = 'DAY_MEALS';
            currentTable = null;
            currentIngredientSection = null;
            currentDirectionsSection = null;
            currentPortionVariationSection = null;
            currentDaySection = null;
            const labelMatch = line.match(/^::DAY_MEALS(?:\s+(.+?))?::$/);
            if (labelMatch?.[1]?.trim()) {
                result.dayMealsTitle = labelMatch[1].trim();
            }
            result.pageType = 'day-of-eating';
            continue;
        } else if (line.startsWith('::DAY_HIGHLIGHTS')) {
            if (currentSection === 'TEXT' && textBlockContent.length > 0) {
                saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
                textBlockCount++;
            }
            currentSection = 'DAY_HIGHLIGHTS';
            currentTable = null;
            currentIngredientSection = null;
            currentDirectionsSection = null;
            currentPortionVariationSection = null;
            currentDaySection = 'highlights';
            const labelMatch = line.match(/^::DAY_HIGHLIGHTS(?:\s+(.+?))?::$/);
            if (labelMatch?.[1]?.trim()) {
                result.dayHighlightsTitle = labelMatch[1].trim();
            }
            result.pageType = 'day-of-eating';
            continue;
        } else if (line.startsWith('::DAY_TIPS')) {
            if (currentSection === 'TEXT' && textBlockContent.length > 0) {
                saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
                textBlockCount++;
            }
            currentSection = 'DAY_TIPS';
            currentTable = null;
            currentIngredientSection = null;
            currentDirectionsSection = null;
            currentPortionVariationSection = null;
            currentDaySection = 'tips';
            const labelMatch = line.match(/^::DAY_TIPS(?:\s+(.+?))?::$/);
            if (labelMatch?.[1]?.trim()) {
                result.dayTipsTitle = labelMatch[1].trim();
            }
            result.pageType = 'day-of-eating';
            continue;
        } else if (line.startsWith('::DAY_TOTALS')) {
            currentSection = 'DAY_TOTALS';
            currentTable = null;
            currentIngredientSection = null;
            currentDirectionsSection = null;
            currentPortionVariationSection = null;
            currentDaySection = null;
            const labelMatch = line.match(/^::DAY_TOTALS(?:\s+(.+?))?::$/);
            if (labelMatch?.[1]?.trim()) {
                result.dayTotalsTitle = labelMatch[1].trim();
            }
            result.pageType = 'day-of-eating';
            continue;
        } else if (line.startsWith('::TABLE') && line.endsWith('::')) {
            // Extract table name: ::TABLE Name::
            const tableName = line.replace(/^::TABLE\s*/, '').replace(/\s*::$/, '');
            currentTable = tableName;
            if (currentSection === 'INGREDIENTS' && tableName) {
                if (currentIngredientSection && currentIngredientSection.ingredients.length === 0) {
                    currentIngredientSection.label = tableName;
                } else {
                    currentIngredientSection = {
                        label: tableName,
                        startMode: 'auto',
                        ingredients: []
                    };
                    result.ingredientSections.push(currentIngredientSection);
                }
            }
            continue;
        }

        // Skip empty lines
        if (!line) continue;

        // Process content based on current section
        if (currentSection === 'META') {
            const parts = line.split(';').map(p => p.trim());
            result.title = parts[0] || '';
            if ((parts[1] || '').toLowerCase().includes('day of eating')) {
                result.pageType = 'day-of-eating';
            }
            // parts[2] is dietary flags - skip for now
            result.serves = parts[3] || '';
            // parts[4] is prep time - skip for now
            // parts[5] is cook time - skip for now
            result.macros.calories = parts[6] || '';
            result.macros.protein = parts[7] || '';
            result.macros.carbs = parts[8] || '';
            result.macros.fat = parts[9] || '';
            result.materials = parseMaterialsField(parts[10] || '');
            result.portionVariationIcon = matchPortionVariationIconByName(parts[11] || '');
            result.showIngredientsHeader = parseBooleanFlag(parts[12], true);
            result.showInstructionsHeader = parseBooleanFlag(parts[13], true);

            // Auto-generate servings labels
            if (result.serves) {
                result.servingsLabel = `Ingredients for ${result.serves}`;
                result.instructionsLabel = `Instructions for ${result.serves}`;
            }
        } else if (currentSection === 'TEXT') {
            // First non-empty line in a text block could be a title
            if (textBlockContent.length === 0 && !textBlockTitle) {
                // Check if next line exists and is not empty
                const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
                if (nextLine) {
                    // This line is likely a title
                    textBlockTitle = line;
                } else {
                    // No next line, this is just content
                    textBlockContent.push(line);
                }
            } else {
                textBlockContent.push(line);
            }
        } else if (currentSection === 'INGREDIENTS') {
            // Skip header rows like "Ingredient;Amount"
            if (line.toLowerCase().startsWith('ingredient;')) continue;

            const headerText = parseInstructionHeaderText(line);
            const subtitleText = parseInstructionSubtitleText(line);
            if (headerText || subtitleText) {
                const labelRow = { type: headerText ? 'header' : 'subtitle', text: headerText || subtitleText };
                result.ingredients.push(labelRow);
                currentIngredientSection?.ingredients.push(labelRow);
                continue;
            }

            const parts = line.split(';').map(p => p.trim());
            if (parts.length >= 2) {
                const name = parts[0];
                // Combine amount columns if there are multiple
                const amount = parts.slice(1).filter(p => p).join(' / ');
                result.ingredients.push({ name, amount });
                currentIngredientSection?.ingredients.push({ name, amount });
            }
        } else if (currentSection === 'PORTION_VARIATIONS') {
            if (line.toLowerCase().startsWith('label;')) continue;

            const parts = line.split(';').map(p => p.trim());
            if (parts.length >= 6 && currentPortionVariationSection) {
                currentPortionVariationSection.variations.push({
                    label: parts[0] || '',
                    calories: parts[1] || '',
                    protein: parts[2] || '',
                    carbs: parts[3] || '',
                    fat: parts[4] || '',
                    fiber: parts[5] || '',
                    url: parts[6] || '',
                    showMacros: parseBooleanFlag(parts[7], true)
                });
            }
        } else if (currentSection === 'DAY_MEALS') {
            if (line.toLowerCase().startsWith('meal label;')) continue;
            const parts = line.split(';').map(p => p.trim());
            if (parts.length >= 7) {
                result.dayMeals.push({
                    image: '',
                    mealLabel: parts[0] || '',
                    name: parts[1] || '',
                    portionNote: parts[2] || '',
                    calories: parts[3] || '',
                    protein: parts[4] || '',
                    carbs: parts[5] || '',
                    fat: parts[6] || ''
                });
            }
        } else if (currentSection === 'DAY_HIGHLIGHTS') {
            result.dayHighlights.push(line.replace(/;$/, ''));
        } else if (currentSection === 'DAY_TIPS') {
            result.dayTips.push(line.replace(/;$/, ''));
        } else if (currentSection === 'DAY_TOTALS') {
            const parts = line.split(';').map(p => p.trim());
            if (parts.length >= 4) {
                result.macros.calories = parts[0] || result.macros.calories;
                result.macros.protein = parts[1] || result.macros.protein;
                result.macros.carbs = parts[2] || result.macros.carbs;
                result.macros.fat = parts[3] || result.macros.fat;
            }
        } else if (currentSection === 'DIRECTIONS') {
            const checkboxMatch = line.match(/^-\s*\[\s*\]\s*(.+)$/) || line.match(/^\[\s*\]\s*(.+)$/);
            const headerText = parseInstructionHeaderText(line);
            const subtitleText = parseInstructionSubtitleText(line);
            if (headerText || subtitleText) {
                const headerStep = { type: headerText ? 'header' : 'subtitle', text: headerText || subtitleText };
                result.instructions.push(headerStep);
                currentDirectionsSection?.steps.push(headerStep);
            } else if (checkboxMatch) {
                addCheckboxItemToLastInstruction(result.instructions, checkboxMatch[1].trim());
                if (currentDirectionsSection) {
                    addCheckboxItemToLastInstruction(currentDirectionsSection.steps, checkboxMatch[1].trim());
                }
            } else {
                result.instructions.push(line);
                currentDirectionsSection?.steps.push(line);
            }
        }
    }

    // Save final text block if exists
    if (currentSection === 'TEXT' && textBlockContent.length > 0) {
        saveTextBlock(result, textBlockCount, textBlockTitle, textBlockContent);
    }

    if (result.instructionSections.length === 0 && result.instructions.length > 0) {
        result.instructionSections = [{
            label: result.instructionsLabel || 'Instructions for 1 Serving',
            stepStyle: 'numbered',
            startMode: result.instructionsStartMode || 'force-right-column',
            steps: result.instructions
        }];
    }

    if (result.ingredientSections.length === 0 && result.ingredients.length > 0) {
        result.ingredientSections = [{
            label: '',
            startMode: 'auto',
            ingredients: result.ingredients
        }];
    }

    if (result.portionVariationSections.length === 0 && result.portionVariations.length > 0) {
        result.portionVariationSections = [{
            label: result.portionVariationsLabel || 'Portion Variations',
            icon: result.portionVariationIcon || '',
            variations: result.portionVariations
        }];
    }

    if (result.portionVariationSections.length > 0) {
        result.portionVariationSections[0].icon = result.portionVariationSections[0].icon || result.portionVariationIcon || '';
        result.portionVariations = result.portionVariationSections[0].variations || [];
        result.portionVariationsLabel = result.portionVariationSections[0].label || result.portionVariationsLabel;
        result.portionVariationIcon = result.portionVariationSections[0].icon || result.portionVariationIcon;
    }

    return result;
}

function addCheckboxItemToLastInstruction(steps, itemText) {
    if (!Array.isArray(steps) || !itemText) {
        return;
    }

    let lastIndex = steps.length - 1;
    while (lastIndex >= 0 && isInstructionHeaderStep(steps[lastIndex])) {
        lastIndex -= 1;
    }

    if (lastIndex < 0) {
        steps.push({ text: '', checkboxItems: [itemText] });
        return;
    }

    const lastStep = steps[lastIndex];
    if (typeof lastStep === 'string') {
        steps[lastIndex] = {
            text: lastStep,
            checkboxItems: [itemText]
        };
        return;
    }

    if (lastStep && typeof lastStep === 'object') {
        lastStep.checkboxItems = Array.isArray(lastStep.checkboxItems) ? lastStep.checkboxItems : [];
        lastStep.checkboxItems.push(itemText);
    }
}

/**
 * Helper to save a text block to description or note
 */
function saveTextBlock(result, blockIndex, title, content) {
    let text = content.join('\n');
    if (title) {
        text = `${title}\n${text}`;
    }

    if (blockIndex === 0) {
        // First text block goes to description
        result.description = text;
    } else {
        // Additional text blocks go to notes array
        result.notes.push(text);
    }
}

function parseMaterialsField(value) {
    if (!value) {
        return [];
    }

    const requestedNames = value
        .split('|')
        .flatMap(part => part.split(','))
        .map(part => part.trim())
        .filter(Boolean);

    return matchMaterialsByName(requestedNames);
}

function normalizeMaterialName(value) {
    return (value || '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function matchMaterialsByName(names) {
    const matchedIds = [];

    names.forEach((name) => {
        const normalizedRequested = normalizeMaterialName(name);
        if (!normalizedRequested) {
            return;
        }

        const exactMatch = AVAILABLE_MATERIALS.find(material =>
            normalizeMaterialName(material.name) === normalizedRequested
        );

        const fuzzyMatch = exactMatch || AVAILABLE_MATERIALS.find(material => {
            const normalizedMaterial = normalizeMaterialName(material.name);
            return normalizedMaterial.includes(normalizedRequested) || normalizedRequested.includes(normalizedMaterial);
        });

        if (fuzzyMatch && !matchedIds.includes(fuzzyMatch.id)) {
            matchedIds.push(fuzzyMatch.id);
        }
    });

    return matchedIds;
}

function matchPortionVariationIconByName(name) {
    const normalizedRequested = normalizeMaterialName(name);
    if (!normalizedRequested) {
        return '';
    }

    const exactMatch = AVAILABLE_PORTION_VARIATION_ICONS.find(icon =>
        icon.id === name || normalizeMaterialName(icon.name) === normalizedRequested
    );

    const fuzzyMatch = exactMatch || AVAILABLE_PORTION_VARIATION_ICONS.find(icon => {
        const normalizedIconName = normalizeMaterialName(icon.name);
        return normalizedIconName.includes(normalizedRequested) || normalizedRequested.includes(normalizedIconName);
    });

    return fuzzyMatch?.id || '';
}

function getExportTitle() {
    const title = (currentRecipe.title || '').trim() || 'Recipe';
    const suffixes = [];

    if (isPrinterFriendly(currentRecipe) && !/(^| - )Printer Friendly( - |$)/i.test(title)) {
        suffixes.push('Printer Friendly');
    }

    if (currentRecipe.showMacroBar === false && !/(^| - )no macros( - |$)/i.test(title)) {
        suffixes.push('no macros');
    }

    return [title, ...suffixes].join(' - ');
}

/**
 * Handle Fill All button click
 */
function handleFillAll() {
    const pasteText = elements.masterPaste().value;
    const statusEl = elements.masterPasteStatus();

    if (!pasteText.trim()) {
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = 'Please paste recipe data first.';
        return;
    }

    try {
        const parsed = parseMasterPaste(pasteText);
        const normalizedParsedRecipe = normalizeRecipe({
            ...currentRecipe,
            pageType: parsed.pageType,
            title: parsed.title,
            macros: parsed.macros,
            description: parsed.description,
            notes: parsed.notes,
            dayMealsTitle: parsed.dayMealsTitle,
            dayBreakdownTitle: parsed.dayBreakdownTitle,
            dayHighlightsTitle: parsed.dayHighlightsTitle,
            dayTipsTitle: parsed.dayTipsTitle,
            dayTotalsTitle: parsed.dayTotalsTitle,
            dayMeals: parsed.dayMeals,
            dayHighlights: parsed.dayHighlights,
            dayTips: parsed.dayTips,
            servingsLabel: parsed.servingsLabel,
            instructionsLabel: parsed.instructionsLabel,
            materials: parsed.materials,
            ingredients: parsed.ingredients,
            ingredientSections: parsed.ingredientSections,
            instructions: parsed.instructions,
            instructionSections: parsed.instructionSections,
            portionVariations: parsed.portionVariations,
            portionVariationsLabel: parsed.portionVariationsLabel,
            portionVariationIcon: parsed.portionVariationIcon,
            portionVariationSections: parsed.portionVariationSections
        });
        currentRecipe = normalizedParsedRecipe;

        // Load into form
        loadRecipeToForm(currentRecipe);

        // Render preview
        renderRecipePage();

        // Show success
        statusEl.className = 'master-paste-status success';
        statusEl.textContent = `✓ Recipe loaded successfully: ${parsed.title || 'Untitled Recipe'}`;

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
            statusEl.className = 'master-paste-status';
        }, 5000);

    } catch (error) {
        console.error('Parse error:', error);
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = `Error parsing recipe: ${error.message}`;
    }
}

/**
 * Handle Copy AI Instructions button click
 */
function handleCopyAIInstructions() {
    const instructions = `You are helping me format recipe data for my Recipe Page Generator app.

Please analyze the recipe image and any recipe data provided. Output ONLY the structured data in this exact format, and include equipment/materials inferred from the image and recipe method:

::META::
Recipe Title;Meal Type;dietary flags;serves;prep time;cook time;calories;protein g;carbs g;fat g;equipment names;portion variation icon;show ingredients title yes/no;show instructions title yes/no

::TEXT::
Description or intro text (optional)

::TEXT::
Note:
Optional note or tip text (this becomes a callout box)

::INGREDIENTS Ingredients for 4 Servings::
Ingredient;Amount
Ingredient;Amount
...

OR if there are multiple ingredient groups:

::INGREDIENTS Ingredients for 4 Servings::
::TABLE Group Name::
Ingredient;Amount
Ingredient;Amount
::TABLE Another Group::
Ingredient;Amount
...

::DIRECTIONS::
:HEADER: Prep the tofu
Step one text
Step with checkbox items
- [ ] Checkbox item one
- [ ] Checkbox item two
:HEADER: Finish the dish
Step two text
Step three text
...

IMPORTANT RULES:
- Use EXACT section headers: ::META::, ::TEXT::, ::INGREDIENTS::, ::DIRECTIONS::
- META line must be semicolon-separated. Use 14 fields when possible:
  1. Recipe title
  2. Meal type
  3. Dietary flags
  4. Serves
  5. Prep time
  6. Cook time
  7. Calories
  8. Protein grams
  9. Carb grams
  10. Fat grams
  11. Equipment/material names
  12. Portion variation icon name (optional; leave blank for normal recipes)
  13. Show ingredients title: yes or no
  14. Show instructions title: yes or no
- If using the older 11-field or 13-field META format, the app still accepts it and defaults missing title toggles to yes.
- For dietary flags, use: gf, sf, nf, wf (or leave blank)
- Serves examples: "4 Servings", "2-3 Servings", "1 Serving"
- Times should include units: "15 min", "1 hour", "30-45 min"
- META field 11 is a comma-separated or pipe-separated list of equipment/material names inferred from the image and recipe data
- Only include real equipment choices such as bowl, pot, pan, blender, knife, cutting board, strainer, tray, containers, spoon, whisk, etc.
- If no equipment can be inferred, leave the equipment field blank but keep the semicolon
- ::TEXT:: sections (optional, can have 0 or more):
  - First ::TEXT:: section = description (appears under title)
  - Additional ::TEXT:: sections = note callouts (appear as separate callout boxes)
  - Use one additional ::TEXT:: section for each note, tip, warning, disclaimer, or callout from the source
  - Each note callout is rendered separately with an alert icon
  - For note callouts, put the note label on the first line, usually "Note:" or "Tip:"
  - Text before a colon (:) in notes will appear bold (e.g., "Note:" or "Tip:")
- Ingredient rows: Name;Amount (semicolon-separated)
- The black ingredients title is separate from ingredient set headers.
- The black ingredients title text comes from the ::INGREDIENTS Header Text:: section line. Example: ::INGREDIENTS Ingredients for 4 Servings::.
- The black ingredients title can be hidden with META field 13 set to "no". Use "yes" by default for normal recipes.
- If the black title is hidden, still include the ::INGREDIENTS:: block so ingredient rows can be parsed.
- Use ::TABLE Group Name:: only for ingredient set headers such as Sauce, Dressing, Bowl, Filling, or Topping.
- Inside ingredient rows, use :HEADER: Header text for an inline ingredient header and :SUBTITLE: Subtitle text for an inline ingredient subtitle.
- Do not repeat "Ingredients for X Servings" as a ::TABLE name unless the source truly has an ingredient group with that exact name.
- Always write teaspoon/tablespoon abbreviations in lowercase: "tsp" and "tbsp" only. Never use "Tsp", "Tbsp", "TSP", or "TBSP".
- All ingredient amounts and checkbox ingredient amounts MUST use single-character small fraction glyphs, never slash fractions or decimals when a common fraction exists.
- Required fraction conversions: 1/2 = ½, 1/4 = ¼, 3/4 = ¾, 1/3 = ⅓, 2/3 = ⅔, 1/8 = ⅛, 3/8 = ⅜, 5/8 = ⅝, 7/8 = ⅞.
- Write mixed amounts with the whole number directly before the glyph: use "1½ tsp", not "1.5 tsp" or "1 1/2 tsp"; use "½ cup", not "1/2 cup".
- If the recipe/image/data contains 2 or more ingredient groups or components, you MUST preserve them as separate ingredient sets using ::TABLE Name::
- Examples of separate ingredient sets: smoothie + topping, salad + dressing, bowl + sauce, crust + filling, marinade + main recipe
- Do NOT flatten multiple ingredient groups into one list when the source clearly separates them
- Use ::TABLE Name:: for ingredient groups (optional when there is only one group, required when there are multiple groups)
- Directions: one step per line, no bullets, no numbering for normal steps
- The black instructions title is separate from instruction set labels. The black title comes from the app's Instructions Title field and defaults to "Instructions for X Servings" based on META serves. It can be hidden with META field 14 set to "no". Use "yes" by default for normal recipes.
- A ::DIRECTIONS Label;step style;start mode:: label is an instruction set header. It renders like ingredient set headers, not like the black instructions title.
- Use ::DIRECTIONS Label;numbered;auto:: when the source has major direction sections such as "Part 1: Prepare", "Part 2: Cook", "Sauce", "Assemble", or "Bake".
- Do not repeat "Instructions for X Servings" as a ::DIRECTIONS label.
- Use :HEADER: Header text on its own line to add an unnumbered instruction header in the middle of a direction set. These render like ingredient set headers.
- Use :SUBTITLE: Subtitle text on its own line to add an unnumbered instruction subtitle. It follows the same layout/number-reset rules as :HEADER: but renders without bold styling. Subtitle capitalization can be controlled in the app.
- Use instruction headers for recipe parts/components such as ":HEADER: Making the green goddess sauce", ":HEADER: Assemble the bowls", or ":HEADER: Bake the muffins".
- Do not number :HEADER: or :SUBTITLE: lines and do not put checkbox items under either line type.
- For a step that needs checkbox sub-items, put the parent step on its own line, then put each checkbox item immediately below it as: - [ ] Checkbox item text
- Checkbox item lines must always start with "- [ ]" and must directly follow the parent direction step they belong to
- Use checkbox items for ingredient add-in lists, checklist-style substeps, or grouped items within a single step
- Return the final structured recipe inside one fenced code block using triple backticks
- Do NOT put any commentary, explanations, or extra text outside the code block
- Do NOT use markdown inside the code block except checkbox lines exactly like "- [ ] Checkbox item text"
- The code block is required so checkbox lines and spacing are preserved when pasted into the app
- If a field is unknown, leave it blank but keep the semicolon

Example output:

::META::
Tofu Scramble;Breakfast;gf,sf;2 Servings;10 min;15 min;320;18;24;16;skillet, spatula, bowl;;yes;yes

::TEXT::
A protein-packed breakfast that's ready in minutes.

::TEXT::
Chef's Tip:
For best results, press the tofu for at least 15 minutes to remove excess moisture.

::TEXT::
Note:
This recipe is naturally gluten-free and soy-free when using appropriate ingredients.

::INGREDIENTS Ingredients for 2 Servings::
Firm tofu;14 oz
Nutritional yeast;2 tbsp
Turmeric;½ tsp
Salt;¼ tsp

Example with 2 ingredient sets:

::INGREDIENTS Ingredients for 2 Servings::
::TABLE Smoothie::
Banana;1
Frozen strawberries;1 cup
Soy milk;1 cup
::TABLE Topping::
Granola;2 tbsp
Chia seeds;1 tsp

::DIRECTIONS::
:HEADER: Prep the tofu
Press tofu and crumble into a bowl
Heat oil in a pan over medium heat
:HEADER: Season and cook
Add crumbled tofu and cook for 5 minutes
Add the seasoning ingredients
- [ ] Nutritional yeast
- [ ] Turmeric
- [ ] Salt
Cook for 5 more minutes until golden`;

    // Copy to clipboard
    navigator.clipboard.writeText(instructions).then(() => {
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status success';
        statusEl.textContent = '✓ AI instructions copied to clipboard!';
        setTimeout(() => {
            statusEl.className = 'master-paste-status';
        }, 3000);
    }).catch(err => {
        console.error('Copy failed:', err);
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = 'Failed to copy to clipboard.';
    });
}

function handleCopyAIInfoInstructions() {
    const instructions = `You are helping me format screenshot/image-based product or produce reference data for my Recipe Page Generator app.

Please analyze the screenshot, product image, nutrition facts, and any supporting text provided. Output ONLY plain text in this exact structured format:

::META::
Title;Reference Page;;1 Serving;;;calories;protein;carbs;fat;equipment names;portion variation icon;show ingredients title yes/no;show instructions title yes/no

::TEXT::
Short description text

::TEXT::
Note:
Optional note or callout text

::INGREDIENTS Nutrition Highlights::
Highlight text;
Highlight text;
Highlight text;

::PORTION_VARIATIONS Brand or Group Name::
Label;Calories;Protein;Carbs;Fat;Fiber;URL;Show Macros
Label;Calories;Protein;Carbs;Fat;Fiber;URL;Show Macros

::PORTION_VARIATIONS Another Brand or Group Name::
Label;Calories;Protein;Carbs;Fat;Fiber;URL;Show Macros

::DIRECTIONS Ways to Enjoy;bulleted;auto::
:HEADER: Quick options
Bullet point text
Bullet point text

::DIRECTIONS Preparing Fresh Product;numbered;auto::
:HEADER: Prep
Step text
Step with checkbox items
- [ ] Checkbox item one
- [ ] Checkbox item two
:HEADER: Serve
Step text

IMPORTANT RULES:
- Return the final structured output inside one fenced code block using triple backticks
- Do NOT put any commentary, explanations, or extra text outside the code block
- Do NOT use markdown inside the code block except checkbox lines exactly like "- [ ] Checkbox item text"
- The code block is required so checkbox lines and spacing are preserved when pasted into the app
- Use EXACT section headers.
- META must be semicolon-separated. Use 14 fields when possible.
- If macros are unknown, use 0.
- The 11th META field is equipment/materials. Leave blank if none.
- The 12th META field is the portion variation icon name. Use an existing equipment/material icon name or leave blank.
- The 13th META field controls whether the black ingredients title appears. Use "yes" when the ::INGREDIENTS ...:: header should render as a black title, and "no" when it should be hidden. The 14th META field controls whether the black instructions title appears. Use "yes" by default.
- ::TEXT:: sections (optional, can have 0 or more):
  - First ::TEXT:: section = description (appears under title)
  - Additional ::TEXT:: sections = note callouts (appear as separate callout boxes with alert icons)
  - Use one additional ::TEXT:: section for each note, tip, warning, disclaimer, or callout from the source
  - For note callouts, put the note label on the first line, usually "Note:" or "Tip:"
  - Text before a colon (:) in notes will appear bold (e.g., "Note:" or "Tip:")
- Use the INGREDIENTS section for Nutrition Highlights when making info pages.
- For info pages, ::INGREDIENTS Nutrition Highlights:: sets the black ingredients title text to "Nutrition Highlights" when META field 13 is yes.
- The black ingredients title is separate from ingredient set headers. Use ::TABLE Group Name:: only when you need separate ingredient/highlight groups below the black title.
- For Nutrition Highlights, put each highlight on its own line with a trailing semicolon.
- Use one ::PORTION_VARIATIONS ...:: block per brand/group when needed.
- Each portion variation row format is: Label;Calories;Protein;Carbs;Fat;Fiber;URL;Show Macros
- Include URL when there is a product purchase page. Leave blank if not available.
- Show Macros is optional and defaults to yes. Use "no" for link-only rows that should not show macro details.
- Each ::DIRECTIONS ...:: header format is: ::DIRECTIONS Label;step style;start mode::
- The ::DIRECTIONS label is an instruction set header. It renders like ingredient set headers and is separate from the black Instructions Title.
- Do not use "Instructions for X Servings" as a ::DIRECTIONS label.
- step style must be either numbered or bulleted
- start mode must be auto, force-right-column, or force-next-page
- Use force-next-page when the directions should start at the top of the next page
- Use :HEADER: Header text on its own line to add an unnumbered instruction header in the middle of any ::DIRECTIONS:: block. These render like ingredient set headers.
- Use :SUBTITLE: Subtitle text on its own line to add an unnumbered instruction subtitle. It follows the same layout/number-reset rules as :HEADER: but renders without bold styling. Subtitle capitalization can be controlled in the app.
- Do not number :HEADER: or :SUBTITLE: lines and do not put checkbox items under either line type.
- For a direction step that needs checkbox sub-items, put the parent step on its own line, then put each checkbox item immediately below it as: - [ ] Checkbox item text
- Checkbox item lines must always start with "- [ ]" and must directly follow the parent direction step they belong to
- If a field is unknown, leave it blank but keep delimiters intact

Example:

::META::
Protein Bars;Reference Page;;1 Serving;;;190;15;11;7;protein bar;protein bar;yes;yes

::TEXT::
A quick reference page for high-protein snack bars with macro comparisons.

::TEXT::
Note:
Check labels because nutrition facts can vary by flavor and package size.

::INGREDIENTS Nutrition Highlights::
High in protein to support satiety;
Convenient shelf-stable snack option;
Can vary significantly in fiber and fat content;

::PORTION_VARIATIONS Misfits::
Caramel Fudge;190;15;11;7;5;https://example.com/caramel-fudge;yes
Chocolate Brownie;195;15;8;9;12;https://example.com/chocolate-brownie;yes

::PORTION_VARIATIONS No Cow::
Peanut Butter Chocolate Chip;190;20;7;5;19;https://example.com/pb-choc-chip;yes
Variety Pack;;;;;;https://example.com/variety-pack;no

::DIRECTIONS Ways to Enjoy;bulleted;auto::
Eat as a grab-and-go snack
Pair with fruit for a more filling option
Use after workouts when convenient protein is needed`;

    navigator.clipboard.writeText(instructions).then(() => {
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status success';
        statusEl.textContent = '✓ Info AI prompt copied to clipboard!';
        setTimeout(() => {
            statusEl.className = 'master-paste-status';
        }, 3000);
    }).catch(err => {
        console.error('Copy failed:', err);
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = 'Failed to copy to clipboard.';
    });
}

function handleCopyAIDayInstructions() {
    const instructions = `You are helping me format a "Day of Eating" page for my Recipe Page Generator app.

The user will provide screenshots/images for each meal eaten in a day. Analyze the screenshots and any accompanying text, then output ONLY plain text in this exact structured format.

IMPORTANT:
- Infer meal label, meal name, portion note, and meal macros from the screenshots/data provided
- Calculate or estimate daily totals when they are not explicitly given
- Do NOT output image files or image URLs for meal thumbnails. The user will add thumbnails manually in the app later
- Return the final structured output inside one fenced code block using triple backticks
- Do NOT put any commentary, explanations, or extra text outside the code block
- The code block is required so line breaks and spacing are preserved when pasted into the app

::META::
Page Title;Day of Eating;;1 Day;;;Total Calories;Total Protein;Total Carbs;Total Fat;

::TEXT::
Short day overview or description

::TEXT::
Note:
Optional note or disclaimer

::DAY_MEALS Meals::
Meal Label;Meal Name;Portion Note;Calories;Protein;Carbs;Fat
Breakfast;Meal name;portion note;calories;protein;carbs;fat
Lunch;Meal name;portion note;calories;protein;carbs;fat
Dinner;Meal name;portion note;calories;protein;carbs;fat

::DAY_HIGHLIGHTS Nutrition Highlights::
Highlight line
Highlight line
Highlight line

::DAY_TIPS Tips for Success::
Tip line
Tip line
Tip line

::DAY_TOTALS Daily Totals::
Calories;Protein;Carbs;Fat

RULES:
- Use EXACT section headers
- META line must stay semicolon-separated
- The second META field must be exactly: Day of Eating
- ::TEXT:: sections (optional, can have 0 or more):
  - First ::TEXT:: section = description (appears under title)
  - Additional ::TEXT:: sections = note callouts (appear as separate callout boxes with alert icons)
  - Use one additional ::TEXT:: section for each note, tip, warning, disclaimer, or callout from the source
  - For note callouts, put the note label on the first line, usually "Note:" or "Tip:"
  - Text before a colon (:) in notes will appear bold (e.g., "Note:" or "Tip:")
- Use one meal per line in ::DAY_MEALS::
- Meal Label examples: Breakfast, Lunch, Dinner, Snack, Mid-Morning Snack, Afternoon Snack, Evening Snack
- Meal row format must be exactly:
  Meal Label;Meal Name;Portion Note;Calories;Protein;Carbs;Fat
- Use numbers only for calories/protein/carbs/fat, without units
- Portion notes MUST use single-character small fraction glyphs, never slash fractions or decimals when a common fraction exists.
- Required fraction conversions: 1/2 = ½, 1/4 = ¼, 3/4 = ¾, 1/3 = ⅓, 2/3 = ⅔, 1/8 = ⅛, 3/8 = ⅜, 5/8 = ⅝, 7/8 = ⅞.
- Write mixed amounts with the whole number directly before the glyph: use "1½ oz", not "1.5 oz" or "1 1/2 oz".
- DAY_HIGHLIGHTS: one highlight per line
- DAY_TIPS: one tip per line
- DAY_TOTALS: one line only in this exact order:
  Calories;Protein;Carbs;Fat
- If something is unknown, make the best reasonable estimate from the screenshot/context
- Do NOT include ingredients, directions, or portion variation sections for this format

Example:

::META::
Day of Eating;Day of Eating;;1 Day;;;1842;134;198;65;

::TEXT::
A well-rounded day of eating with a balance of lean protein, complex carbs, healthy fats, and fiber.

::TEXT::
Note:
This is a sample day of eating. Nutritional needs vary based on the individual.

::DAY_MEALS Meals::
Breakfast;Green Maca Smoothie;1 smoothie;516;24;64;26
Mid-Morning Snack;Raspberries;1 bowl;63;1;16;0
Lunch;Black Bean Cowboy Caviar;1 serving;418;20;70;10
Afternoon Snack;Almonds;1½ oz;246;9;9;21
Dinner;Grilled Chicken & Quinoa Bowl;1 bowl;507;62;39;8
Evening Snack;Chia Seed Blackberry Pudding;1 serving;92;7;25;2

::DAY_HIGHLIGHTS Nutrition Highlights::
High in protein and fiber
Includes a variety of minimally processed foods
Balanced macro distribution across the day

::DAY_TIPS Tips for Success::
Stay hydrated throughout the day
Prep meals and snacks ahead of time
Adjust portions based on your goals

::DAY_TOTALS Daily Totals::
1842;134;198;65`;

    navigator.clipboard.writeText(instructions).then(() => {
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status success';
        statusEl.textContent = '✓ Day of Eating AI prompt copied to clipboard!';
        setTimeout(() => {
            statusEl.className = 'master-paste-status';
        }, 3000);
    }).catch(err => {
        console.error('Copy failed:', err);
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = 'Failed to copy to clipboard.';
    });
}

function handleCopyDayMealsPrompt() {
    const instructions = `Analyze the meal screenshots or meal data I provide and return ONLY meal rows in this exact format:

Meal Label;Meal Name;Portion Note;Calories;Protein;Carbs;Fat

Rules:
- Output one meal per line
- Return the final meal rows inside one fenced code block using triple backticks
- No bullets
- No numbering
- No explanation before or after the code block
- Keep the semicolon structure exactly the same
- The code block is required so line breaks and spacing are preserved when pasted into the app
- Meal Label examples: Breakfast, Lunch, Dinner, Snack, Mid-Morning Snack, Afternoon Snack, Evening Snack
- Portion Note should be short, like "1 serving", "1 bowl", "1 smoothie", "1 plate", "1 bar", or "1 cup"
- Portion notes MUST use single-character small fraction glyphs, never slash fractions or decimals when a common fraction exists.
- Required fraction conversions: 1/2 = ½, 1/4 = ¼, 3/4 = ¾, 1/3 = ⅓, 2/3 = ⅔, 1/8 = ⅛, 3/8 = ⅜, 5/8 = ⅝, 7/8 = ⅞.
- Write mixed amounts with the whole number directly before the glyph: use "1½ oz", not "1.5 oz" or "1 1/2 oz".
- Use numbers only for Calories, Protein, Carbs, and Fat
- If a value is unclear, make the best reasonable estimate from the screenshot and context

Example:
Breakfast;Green Maca Smoothie;1 smoothie;516;24;64;26
Lunch;Black Bean Cowboy Caviar;1 bowl;418;20;70;10
Dinner;Grilled Chicken & Quinoa Bowl;1 plate;507;62;39;8`;

    navigator.clipboard.writeText(instructions).then(() => {
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status success';
        statusEl.textContent = '✓ Meal AI prompt copied to clipboard!';
        setTimeout(() => {
            statusEl.className = 'master-paste-status';
        }, 3000);
    }).catch(err => {
        console.error('Copy failed:', err);
        const statusEl = elements.masterPasteStatus();
        statusEl.className = 'master-paste-status error';
        statusEl.textContent = 'Failed to copy to clipboard.';
    });
}

/**
 * Handle print/PDF export
 */
function handlePrint() {
    // Clone the recipe page for printing
    const printPage = elements.printPage();
    printPage.innerHTML = elements.recipePage().innerHTML;
    printPage.querySelectorAll('.page-bottom-margin-guide').forEach((guide) => guide.remove());

    const previousTitle = document.title;
    document.title = getExportTitle();

    const restoreTitle = () => {
        document.title = previousTitle;
        window.removeEventListener('afterprint', restoreTitle);
    };

    window.addEventListener('afterprint', restoreTitle);

    // Trigger print dialog
    window.print();
}

/**
 * Handle editable PDF export through the Node PDFKit endpoint
 */
async function handleExportEditablePdf() {
    const button = elements.btnExportEditablePdf();
    const originalText = button?.textContent || 'Export Editable PDF';

    if (button) {
        button.textContent = 'Exporting...';
        button.disabled = true;
    }

    try {
        const response = await fetch('/export-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentRecipe)
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || 'Editable PDF export failed.');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `${getExportTitle()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Editable PDF export error:', error);
        alert('Error exporting editable PDF. Make sure the Node server is running.');
    } finally {
        if (button) {
            button.textContent = originalText;
            button.disabled = false;
        }
    }
}

/**
 * Handle saving recipe as JSON
 */
function handleSaveJson() {
    saveRecentRecipe(currentRecipe);

    const dataStr = JSON.stringify(currentRecipe, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${getExportTitle()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Handle loading recipe from JSON file
 */
function handleLoadJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const recipe = normalizeRecipe(JSON.parse(e.target.result));
            currentRecipe = recipe;
            loadRecipeToForm(recipe);
            renderRecipePage();
            saveRecentRecipe(recipe);
        } catch (error) {
            alert('Error loading JSON file. Please ensure it is a valid recipe file.');
            console.error('JSON parse error:', error);
        }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
}

/**
 * Handle clearing all form data
 */
function handleClear() {
    if (confirm('Are you sure you want to clear all recipe data?')) {
        currentRecipe = normalizeRecipe({});
        clearMasterPasteFields();
        loadRecipeToForm(currentRecipe);
        renderRecipePage();
    }
}

function clearMasterPasteFields() {
    const masterPaste = elements.masterPaste();
    const aiSource = elements.masterPasteAiSource();
    const aiFileInput = elements.masterPasteAiImages();
    const statusEl = elements.masterPasteStatus();

    if (masterPaste) masterPaste.value = '';
    if (aiSource) aiSource.value = '';
    if (aiFileInput) aiFileInput.value = '';

    masterPasteAiImages = [];
    renderMasterPasteAiFiles();

    if (statusEl) {
        statusEl.className = 'master-paste-status';
        statusEl.textContent = '';
    }
}

function layoutHeroImageLayers(root = document) {
    root.querySelectorAll('.hero-section .hero-image-layer').forEach((image) => {
        const heroSection = image.closest('.hero-section');
        if (!heroSection || !image.naturalWidth || !image.naturalHeight) {
            if (!image.dataset.heroLayoutBound) {
                image.dataset.heroLayoutBound = 'true';
                image.addEventListener('load', () => layoutHeroImageLayers(root), { once: true });
            }
            return;
        }

        const heroWidth = heroSection.clientWidth;
        const heroHeight = heroSection.clientHeight;
        if (!heroWidth || !heroHeight) return;

        const rawPosX = Number.parseFloat(image.style.getPropertyValue('--hero-image-pos-x'));
        const rawPosY = Number.parseFloat(image.style.getPropertyValue('--hero-image-pos-y'));
        const rawZoom = Number.parseFloat(image.style.getPropertyValue('--hero-image-zoom'));
        const posX = Math.min(100, Math.max(0, Number.isFinite(rawPosX) ? rawPosX : 50)) / 100;
        const posY = Math.min(100, Math.max(0, Number.isFinite(rawPosY) ? rawPosY : 50)) / 100;
        const zoom = Math.max(0.01, Number.isFinite(rawZoom) ? rawZoom : 1);
        const coverScale = Math.max(heroWidth / image.naturalWidth, heroHeight / image.naturalHeight);
        const coverWidth = image.naturalWidth * coverScale * zoom;
        const coverHeight = image.naturalHeight * coverScale * zoom;

        image.style.width = `${coverWidth}px`;
        image.style.height = `${coverHeight}px`;
        image.style.left = `${(heroWidth - coverWidth) * posX}px`;
        image.style.top = `${(heroHeight - coverHeight) * posY}px`;
    });
}

/**
 * Update zoom level display and transform
 */
function updateZoom() {
    const scale = zoomLevel / 100;
    const page = elements.recipePage();
    if (!page) return;

    const wrapper = page.closest('.recipe-page-wrapper');
    const { width: pageWidth, height: pageHeight } = getRecipePageDimensions();
    const container = elements.previewContainer();

    elements.zoomLevelDisplay().textContent = `${zoomLevel}%`;
    page.style.transform = `scale(${scale})`;

    // Update wrapper dimensions to match scaled page size
    // This prevents the scaled content from being cropped
    if (wrapper) {
        wrapper.style.width = `${pageWidth * scale}px`;
        wrapper.style.height = `${pageHeight * scale}px`;
    }

    if (container && wrapper) {
        previewPanX = (container.clientWidth - wrapper.offsetWidth) / 2;
        previewPanY = (container.clientHeight - wrapper.offsetHeight) / 2;
        applyPreviewPan();
    }
}

function centerPreview() {
    centerPreviewWithBehavior('smooth');
}

function centerPreviewWithBehavior(behavior = 'auto') {
    const container = elements.previewContainer();
    const wrapper = elements.recipePage()?.closest('.recipe-page-wrapper');

    if (!container || !wrapper) return;

    const containerRect = container.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();
    const deltaX = (containerRect.left + (containerRect.width / 2)) - (wrapperRect.left + (wrapperRect.width / 2));
    const deltaY = (containerRect.top + (containerRect.height / 2)) - (wrapperRect.top + (wrapperRect.height / 2));

    previewPanX += deltaX;
    previewPanY += deltaY;
    applyPreviewPan(behavior === 'smooth');
}

function hasVisiblePreviewPage(overscrollAllowance = 180) {
    const container = elements.previewContainer();
    const pageStack = elements.recipePage();
    if (!container || !pageStack) return true;

    const containerRect = container.getBoundingClientRect();
    const allowedRect = {
        left: containerRect.left - overscrollAllowance,
        right: containerRect.right + overscrollAllowance,
        top: containerRect.top - overscrollAllowance,
        bottom: containerRect.bottom + overscrollAllowance
    };
    const pages = Array.from(pageStack.querySelectorAll('.recipe-page'));

    return pages.some((page) => {
        const rect = page.getBoundingClientRect();
        const visibleWidth = Math.min(rect.right, allowedRect.right) - Math.max(rect.left, allowedRect.left);
        const visibleHeight = Math.min(rect.bottom, allowedRect.bottom) - Math.max(rect.top, allowedRect.top);

        return visibleWidth > 0 && visibleHeight > 0;
    });
}

function schedulePreviewAutoCenterIfOutOfView() {
    if (previewAutoCenterFrame !== null) {
        window.cancelAnimationFrame(previewAutoCenterFrame);
    }

    if (previewAutoCenterTimer !== null) {
        window.clearTimeout(previewAutoCenterTimer);
        previewAutoCenterTimer = null;
    }

    previewAutoCenterFrame = window.requestAnimationFrame(() => {
        previewAutoCenterFrame = null;

        if (!hasVisiblePreviewPage()) {
            previewAutoCenterTimer = window.setTimeout(() => {
                previewAutoCenterTimer = null;

                if (!hasVisiblePreviewPage()) {
                    centerPreviewWithBehavior('smooth');
                }
            }, 750);
        }
    });
}

function applyPreviewPan(animate = false) {
    const wrapper = elements.recipePage()?.closest('.recipe-page-wrapper');
    if (!wrapper) return;

    if (animate) {
        wrapper.classList.add('is-centering');
        window.setTimeout(() => {
            wrapper.classList.remove('is-centering');
        }, 560);
    } else {
        wrapper.classList.remove('is-centering');
    }

    wrapper.style.transform = `translate(${previewPanX}px, ${previewPanY}px)`;
}

/**
 * Calculate and set zoom level to fit the page in the preview container
 */
function setZoomToFit() {
    const container = elements.previewContainer();
    const page = elements.recipePage();
    if (!container || !page) return;

    const containerWidth = Math.max(1, container.clientWidth - 64);
    const containerHeight = Math.max(1, container.clientHeight - 64);
    const { width: pageWidth, height: pageHeight } = getRecipePageDimensions();

    if (!pageWidth || !pageHeight) return;

    // Calculate scale to fit entire page with some margin
    const scaleX = containerWidth / pageWidth;
    const scaleY = containerHeight / pageHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    zoomLevel = Math.round(scale * 100);
    updateZoom();
    requestAnimationFrame(() => centerPreviewWithBehavior('auto'));
}

// Recalculate zoom on window resize
window.addEventListener('resize', debounce(() => {
    setZoomToFit();
}, 250));

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Debounce function to limit rapid updates
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function normalizeExternalUrl(url) {
    const trimmedUrl = String(url || '').trim();
    if (!trimmedUrl) return '';

    const prefixedUrl = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

    try {
        const parsedUrl = new URL(prefixedUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return '';
        }
        return parsedUrl.toString();
    } catch {
        return '';
    }
}

function loadImageElement(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function createHeroOverlayCanvas(heroSection, scaleRatio) {
    if (!heroSection) {
        return null;
    }

    const overlayClone = heroSection.cloneNode(true);
    overlayClone.querySelector('.hero-image, .hero-image-layer, .hero-image-export, .hero-placeholder')?.remove();
    overlayClone.querySelector('.hero-corner-logo')?.remove();
    overlayClone.style.width = `${heroSection.offsetWidth}px`;
    overlayClone.style.height = `${heroSection.offsetHeight}px`;
    overlayClone.style.minWidth = `${heroSection.offsetWidth}px`;
    overlayClone.style.minHeight = `${heroSection.offsetHeight}px`;
    overlayClone.style.maxWidth = `${heroSection.offsetWidth}px`;
    overlayClone.style.maxHeight = `${heroSection.offsetHeight}px`;
    overlayClone.style.position = 'absolute';
    overlayClone.style.left = '0';
    overlayClone.style.top = '0';
    overlayClone.style.margin = '0';
    overlayClone.style.background = 'transparent';

    document.body.appendChild(overlayClone);

    try {
        return await html2canvas(overlayClone, {
            scale: scaleRatio,
            useCORS: true,
            backgroundColor: null,
            width: heroSection.offsetWidth,
            height: heroSection.offsetHeight,
            windowWidth: heroSection.offsetWidth,
            windowHeight: heroSection.offsetHeight
        });
    } finally {
        overlayClone.remove();
    }
}

function drawHeroImageToCanvas(ctx, img, heroRect, imgSettings) {
    if (!ctx || !img || !heroRect) {
        return;
    }

    const zoom = Math.max(0.01, (imgSettings?.scale || 100) / 100);
    const posX = Math.min(100, Math.max(0, imgSettings?.posX ?? 50)) / 100;
    const posY = Math.min(100, Math.max(0, imgSettings?.posY ?? 50)) / 100;

    const coverScale = Math.max(heroRect.width / img.naturalWidth, heroRect.height / img.naturalHeight);
        const drawWidth = img.naturalWidth * coverScale * zoom;
        const drawHeight = img.naturalHeight * coverScale * zoom;
        const drawX = heroRect.x + ((heroRect.width - drawWidth) * posX);
        const drawY = heroRect.y + ((heroRect.height - drawHeight) * posY);

    ctx.save();
    ctx.beginPath();
    ctx.rect(heroRect.x, heroRect.y, heroRect.width, heroRect.height);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
}

function drawCoverImageToCanvas(ctx, img, rect, options = {}) {
    if (!ctx || !img || !rect) {
        return;
    }

    const posX = Math.min(100, Math.max(0, options.posX ?? 50)) / 100;
    const posY = Math.min(100, Math.max(0, options.posY ?? 50)) / 100;
    const radius = Math.max(0, options.radius || 0);
    const coverScale = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    const drawWidth = img.naturalWidth * coverScale;
    const drawHeight = img.naturalHeight * coverScale;
    const drawX = rect.x + (rect.width - drawWidth) * posX;
    const drawY = rect.y + (rect.height - drawHeight) * posY;

    ctx.save();
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function' && radius > 0) {
        ctx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
    } else {
        ctx.rect(rect.x, rect.y, rect.width, rect.height);
    }
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
}

function drawCornerLogoToCanvas(ctx, img, rect, options = {}) {
    if (!ctx || !img || !rect) {
        return;
    }

    const scale = rect.width / 152;
    const logoWidth = 158 * scale;
    const logoHeight = logoWidth * (img.naturalHeight / img.naturalWidth);
    const logoX = rect.x + (2 * scale);
    const logoY = rect.y;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rect.x + rect.width, rect.y);
    ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
    ctx.closePath();
    ctx.fillStyle = options.printerFriendly ? '#ffffff' : '#000000';
    ctx.fill();
    ctx.clip();
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.drawImage(img, logoX, logoY, logoWidth, logoHeight);
    ctx.restore();
}

/**
 * Convert string to URL-friendly slug
 */
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
}

// ================================================
// EXPORT FOR EXTENSIBILITY
// ================================================

/**
 * Expose API for external use
 */
window.RecipeGenerator = {
    // Get current recipe data
    getRecipe: () => ({ ...currentRecipe }),

    // Set recipe data
    setRecipe: (recipe) => {
        currentRecipe = normalizeRecipe(recipe);
        loadRecipeToForm(currentRecipe);
        renderRecipePage();
    },

    // Available materials (getter to return current loaded materials)
    get materials() { return AVAILABLE_MATERIALS; },

    // Export as JSON string
    exportJson: () => JSON.stringify(currentRecipe, null, 2),

    // Import from JSON string
    importJson: (jsonString) => {
        try {
            const recipe = normalizeRecipe(JSON.parse(jsonString));
            currentRecipe = recipe;
            loadRecipeToForm(recipe);
            renderRecipePage();
            return true;
        } catch (e) {
            console.error('Import error:', e);
            return false;
        }
    }
};
