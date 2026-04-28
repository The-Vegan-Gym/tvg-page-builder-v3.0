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

const FALLBACK_EQUIPMENT_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="8" y="8" width="32" height="32" rx="6" stroke="black" stroke-width="2"/>
<path d="M16 24H32" stroke="black" stroke-width="2" stroke-linecap="round"/>
<path d="M24 16V32" stroke="black" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const WHISK_EQUIPMENT_SVG = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M33.5 9.5C35.1569 7.84315 37.8431 7.84315 39.5 9.5C41.1569 11.1569 41.1569 13.8431 39.5 15.5L30 25" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18 30L30 18" stroke="black" stroke-width="2.2" stroke-linecap="round"/>
<path d="M15.5 17.5C17.9 19.4 20.1 21.6 22 24" stroke="black" stroke-width="2.2" stroke-linecap="round"/>
<path d="M12 21C14.8 22.8 17.2 25.2 19 28" stroke="black" stroke-width="2.2" stroke-linecap="round"/>
<path d="M10 25C12.5 26.4 14.6 28.5 16 31" stroke="black" stroke-width="2.2" stroke-linecap="round"/>
<path d="M18 30L22 34C23.8 35.8 23.8 38.7 22 40.5C20.2 42.3 17.3 42.3 15.5 40.5L7.5 32.5C5.7 30.7 5.7 27.8 7.5 26C9.3 24.2 12.2 24.2 14 26L18 30Z" stroke="black" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
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
    title: "",
    image: "",
    heroHeight: 309,
    imageSettings: {
        scale: 100,
        posX: 50,
        posY: 50
    },
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
    ingredientSections: [],
    instructionsLabel: "Instructions for 1 Serving",
    instructionsStartMode: "auto",
    materialsLayout: "full-width",
    materials: [],
    ingredients: [],
    instructionSections: [],
    instructions: [],
    note: "",
    pageNumber: ""
};

// ================================================
// STATE MANAGEMENT
// ================================================

/**
 * Current recipe state
 */
let currentRecipe = { ...EMPTY_RECIPE };
let zoomLevel = 100;

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
        portionVariations: Array.isArray(recipe.portionVariations) ? recipe.portionVariations : [],
        portionVariationSections: Array.isArray(recipe.portionVariationSections) ? recipe.portionVariationSections : []
    };

    normalized.portionVariationSections = normalized.portionVariationSections
        .map((section) => ({
            label: section.label || 'Portion Variations',
            icon: section.icon ?? '',
            variations: Array.isArray(section.variations) ? section.variations : []
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
            variations: normalized.portionVariations
        }];
    }

    if (normalized.portionVariationSections.length > 0) {
        normalized.portionVariationsLabel = normalized.portionVariationSections[0].label || EMPTY_RECIPE.portionVariationsLabel;
        normalized.portionVariationIcon = normalized.portionVariationSections[0].icon || '';
        normalized.portionVariations = normalized.portionVariationSections[0].variations || [];
    }

    normalized.ingredientSections = normalized.ingredientSections
        .map((section) => ({
            label: section.label || EMPTY_RECIPE.servingsLabel,
            ingredients: Array.isArray(section.ingredients) ? section.ingredients : []
        }))
        .filter((section) => section.label || section.ingredients.length > 0);

    if (normalized.ingredientSections.length === 0 && (
        normalized.ingredients.length > 0 ||
        normalized.servingsLabel
    )) {
        normalized.ingredientSections = [{
            label: normalized.servingsLabel || EMPTY_RECIPE.servingsLabel,
            ingredients: normalized.ingredients
        }];
    }

    if (normalized.ingredientSections.length > 0) {
        normalized.servingsLabel = normalized.ingredientSections[0].label || EMPTY_RECIPE.servingsLabel;
        normalized.ingredients = normalized.ingredientSections[0].ingredients || [];
    }

    if (!normalized.instructionsLabel && normalized.instructionSections.length > 0) {
        normalized.instructionsLabel = normalized.instructionSections[0]?.label || EMPTY_RECIPE.instructionsLabel;
    }

    if ((!normalized.instructions || normalized.instructions.length === 0) && normalized.instructionSections.length > 0) {
        normalized.instructions = normalized.instructionSections[0]?.steps || [];
    }

    return normalized;
}

function getRecipePageDimensions() {
    const page = elements.recipePage();

    if (!page) {
        return { width: 0, height: 0 };
    }

    const previousTransform = page.style.transform;
    page.style.transform = 'none';
    const { width, height } = page.getBoundingClientRect();
    page.style.transform = previousTransform;

    return { width, height };
}

// ================================================
// DOM ELEMENTS
// ================================================

const elements = {
    // Form inputs
    masterPaste: () => document.getElementById('master-paste'),
    masterPasteStatus: () => document.getElementById('master-paste-status'),
    pageType: () => document.getElementById('page-type'),
    title: () => document.getElementById('title'),
    heroImage: () => document.getElementById('hero-image'),
    imageUploadArea: () => document.getElementById('image-upload-area'),
    imagePreviewThumb: () => document.getElementById('image-preview-thumb'),
    uploadPlaceholder: () => document.getElementById('upload-placeholder'),
    imageControls: () => document.getElementById('image-controls'),
    imageScale: () => document.getElementById('image-scale'),
    imageScaleValue: () => document.getElementById('image-scale-value'),
    heroHeight: () => document.getElementById('hero-height'),
    heroHeightValue: () => document.getElementById('hero-height-value'),
    imagePosX: () => document.getElementById('image-pos-x'),
    imagePosY: () => document.getElementById('image-pos-y'),
    description: () => document.getElementById('description'),
    pageNumber: () => document.getElementById('page-number'),
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
    selectedMaterialsPreview: () => document.getElementById('selected-materials-preview'),
    btnSelectEquipment: () => document.getElementById('btn-select-equipment'),
    equipmentOverlay: () => document.getElementById('equipment-overlay'),
    equipmentGrid: () => document.getElementById('equipment-grid'),
    btnCloseEquipment: () => document.getElementById('btn-close-equipment'),
    btnSaveEquipment: () => document.getElementById('btn-save-equipment'),
    servingsLabel: () => document.getElementById('servings-label'),
    ingredientsList: () => document.getElementById('ingredients-list'),
    addIngredientSection: () => document.getElementById('add-ingredient-section'),
    instructionsLabel: () => document.getElementById('instructions-label'),
    instructionsStartMode: () => document.getElementById('instructions-start-mode'),
    instructionsList: () => document.getElementById('instructions-list'),
    addInstruction: () => document.getElementById('add-instruction'),
    addInstructionSection: () => document.getElementById('add-instruction-section'),
    note: () => document.getElementById('note'),

    // Buttons
    btnFillAll: () => document.getElementById('btn-fill-all'),
    btnCopyAIInstructions: () => document.getElementById('btn-copy-ai-instructions'),
    btnCopyAIInfoInstructions: () => document.getElementById('btn-copy-ai-info-instructions'),
    btnCopyAIDayInstructions: () => document.getElementById('btn-copy-ai-day-instructions'),
    btnExportJpg: () => document.getElementById('btn-export-jpg'),
    btnPrint: () => document.getElementById('btn-print'),
    btnSaveJson: () => document.getElementById('btn-save-json'),
    btnLoadJson: () => document.getElementById('btn-load-json'),
    jsonFileInput: () => document.getElementById('json-file-input'),
    btnClear: () => document.getElementById('btn-clear'),
    btnZoomIn: () => document.getElementById('btn-zoom-in'),
    btnZoomOut: () => document.getElementById('btn-zoom-out'),
    btnCenterPreview: () => document.getElementById('btn-center-preview'),
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
    initializeMaterialsSelector();
    initializeFormListeners();
    initializeButtonListeners();
    loadRecipeToForm(currentRecipe);
    renderRecipePage();
    setZoomToFit();
});

/**
 * Load icons from the JSON database
 */
async function loadIconsDatabase() {
    try {
        const response = await fetch('icons-database.json');
        const data = await response.json();

        // Convert equipment array to AVAILABLE_MATERIALS format
        AVAILABLE_MATERIALS = data.equipment.map(item => ({
            id: slugify(item.name),
            name: item.name,
            svg: getSafeEquipmentSvg(item)
        }));

        console.log(`Loaded ${AVAILABLE_MATERIALS.length} equipment icons`);
    } catch (error) {
        console.error('Error loading icons database:', error);
        // Fallback to empty array if loading fails
        AVAILABLE_MATERIALS = [];
    }
}

function getSafeEquipmentSvg(item) {
    if (normalizeMaterialName(item?.name) === 'whisk') {
        return WHISK_EQUIPMENT_SVG;
    }

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

function populatePortionVariationIconOptions() {
    const selects = elements.portionVariationSections()?.querySelectorAll('.portion-variation-section-icon') || [];
    selects.forEach((select) => {
        const selectedValue = select.value || '';
        select.innerHTML = `
            <option value="">Default Bowl</option>
            <option value="none">None</option>
        `;

        AVAILABLE_MATERIALS.forEach((material) => {
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
            return `<div class="selected-material-item" title="${material.name}">${material.svg}</div>`;
        }).join('');
    }
}

/**
 * Initialize form input listeners for live preview
 */
function initializeFormListeners() {
    // Text inputs
    const textInputs = ['title', 'description', 'pageNumber', 'calories', 'protein', 'carbs', 'fat', 'servingsLabel', 'instructionsLabel', 'note', 'dayHighlightsTitle', 'dayTipsTitle', 'dayMealsTitle', 'dayBreakdownTitle', 'dayTotalsTitle'];
    textInputs.forEach(id => {
        const element = elements[id.replace('-', '')]?.() || document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(updateRecipeFromForm, 150));
        }
    });

    elements.dayHighlights()?.addEventListener('input', debounce(updateRecipeFromForm, 150));
    elements.dayTips()?.addEventListener('input', debounce(updateRecipeFromForm, 150));
    elements.pageType()?.addEventListener('change', () => {
        updatePageTypeVisibility(elements.pageType().value);
        updateRecipeFromForm();
    });

    // Materials layout
    elements.materialsLayout()?.addEventListener('change', debounce(updateRecipeFromForm, 150));
    elements.instructionsStartMode()?.addEventListener('change', debounce(updateRecipeFromForm, 150));

    // Image upload
    elements.imageUploadArea()?.addEventListener('click', () => {
        elements.heroImage()?.click();
    });

    elements.heroImage()?.addEventListener('change', handleImageUpload);

    // Image controls
    elements.imageScale()?.addEventListener('input', () => {
        const value = elements.imageScale().value;
        elements.imageScaleValue().textContent = `${value}%`;
        updateRecipeFromForm();
    });

    elements.heroHeight()?.addEventListener('input', () => {
        const value = elements.heroHeight().value;
        elements.heroHeightValue().textContent = `${value}px`;
        updateRecipeFromForm();
    });

    elements.imagePosX()?.addEventListener('input', () => {
        updateRecipeFromForm();
    });

    elements.imagePosY()?.addEventListener('input', () => {
        updateRecipeFromForm();
    });

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

    // Add instruction button
    elements.addInstruction()?.addEventListener('click', () => {
        addInstructionRowToLastSection();
    });

    elements.addInstructionSection()?.addEventListener('click', () => {
        addInstructionSectionEditor();
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
    elements.btnFillAll()?.addEventListener('click', handleFillAll);
    elements.btnCopyAIInstructions()?.addEventListener('click', handleCopyAIInstructions);
    elements.btnCopyAIInfoInstructions()?.addEventListener('click', handleCopyAIInfoInstructions);
    elements.btnCopyAIDayInstructions()?.addEventListener('click', handleCopyAIDayInstructions);
    elements.btnCopyDayMealsPrompt()?.addEventListener('click', handleCopyDayMealsPrompt);

    // Export JPG button
    elements.btnExportJpg()?.addEventListener('click', handleExportJpg);

    // Print button
    elements.btnPrint()?.addEventListener('click', handlePrint);

    // Save JSON button
    elements.btnSaveJson()?.addEventListener('click', handleSaveJson);

    // Load JSON button
    elements.btnLoadJson()?.addEventListener('click', () => {
        elements.jsonFileInput()?.click();
    });

    elements.jsonFileInput()?.addEventListener('change', handleLoadJson);

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
    elements.pageType().value = recipe.pageType || 'recipe';
    elements.title().value = recipe.title || '';
    elements.description().value = recipe.description || '';
    elements.pageNumber().value = recipe.pageNumber || '';
    elements.calories().value = recipe.macros?.calories || '';
    elements.protein().value = recipe.macros?.protein || '';
    elements.carbs().value = recipe.macros?.carbs || '';
    elements.fat().value = recipe.macros?.fat || '';
    elements.servingsLabel().value = recipe.servingsLabel || 'Ingredients for 1 Serving';
    elements.instructionsLabel().value = recipe.instructionsLabel || 'Instructions for 1 Serving';
    if (elements.instructionsStartMode()) {
        elements.instructionsStartMode().value = recipe.instructionsStartMode || 'auto';
    }
    elements.materialsLayout().value = recipe.materialsLayout || 'full-width';
    elements.note().value = recipe.note || '';
    elements.dayHighlightsTitle().value = recipe.dayHighlightsTitle || 'Nutrition Highlights';
    elements.dayTipsTitle().value = recipe.dayTipsTitle || 'Tips for Success';
    elements.dayMealsTitle().value = recipe.dayMealsTitle || 'Meals';
    elements.dayBreakdownTitle().value = recipe.dayBreakdownTitle || 'Macronutrient Breakdown';
    elements.dayTotalsTitle().value = recipe.dayTotalsTitle || 'Daily Totals';
    elements.dayHighlights().value = (recipe.dayHighlights || []).join('\n');
    elements.dayTips().value = (recipe.dayTips || []).join('\n');
    elements.heroHeight().value = recipe.heroHeight || 309;
    elements.heroHeightValue().textContent = `${recipe.heroHeight || 309}px`;
    updatePageTypeVisibility(recipe.pageType || 'recipe');

    // Load image if present
    if (recipe.image) {
        elements.imagePreviewThumb().src = recipe.image;
        elements.imageUploadArea().classList.add('has-image');
        elements.imageControls()?.classList.add('visible');
        // Load image settings
        const imgSettings = recipe.imageSettings || { scale: 100, posX: 50, posY: 50 };
        elements.imageScale().value = imgSettings.scale;
        elements.imageScaleValue().textContent = `${imgSettings.scale}%`;
        elements.imagePosX().value = imgSettings.posX;
        elements.imagePosY().value = imgSettings.posY;
    } else {
        elements.imageUploadArea().classList.remove('has-image');
        elements.imageControls()?.classList.remove('visible');
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
                index === 0
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
            index === 0
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
            section.startMode || 'auto',
            section.stepStyle || 'numbered'
        );
    });

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
    const primaryIngredientSection = ingredientSections[0] || { label: 'Ingredients for 1 Serving', ingredients: [] };

    currentRecipe = {
        pageType: elements.pageType()?.value || 'recipe',
        title: elements.title()?.value || '',
        image: elements.imagePreviewThumb()?.src || '',
        heroHeight: parseInt(elements.heroHeight()?.value, 10) || 309,
        imageSettings: {
            scale: parseInt(elements.imageScale()?.value) || 100,
            posX: parseInt(elements.imagePosX()?.value) || 50,
            posY: parseInt(elements.imagePosY()?.value) || 50
        },
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
        servingsLabel: primaryIngredientSection.label || 'Ingredients for 1 Serving',
        instructionsLabel: elements.instructionsLabel()?.value || 'Instructions for 1 Serving',
        instructionsStartMode: instructionSections[0]?.startMode || elements.instructionsStartMode()?.value || 'auto',
        materialsLayout: elements.materialsLayout()?.value || 'full-width',
        materials: getSelectedMaterials(),
        ingredients: primaryIngredientSection.ingredients || [],
        ingredientSections,
        instructionSections,
        instructions: instructionSections[0]?.steps || getInstructionsFromForm(),
        note: elements.note()?.value || '',
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

function updatePageTypeVisibility(pageType = 'recipe') {
    document.querySelectorAll('.recipe-only').forEach((section) => {
        section.style.display = pageType === 'recipe' ? '' : 'none';
    });

    document.querySelectorAll('.day-plan-only').forEach((section) => {
        section.style.display = pageType === 'day-of-eating' ? '' : 'none';
    });
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
            label: section.label || 'Ingredients for 1 Serving',
            ingredients: Array.isArray(section.ingredients) ? section.ingredients : []
        }))
        .filter((section) => section.label || section.ingredients.length > 0);

    if (normalizedSections.length > 0) {
        return normalizedSections;
    }

    return [{
        label: recipe.servingsLabel || 'Ingredients for 1 Serving',
        ingredients: recipe.ingredients || []
    }];
}

function getIngredientSectionsFromForm() {
    const sections = Array.from(elements.ingredientsList()?.querySelectorAll('.ingredient-section-editor') || [])
        .map((section, index) => {
            const labelInput = section.querySelector('.ingredient-section-label');
            const label = index === 0
                ? (elements.servingsLabel()?.value || 'Ingredients for 1 Serving')
                : ((labelInput?.value || '').trim() || `Ingredients Section ${index + 1}`);
            const ingredients = Array.from(section.querySelectorAll('.ingredient-row'))
                .map((row) => ({
                    name: row.querySelector('.ingredient-name')?.value || '',
                    amount: row.querySelector('.ingredient-amount')?.value || ''
                }))
                .filter((ingredient) => ingredient.name || ingredient.amount);

            return { label, ingredients };
        })
        .filter((section) => section.label || section.ingredients.length > 0);

    if (sections.length === 0) {
        return [{
            label: elements.servingsLabel()?.value || 'Ingredients for 1 Serving',
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
            variations: Array.isArray(section.variations) ? section.variations : []
        }))
        .filter((section) => section.label || section.icon || section.variations.length > 0);

    if (normalizedSections.length > 0) {
        return normalizedSections;
    }

    return [{
        label: recipe.portionVariationsLabel || 'Portion Variations',
        icon: recipe.portionVariationIcon || '',
        variations: Array.isArray(recipe.portionVariations) ? recipe.portionVariations : []
    }];
}

function getPortionVariationSectionsFromForm() {
    const sections = Array.from(elements.portionVariationSections()?.querySelectorAll('.portion-variation-section-editor') || [])
        .map((section, index) => {
            const labelInput = section.querySelector('.portion-variation-section-label');
            const label = ((labelInput?.value || '').trim() || `Portion Variations ${index + 1}`);
            const icon = section.querySelector('.portion-variation-section-icon')?.value ?? '';
            const variations = Array.from(section.querySelectorAll('.portion-variation-row'))
                .map((row) => ({
                    label: row.querySelector('.portion-variation-label')?.value || '',
                    calories: row.querySelector('.portion-variation-calories')?.value || '',
                    protein: row.querySelector('.portion-variation-protein')?.value || '',
                    carbs: row.querySelector('.portion-variation-carbs')?.value || '',
                    fat: row.querySelector('.portion-variation-fat')?.value || '',
                    fiber: row.querySelector('.portion-variation-fiber')?.value || '',
                    url: row.querySelector('.portion-variation-url')?.value || ''
                }))
                .filter((variation) =>
                    variation.label || variation.calories || variation.protein || variation.carbs || variation.fat || variation.fiber || variation.url
                );

            return { label, icon, variations };
        })
        .filter((section) => section.label || section.icon || section.variations.length > 0);

    if (sections.length === 0) {
        return [{
            label: 'Portion Variations',
            icon: '',
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

function getInstructionSectionsForForm(recipe) {
    const normalizedSections = (recipe.instructionSections || [])
        .map(section => ({
            label: section.label || 'Instructions',
            startMode: section.startMode || 'auto',
            stepStyle: section.stepStyle || 'numbered',
            steps: Array.isArray(section.steps) ? section.steps : []
        }))
        .filter(section => section.label || section.steps.length > 0);

    if (normalizedSections.length > 0) {
        return normalizedSections;
    }

    return [{
        label: recipe.instructionsLabel || 'Instructions for 1 Serving',
        startMode: recipe.instructionsStartMode || 'auto',
        stepStyle: 'numbered',
        steps: recipe.instructions || []
    }];
}

function getInstructionSectionsFromForm() {
    const sections = Array.from(elements.instructionsList()?.querySelectorAll('.instruction-section-editor') || [])
        .map((section, index) => {
            const labelInput = section.querySelector('.instruction-section-label');
            const label = index === 0
                ? (elements.instructionsLabel()?.value || 'Instructions for 1 Serving')
                : ((labelInput?.value || '').trim() || `Instructions Section ${index + 1}`);
            const startMode = section.querySelector('.instruction-section-start-mode')?.value || 'auto';
            const stepStyle = section.querySelector('.instruction-section-step-style')?.value || 'numbered';
            const steps = Array.from(section.querySelectorAll('.instruction-row'))
                .map(row => row.querySelector('textarea')?.value || '')
                .filter(Boolean);

            return { label, startMode, stepStyle, steps };
        })
        .filter(section => section.label || section.steps.length > 0);

    if (sections.length === 0) {
        return [{
            label: elements.instructionsLabel()?.value || 'Instructions for 1 Serving',
            startMode: 'auto',
            stepStyle: 'numbered',
            steps: []
        }];
    }

    return sections;
}

function parseDayMealPasteBlock(text) {
    return String(text || '')
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
    return String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const parts = line.split(';');
            const name = (parts.shift() || '').trim();
            const amount = parts.join(';').trim();
            return { name, amount };
        })
        .filter((ingredient) => ingredient.name || ingredient.amount);
}

/**
 * Add a new ingredient row to the form
 */
function addIngredientSectionEditor(label = '', ingredients = [], isPrimary = false) {
    const container = elements.ingredientsList();
    if (!container) return;

    const section = document.createElement('div');
    section.className = 'ingredient-section-editor';
    section.innerHTML = `
        <div class="ingredient-section-editor-header">
            <input type="text" class="ingredient-section-label" placeholder="Ingredient set label" value="${escapeHtml(label || 'Ingredients for 1 Serving')}">
            ${isPrimary ? '' : '<button type="button" class="btn-remove" title="Remove Section">×</button>'}
        </div>
        <div class="ingredient-section-paste">
            <textarea class="ingredient-section-paste-input" rows="4" placeholder="Paste ingredients here, one per line:&#10;Chia seeds;1/2 cup (80 g)&#10;Vanilla extract;1 tsp (4 g)"></textarea>
            <button type="button" class="btn-secondary btn-ingredient-paste">Paste Into This Set</button>
        </div>
        <div class="ingredient-section-rows"></div>
        <div class="ingredient-section-actions">
            <button type="button" class="btn-add btn-add-ingredient-inline">+ Add Ingredient</button>
        </div>
    `;

    const labelInput = section.querySelector('.ingredient-section-label');
    if (isPrimary) {
        labelInput.value = elements.servingsLabel()?.value || label || 'Ingredients for 1 Serving';
        labelInput.readOnly = true;
    } else {
        labelInput.addEventListener('input', debounce(updateRecipeFromForm, 150));
    }

    section.querySelector('.btn-add-ingredient-inline')?.addEventListener('click', () => {
        addIngredientRow('', '', section.querySelector('.ingredient-section-rows'));
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
            addIngredientRow(ingredient.name, ingredient.amount, rowsContainer);
        });
        pasteInput.value = '';
        updateRecipeFromForm();
    });

    section.querySelector('.btn-remove')?.addEventListener('click', () => {
        section.remove();
        updateRecipeFromForm();
    });

    container.appendChild(section);

    const rowsContainer = section.querySelector('.ingredient-section-rows');
    (ingredients.length ? ingredients : [{}]).forEach((ingredient) => {
        addIngredientRow(ingredient.name || '', ingredient.amount || '', rowsContainer);
    });
}

function addIngredientRowToLastSection(name = '', amount = '') {
    let lastSectionRows = elements.ingredientsList()?.querySelector('.ingredient-section-editor:last-child .ingredient-section-rows');

    if (!lastSectionRows) {
        addIngredientSectionEditor(elements.servingsLabel()?.value || 'Ingredients for 1 Serving', [], true);
        lastSectionRows = elements.ingredientsList()?.querySelector('.ingredient-section-editor:last-child .ingredient-section-rows');
    }

    addIngredientRow(name, amount, lastSectionRows);
}

function addIngredientRow(name = '', amount = '', container = null) {
    const targetContainer = container || elements.ingredientsList()?.querySelector('.ingredient-section-editor:last-child .ingredient-section-rows');
    if (!targetContainer) return;

    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.innerHTML = `
        <input type="text" class="ingredient-name" placeholder="Ingredient name" value="${escapeHtml(name)}">
        <input type="text" class="ingredient-amount" placeholder="Amount" value="${escapeHtml(amount)}">
        <button type="button" class="btn-remove" title="Remove">×</button>
    `;

    row.querySelector('.ingredient-name').addEventListener('input', debounce(updateRecipeFromForm, 150));
    row.querySelector('.ingredient-amount').addEventListener('input', debounce(updateRecipeFromForm, 150));
    row.querySelector('.btn-remove').addEventListener('click', () => {
        row.remove();
        updateRecipeFromForm();
    });

    targetContainer.appendChild(row);
}

function addPortionVariationSectionEditor(label = '', icon = '', variations = [], isPrimary = false) {
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

    section.querySelector('.btn-add-portion-inline')?.addEventListener('click', () => {
        addPortionVariationRow({}, section.querySelector('.portion-variation-section-rows'));
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

    AVAILABLE_MATERIALS.forEach((material) => {
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

    const row = document.createElement('div');
    row.className = 'portion-variation-row';
    row.innerHTML = `
        <div class="portion-variation-main">
            <input type="text" class="portion-variation-label" placeholder="Portion label, e.g. 1/2 cup (75 g)" value="${escapeHtml(variation.label || '')}">
            <button type="button" class="btn-remove" title="Remove">×</button>
        </div>
        <div class="portion-variation-macros">
            <input type="text" class="portion-variation-calories" placeholder="cal" value="${escapeHtml(variation.calories || '')}">
            <input type="text" class="portion-variation-protein" placeholder="pro" value="${escapeHtml(variation.protein || '')}">
            <input type="text" class="portion-variation-carbs" placeholder="carb" value="${escapeHtml(variation.carbs || '')}">
            <input type="text" class="portion-variation-fat" placeholder="fat" value="${escapeHtml(variation.fat || '')}">
            <input type="text" class="portion-variation-fiber" placeholder="fiber" value="${escapeHtml(variation.fiber || '')}">
        </div>
        <div class="portion-variation-link-row">
            <input type="url" class="portion-variation-url" placeholder="Purchase URL (optional)" value="${escapeHtml(variation.url || '')}">
        </div>
    `;

    row.querySelectorAll('input').forEach((input) => {
        input.addEventListener('input', debounce(updateRecipeFromForm, 150));
    });

    row.querySelector('.btn-remove')?.addEventListener('click', () => {
        row.remove();
        updateRecipeFromForm();
    });

    targetContainer.appendChild(row);
}

/**
 * Add a new instruction row to the form
 */
function addInstructionSectionEditor(label = '', steps = [], isPrimary = false, startMode = 'auto', stepStyle = 'numbered') {
    const container = elements.instructionsList();
    const section = document.createElement('div');
    section.className = 'instruction-section-editor';
    section.innerHTML = `
        <div class="instruction-section-editor-header">
            <input type="text" class="instruction-section-label" placeholder="Instruction set label" value="${escapeHtml(label || '')}">
            ${isPrimary ? '' : '<button type="button" class="btn-remove" title="Remove Section">×</button>'}
        </div>
        <div class="instruction-section-editor-meta">
            <div class="instruction-section-control">
                <label>Instructions Start</label>
                <select class="instruction-section-start-mode">
                    <option value="auto" ${startMode === 'auto' ? 'selected' : ''}>Auto</option>
                    <option value="force-right-column" ${startMode === 'force-right-column' ? 'selected' : ''}>Force right column</option>
                    <option value="keep-with-first-step" ${startMode === 'keep-with-first-step' ? 'selected' : ''}>Move to next column if header would orphan</option>
                </select>
            </div>
            <div class="instruction-section-control">
                <label>Step Style</label>
                <select class="instruction-section-step-style">
                    <option value="numbered" ${stepStyle === 'numbered' ? 'selected' : ''}>Numbered</option>
                    <option value="bulleted" ${stepStyle === 'bulleted' ? 'selected' : ''}>Bulleted</option>
                </select>
            </div>
        </div>
        <div class="instruction-section-steps"></div>
        <div class="instruction-section-actions">
            <button type="button" class="btn-add btn-add-step-inline">+ Add Step</button>
        </div>
    `;

    const labelInput = section.querySelector('.instruction-section-label');
    if (isPrimary) {
        labelInput.value = elements.instructionsLabel()?.value || label || 'Instructions for 1 Serving';
        labelInput.readOnly = true;
    } else {
        labelInput.addEventListener('input', debounce(updateRecipeFromForm, 150));
    }

    section.querySelector('.instruction-section-start-mode')?.addEventListener('change', debounce(updateRecipeFromForm, 150));
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
        renumberInstructions();
        updateRecipeFromForm();
    });

    container.appendChild(section);

    const stepsContainer = section.querySelector('.instruction-section-steps');
    (steps.length ? steps : ['']).forEach((stepText) => {
        addInstructionRow(stepText, stepsContainer);
    });

    renumberInstructions();
}

function addInstructionRowToLastSection(text = '') {
    let lastSectionSteps = elements.instructionsList()?.querySelector('.instruction-section-editor:last-child .instruction-section-steps');

    if (!lastSectionSteps) {
        addInstructionSectionEditor(elements.instructionsLabel()?.value || 'Instructions for 1 Serving', [], true, currentRecipe.instructionsStartMode || 'auto');
        lastSectionSteps = elements.instructionsList()?.querySelector('.instruction-section-editor:last-child .instruction-section-steps');
    }

    addInstructionRow(text, lastSectionSteps);
}

function addInstructionRow(text = '', container = null) {
    const targetContainer = container || elements.instructionsList();
    const stepNumber = targetContainer.querySelectorAll('.instruction-row').length + 1;

    const row = document.createElement('div');
    row.className = 'instruction-row';
    row.innerHTML = `
        <span class="step-number">${stepNumber}</span>
        <textarea placeholder="Enter instruction step...">${escapeHtml(text)}</textarea>
        <button type="button" class="btn-remove" title="Remove">×</button>
    `;

    row.querySelector('textarea').addEventListener('input', debounce(updateRecipeFromForm, 150));
    row.querySelector('.btn-remove').addEventListener('click', () => {
        row.remove();
        renumberInstructions();
        updateRecipeFromForm();
    });

    targetContainer.appendChild(row);
    renumberInstructions();
}

function getInstructionSectionStepStyle(section) {
    return section?.querySelector('.instruction-section-step-style')?.value || 'numbered';
}

function updateInstructionRowMarker(row, index, stepStyle = 'numbered') {
    const marker = row.querySelector('.step-number');
    if (!marker) return;

    if (stepStyle === 'bulleted') {
        marker.textContent = '';
        marker.classList.add('step-bullet');
        marker.setAttribute('aria-hidden', 'true');
        return;
    }

    marker.textContent = index + 1;
    marker.classList.remove('step-bullet');
    marker.removeAttribute('aria-hidden');
}

/**
 * Renumber instruction steps after deletion
 */
function renumberInstructions() {
    const sections = elements.instructionsList()?.querySelectorAll('.instruction-section-editor');
    sections?.forEach((section) => {
        const stepStyle = getInstructionSectionStepStyle(section);
        const rows = section.querySelectorAll('.instruction-row');
        rows.forEach((row, index) => {
            updateInstructionRowMarker(row, index, stepStyle);
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
        elements.imagePreviewThumb().src = imageData;
        elements.imageUploadArea().classList.add('has-image');
        elements.imageControls()?.classList.add('visible');
        currentRecipe.image = imageData;
        // Reset image settings for new image
        currentRecipe.imageSettings = { scale: 100, posX: 50, posY: 50 };
        elements.imageScale().value = 100;
        elements.imageScaleValue().textContent = '100%';
        elements.imagePosX().value = 50;
        elements.imagePosY().value = 50;
        renderRecipePage();
    };
    reader.readAsDataURL(file);
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
    page.className = 'recipe-page-stack';

    if ((recipe.pageType || 'recipe') === 'day-of-eating') {
        renderDayOfEatingPage(page, recipe);
        return;
    }

    // Build materials HTML
    const materialsLayout = recipe.materialsLayout || 'full-width';
    const materialsHtml = recipe.materials?.map(materialId => {
        const material = AVAILABLE_MATERIALS.find(m => m.id === materialId);
        if (!material) return '';
        return `<div class="material-icon-item" title="${material.name}">${material.svg}</div>`;
    }).join('') || '';

    // Materials section HTML
    const materialsSection = materialsHtml ? `
        <div class="materials-section">
            <h2 class="section-title">Materials</h2>
            <div class="materials-icons">
                ${materialsHtml}
            </div>
        </div>
    ` : '';

    // Build note callout HTML
    const noteHtml = recipe.note ? `
        <div class="note-callout">
            <span class="note-icon">
                <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.61077 2.89669L8.69799 2.17188L10.5101 2.89669L15.9462 9.05762L18.483 12.6817L17.3958 14.8561L11.9597 15.9434L6.16118 16.6682H3.62433L2.53711 14.8561L5.43637 6.88317L7.61077 2.89669Z" fill="white"/>
                    <g clip-path="url(#note-alert-clip)">
                        <path d="M18.9403 12.1813C18.9931 12.371 19.0667 12.8187 19.0775 13.016C19.1459 14.3101 18.1222 15.7543 16.8714 16.0776L5.27533 17.9952C3.0536 18.1176 1.4219 15.8355 2.24473 13.7381L6.27485 2.98732C7.5625 0.91819 9.89823 0.837898 11.4706 2.65637C13.9332 5.50314 16.2155 8.6012 18.617 11.5052C18.7084 11.7111 18.8805 11.9702 18.9403 12.1813ZM8.43708 2.87809C8.09644 2.98267 7.7394 3.28834 7.56083 3.59546C6.16362 7.22805 4.80389 10.8825 3.47758 14.5424C3.25967 15.6448 4.10124 16.6332 5.21018 16.5644L16.422 14.721C17.5977 14.3779 18.0466 12.9248 17.2273 11.9814L10.1333 3.26485C9.6573 2.82249 9.06082 2.68591 8.43708 2.87809Z" fill="black"/>
                        <path d="M9.12364 6.22816C9.51047 6.10778 9.94397 6.25884 10.1515 6.60989C10.3992 7.02821 10.3722 7.82076 10.4271 8.31936C10.5321 9.27083 10.6374 10.2209 10.7517 11.1715C10.7006 11.9037 9.72734 12.0637 9.44451 11.3864C9.19849 10.1044 8.81313 8.84059 8.56853 7.56318C8.46749 7.03523 8.52783 6.41301 9.12298 6.22827L9.12364 6.22816Z" fill="black"/>
                        <path d="M10.5686 14.1642C11.0525 14.0846 11.3798 13.6241 11.2994 13.1355C11.2191 12.6469 10.7616 12.3154 10.2777 12.395C9.7937 12.4746 9.46649 12.9351 9.54682 13.4237C9.62714 13.9122 10.0846 14.2438 10.5686 14.1642Z" fill="black"/>
                    </g>
                    <defs>
                        <clipPath id="note-alert-clip">
                            <rect width="17.1816" height="15.86" fill="white" transform="translate(0 2.78906) rotate(-9.33713)"/>
                        </clipPath>
                    </defs>
                </svg>
            </span>
            <span class="note-text">${escapeHtml(recipe.note)}</span>
        </div>
    ` : '';

    const heroHeight = Number.parseInt(recipe.heroHeight, 10) || 309;
    const heroImageHtml = createHeroImageMarkup(recipe);

    const macroValues = [
        recipe.macros?.calories,
        recipe.macros?.protein,
        recipe.macros?.carbs,
        recipe.macros?.fat
    ];
    const hasMacroData = macroValues.some(value => String(value || '').trim() !== '');
    const macroBarHtml = hasMacroData ? `
        <span>${recipe.macros?.calories || '0'} CAL</span>
        <span class="macro-divider">|</span>
        <span>${recipe.macros?.protein || '0'} G PROTEIN</span>
        <span class="macro-divider">|</span>
        <span>${recipe.macros?.carbs || '0'} G CARBS</span>
        <span class="macro-divider">|</span>
        <span>${recipe.macros?.fat || '0'} G FAT</span>
    ` : '';

    // Render the complete page
    page.innerHTML = `
        <div class="recipe-page page-primary">
            <!-- Hero Section -->
            <div class="hero-section" style="height: ${heroHeight}px;">
                ${heroImageHtml}
                <div class="hero-overlay"></div>
                <h1 class="recipe-title">${escapeHtml(recipe.title || 'Recipe Title')}</h1>
            </div>

            <!-- Macro Bar -->
            ${hasMacroData ? `
            <div class="macro-bar">
                <div class="macro-bar-content">
                    ${macroBarHtml}
                </div>
            </div>
            ` : ''}

            <!-- Description -->
            <div class="description-section">
                <p class="description-text">${escapeHtml(recipe.description || 'Recipe description goes here...')}</p>
            </div>

            <!-- Content Area -->
            <div class="content-area" data-materials-layout="${materialsLayout}">
                ${materialsLayout === 'full-width' ? materialsSection : ''}

                <div class="page-flow-grid" id="page-flow-grid">
                    <div class="flow-column" id="flow-slot-1"></div>
                    <div class="flow-column" id="flow-slot-2"></div>
                </div>
            </div>

            <!-- Page Footer -->
            <div class="page-footer">
                <span class="page-number">${escapeHtml(recipe.pageNumber || '')}</span>
            </div>
        </div>

        <div id="continuation-pages"></div>`;

    // Paginate ingredients and instructions in reading order after rendering
    requestAnimationFrame(() => {
        paginateRecipeFlow(noteHtml);
    });
}

function renderDayOfEatingPage(page, recipe) {
    const heroHeight = Number.parseInt(recipe.heroHeight, 10) || 309;
    const heroImageHtml = createHeroImageMarkup(recipe);
    const macroBarHtml = createMacroBarMarkup(recipe.macros);
    const hasMacroData = hasAnyMacroData(recipe.macros);
    const noteHtml = recipe.note ? `
        <div class="note-callout">
            <span class="note-icon">
                <svg width="20" height="19" viewBox="0 0 20 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.61077 2.89669L8.69799 2.17188L10.5101 2.89669L15.9462 9.05762L18.483 12.6817L17.3958 14.8561L11.9597 15.9434L6.16118 16.6682H3.62433L2.53711 14.8561L5.43637 6.88317L7.61077 2.89669Z" fill="white"/>
                    <g clip-path="url(#note-alert-clip-day)">
                        <path d="M18.9403 12.1813C18.9931 12.371 19.0667 12.8187 19.0775 13.016C19.1459 14.3101 18.1222 15.7543 16.8714 16.0776L5.27533 17.9952C3.0536 18.1176 1.4219 15.8355 2.24473 13.7381L6.27485 2.98732C7.5625 0.91819 9.89823 0.837898 11.4706 2.65637C13.9332 5.50314 16.2155 8.6012 18.617 11.5052C18.7084 11.7111 18.8805 11.9702 18.9403 12.1813ZM8.43708 2.87809C8.09644 2.98267 7.7394 3.28834 7.56083 3.59546C6.16362 7.22805 4.80389 10.8825 3.47758 14.5424C3.25967 15.6448 4.10124 16.6332 5.21018 16.5644L16.422 14.721C17.5977 14.3779 18.0466 12.9248 17.2273 11.9814L10.1333 3.26485C9.6573 2.82249 9.06082 2.68591 8.43708 2.87809Z" fill="black"/>
                        <path d="M9.12364 6.22816C9.51047 6.10778 9.94397 6.25884 10.1515 6.60989C10.3992 7.02821 10.3722 7.82076 10.4271 8.31936C10.5321 9.27083 10.6374 10.2209 10.7517 11.1715C10.7006 11.9037 9.72734 12.0637 9.44451 11.3864C9.19849 10.1044 8.81313 8.84059 8.56853 7.56318C8.46749 7.03523 8.52783 6.41301 9.12298 6.22827L9.12364 6.22816Z" fill="black"/>
                        <path d="M10.5686 14.1642C11.0525 14.0846 11.3798 13.6241 11.2994 13.1355C11.2191 12.6469 10.7616 12.3154 10.2777 12.395C9.7937 12.4746 9.46649 12.9351 9.54682 13.4237C9.62714 13.9122 10.0846 14.2438 10.5686 14.1642Z" fill="black"/>
                    </g>
                    <defs>
                        <clipPath id="note-alert-clip-day">
                            <rect width="17.1816" height="15.86" fill="white" transform="translate(0 2.78906) rotate(-9.33713)"/>
                        </clipPath>
                    </defs>
                </svg>
            </span>
            <span class="note-text">${escapeHtml(recipe.note)}</span>
        </div>
    ` : '';

    const mealsHtml = (recipe.dayMeals || []).map((meal) => createDayMealCardMarkup(meal)).join('');
    const breakdownSvg = createMacroBreakdownSvg(recipe.macros);
    const highlightsHtml = createDayListMarkup(recipe.dayHighlights || [], 'star');
    const tipsHtml = createDayListMarkup(recipe.dayTips || [], 'dot');

    page.innerHTML = `
        <div class="recipe-page page-primary day-plan-page">
            <div class="hero-section" style="height: ${heroHeight}px;">
                ${heroImageHtml}
                <div class="hero-overlay"></div>
                <h1 class="recipe-title">${escapeHtml(recipe.title || 'Day of Eating')}</h1>
            </div>

            ${hasMacroData ? `
            <div class="macro-bar">
                <div class="macro-bar-content">
                    ${macroBarHtml}
                </div>
            </div>
            ` : ''}

            <div class="description-section">
                <p class="description-text">${escapeHtml(recipe.description || '')}</p>
            </div>

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
                        ${noteHtml ? `<div class="day-plan-note">${noteHtml}</div>` : ''}
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

            <div class="page-footer">
                <span class="page-number">${escapeHtml(recipe.pageNumber || '')}</span>
            </div>
        </div>
        <div id="continuation-pages"></div>
    `;

    requestAnimationFrame(() => {
        paginateDayPlanFlow();
    });
}

function createHeroImageMarkup(recipe) {
    const imgSettings = recipe.imageSettings || { scale: 100, posX: 50, posY: 50 };
    return recipe.image
        ? `<img class="hero-image" src="${recipe.image}" alt="${escapeHtml(recipe.title)}" style="transform: scale(${imgSettings.scale / 100}); object-position: ${imgSettings.posX}% ${imgSettings.posY}%;">`
        : `<div class="hero-placeholder">No image uploaded</div>`;
}

function hasAnyMacroData(macros = {}) {
    return ['calories', 'protein', 'carbs', 'fat'].some((key) => String(macros?.[key] || '').trim() !== '');
}

function createMacroBarMarkup(macros = {}) {
    return `
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
    const item = document.createElement('div');
    item.className = 'ingredient-item';
    item.innerHTML = `
        <span class="ingredient-name-cell">${escapeHtml(ingredient.name)}</span>
        <span class="ingredient-amount-cell">${escapeHtml(ingredient.amount)}</span>
    `;
    return item;
}

function createMaterialsNode(materialsHtml) {
    const wrapper = document.createElement('div');
    wrapper.className = 'materials-section materials-section--flow';
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
    const selectedIcon = AVAILABLE_MATERIALS.find(material => material.id === selectedIconId);
    return selectedIcon?.svg || DEFAULT_PORTION_VARIATION_SVG;
}

function createPortionVariationsNode(section) {
    const iconSvg = getPortionVariationIconSvg(section.icon || '');
    const variations = section.variations || [];
    const wrapper = document.createElement('div');
    wrapper.className = 'portion-variations-section portion-variations-section--flow';
    wrapper.innerHTML = `
        <h2 class="section-title">${escapeHtml(section.label || 'Portion Variations')}</h2>
        <div class="portion-variation-cards">
            ${variations.map((variation) => `
                ${buildPortionVariationCardHtml(variation, iconSvg)}
            `).join('')}
        </div>
    `;
    return wrapper;
}

function buildPortionVariationCardHtml(variation, iconSvg) {
    const safeUrl = normalizeExternalUrl(variation.url || '');
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
            <span class="portion-variation-card-label">${escapeHtml(variation.label || '')}</span>
            ${linkIconHtml}
        </div>
        <div class="portion-variation-card-macros">
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
        </div>
    `;

    if (safeUrl) {
        return `
            <a class="portion-variation-card portion-variation-card--link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">
                ${contentHtml}
            </a>
        `;
    }

    return `
        <div class="portion-variation-card">
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

function createInstructionContinuationHeaderNode() {
    const title = (currentRecipe.title || 'Recipe').trim();
    return createInstructionHeaderNode(`${title} - Directions continued`);
}

function createInstructionNode(text, index, stepStyle = 'numbered') {
    const item = document.createElement('div');
    item.className = 'instruction-item';
    const markerHtml = stepStyle === 'bulleted'
        ? '<span class="instruction-bullet" aria-hidden="true"></span>'
        : `<span class="instruction-number">${index + 1}</span>`;
    item.innerHTML = `
        ${markerHtml}
        <span class="instruction-text">${escapeHtml(text)}</span>
    `;
    return item;
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
    const heroHeight = Number.parseInt(currentRecipe.heroHeight, 10) || 309;
    const heroImageHtml = createHeroImageMarkup(currentRecipe);

    return `
        <div class="recipe-page recipe-page--continuation">
            <div class="hero-section hero-section--continuation" style="height: ${heroHeight}px;">
                ${heroImageHtml}
                <div class="hero-overlay"></div>
            </div>
            <div class="content-area content-area--continuation">
                <div class="page-flow-grid">
                    <div class="flow-column" data-flow-slot="continuation-left"></div>
                    <div class="flow-column" data-flow-slot="continuation-right"></div>
                </div>
            </div>
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

    const primarySlotHeight = Math.max(0, footer.offsetTop - primaryGrid.offsetTop);

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
        const continuationHeight = Math.max(0, continuationFooter.offsetTop - continuationGrid.offsetTop);

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

    function ensureInstructionContinuationHeader() {
        const slot = getCurrentSlot();
        if (!isContinuationSlot(slot) || slot.columnIndex !== 0) {
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
    }

    const ingredientSections = getIngredientSectionsForForm(currentRecipe)
        .filter((section) => section.ingredients.length > 0);
    const portionVariationSections = getPortionVariationSectionsForForm(currentRecipe)
        .filter((section) => section.variations.length > 0);
    const instructionSections = getInstructionSectionsForForm(currentRecipe)
        .filter(section => section.steps.length > 0);
    const materialsLayout = currentRecipe.materialsLayout || 'full-width';
    const materialsHtml = (currentRecipe.materials || []).map((materialId) => {
        const material = AVAILABLE_MATERIALS.find(m => m.id === materialId);
        if (!material) return '';
        return `<div class="material-icon-item" title="${material.name}">${material.svg}</div>`;
    }).join('');

    if (materialsLayout === 'column' && materialsHtml) {
        placeNode(() => createMaterialsNode(materialsHtml));
    }

    portionVariationSections.forEach((section) => {
        placeNode(() => createPortionVariationsNode(section));
    });

    ingredientSections.forEach((section) => {
        placeNode(() => {
            const title = document.createElement('h2');
            title.className = 'section-title flow-section-title';
            title.textContent = section.label || 'Ingredients for 1 Serving';
            return title;
        });

        section.ingredients.forEach((ingredient) => {
            placeNode(() => createIngredientNode(ingredient));
        });
    });

    function applyInstructionStartMode(sectionLabel, sectionSteps, startMode, stepStyle = 'numbered') {
        if (startMode === 'force-right-column') {
            if (currentSlotIndex === 0 && slot1.children.length > 0) {
                advanceSlot();
            }
            return;
        }

        if (startMode === 'keep-with-first-step') {
            const slot = getCurrentSlot();
            const previewNodes = [createInstructionHeaderNode(sectionLabel)];

            if (sectionSteps.length > 0) {
                previewNodes.push(createInstructionNode(sectionSteps[0], 0, stepStyle));
            }

            if (!canFitNodeGroup(slot.element, slot.maxHeight, previewNodes) && slot.element.children.length > 0) {
                advanceSlot();
            }
        }
    }

    if (instructionSections.length > 0) {
        instructionSections.forEach((section) => {
            const stepStyle = section.stepStyle || 'numbered';
            applyInstructionStartMode(section.label || 'Instructions', section.steps, section.startMode || 'auto', stepStyle);
            placeInstructionNode(() => createInstructionHeaderNode(section.label || 'Instructions'));

            section.steps.forEach((instruction, index) => {
                placeInstructionNode(() => createInstructionNode(instruction, index, stepStyle));
            });
        });
    }

    if (noteHtml) {
        placeNode(() => createNoteNode(noteHtml));
    }
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

    const primaryMaxHeight = Math.max(
        0,
        ((totalsSection?.offsetTop ?? footer.offsetTop) - grid.offsetTop)
    );

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

        const continuationMaxHeight = Math.max(0, continuationFooter.offsetTop - continuationGrid.offsetTop);
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
}

// ================================================
// ACTION HANDLERS
// ================================================

/**
 * Handle JPG export (A4 at 300 DPI = 2480x3508 pixels)
 */
async function handleExportJpg() {
    const recipePageStack = elements.recipePage();
    const recipePages = Array.from(recipePageStack?.querySelectorAll('.recipe-page') || []);
    const exportBtn = elements.btnExportJpg();

    if (typeof html2canvas !== 'function') {
        alert('JPG export is unavailable because html2canvas did not load.');
        return;
    }

    // Show loading state
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Exporting...';
    exportBtn.disabled = true;

    try {
        if (recipePages.length === 0) {
            throw new Error('No recipe pages found for JPG export.');
        }

        const brandPrimary = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-primary')
            .trim() || '#42d53b';

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

            // Fix hero image for export. html2canvas is unreliable with object-fit on img tags.
            const heroImage = clone.querySelector('.hero-image');
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
                .recipe-title { color: #ffffff !important; }
                .macro-bar-content { background: ${brandPrimary} !important; color: #000000 !important; position: relative !important; }
                .macro-bar-content span { color: #000000 !important; position: relative !important; z-index: 1 !important; }
                .macro-bar-content .macro-divider { color: #000000 !important; }
                .description-text { color: #424242 !important; }
                .section-title { color: #000000 !important; }
                .ingredient-name-cell, .ingredient-amount-cell { color: #424242 !important; }
                .ingredient-item { border-bottom-color: #E0E0E0 !important; }
                .instruction-number { background: #b2b2b2 !important; color: #000000 !important; }
                .instructions-header { background: #000000 !important; color: #ffffff !important; }
                .instruction-text { color: #424242 !important; }
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
            const heroSectionHeight = heroSection?.offsetHeight || 0;
            const heroRect = heroSection ? {
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

            const heroOverlayCanvas = heroSection
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

            if (currentRecipe.image && heroRect) {
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
        alert('Error exporting image. Please try again.');
    } finally {
        // Restore button state
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    }
}

// ================================================
// MASTER PASTE FUNCTIONALITY
// ================================================

/**
 * Parse master paste text into recipe data
 */
function parseMasterPaste(text) {
    const result = {
        pageType: 'recipe',
        title: '',
        macros: { calories: '', protein: '', carbs: '', fat: '' },
        description: '',
        note: '',
        dayMealsTitle: 'Meals',
        dayBreakdownTitle: 'Macronutrient Breakdown',
        dayHighlightsTitle: 'Nutrition Highlights',
        dayTipsTitle: 'Tips for Success',
        dayTotalsTitle: 'Daily Totals',
        dayMeals: [],
        dayHighlights: [],
        dayTips: [],
        servingsLabel: 'Ingredients for 1 Serving',
        instructionsLabel: 'Instructions for 1 Serving',
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

    const lines = text.split('\n');
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
            currentIngredientSection = {
                label: labelMatch?.[1]?.trim() || result.servingsLabel || 'Ingredients for 1 Serving',
                ingredients: []
            };
            result.ingredientSections.push(currentIngredientSection);
            currentDirectionsSection = null;
            currentPortionVariationSection = null;
            currentDaySection = null;
            const sectionLabel = labelMatch?.[1]?.trim();
            if (sectionLabel) {
                result.servingsLabel = sectionLabel;
                currentIngredientSection.label = sectionLabel;
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
                startMode: parts[2] || 'auto',
                steps: []
            };
            result.instructionSections.push(currentDirectionsSection);
            if (result.instructionSections.length === 1) {
                result.instructionsLabel = currentDirectionsSection.label;
            }
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
            result.portionVariationIcon = parts[11] || '';

            // Auto-generate servings labels
            if (result.serves) {
                result.servingsLabel = `Ingredients for ${result.serves}`;
                result.instructionsLabel = `Instructions for ${result.serves}`;
            }
        } else if (currentSection === 'TEXT') {
            // First non-empty line in a text block could be a title
            if (textBlockContent.length === 0) {
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
                    url: parts[6] || ''
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
            // Each line is a step
            result.instructions.push(line);
            currentDirectionsSection?.steps.push(line);
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
            startMode: 'auto',
            steps: result.instructions
        }];
    }

    if (result.ingredientSections.length === 0 && result.ingredients.length > 0) {
        result.ingredientSections = [{
            label: result.servingsLabel || 'Ingredients for 1 Serving',
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
        // Additional text blocks go to note
        if (result.note) {
            result.note += '\n\n' + text;
        } else {
            result.note = text;
        }
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

function getExportTitle() {
    return (currentRecipe.title || '').trim() || 'Recipe';
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
            note: parsed.note,
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
Recipe Title;Meal Type;dietary flags;serves;prep time;cook time;calories;protein g;carbs g;fat g;equipment names (if there are no macros provided, return 0 for calories, protein, carbs, and fat - do not leave blank)

::TEXT::
Description or intro text (optional)

::TEXT::
Optional Note Title
Note or tip text (this becomes a callout box - if it says Note or Tip, put : after the title)

::INGREDIENTS::
Ingredient;Amount
Ingredient;Amount
...

OR if there are multiple ingredient groups:

::INGREDIENTS::
::TABLE Group Name::
Ingredient;Amount
Ingredient;Amount
::TABLE Another Group::
Ingredient;Amount
...

::DIRECTIONS::
Step one text
Step two text
Step three text
...

IMPORTANT RULES:
- Use EXACT section headers: ::META::, ::TEXT::, ::INGREDIENTS::, ::DIRECTIONS::
- META line must be semicolon-separated with exactly 11 fields
- For dietary flags, use: gf, sf, nf, wf (or leave blank)
- Serves examples: "4 Servings", "2-3 Servings", "1 Serving"
- Times should include units: "15 min", "1 hour", "30-45 min"
- The last META field is a comma-separated or pipe-separated list of equipment/material names inferred from the image and recipe data
- Only include real equipment choices such as bowl, pot, pan, blender, knife, cutting board, strainer, tray, containers, spoon, whisk, etc.
- If no equipment can be inferred, leave the last field blank but keep the semicolon
- ::TEXT:: sections (optional, can have 0-2):
  - First ::TEXT:: section = description (appears under title)
  - Second ::TEXT:: section = note/callout (appears in bottom callout box)
  - If a TEXT section has a title, put it on the first line
- Ingredient rows: Name;Amount (semicolon-separated)
- If the recipe/image/data contains 2 or more ingredient groups or components, you MUST preserve them as separate ingredient sets using ::TABLE Name::
- Examples of separate ingredient sets: smoothie + topping, salad + dressing, bowl + sauce, crust + filling, marinade + main recipe
- Do NOT flatten multiple ingredient groups into one list when the source clearly separates them
- Use ::TABLE Name:: for ingredient groups (optional when there is only one group, required when there are multiple groups)
- Directions: one step per line, no bullets, no numbering
- Do NOT add commentary, explanations, or markdown
- Output plain text only
- If a field is unknown, leave it blank but keep the semicolon

Example output:

::META::
Tofu Scramble;Breakfast;gf,sf;2 Servings;10 min;15 min;320;18;24;16;skillet, spatula, bowl

::TEXT::
A protein-packed breakfast that's ready in minutes.

::TEXT::
Chef's Tip
For best results, press the tofu for at least 15 minutes to remove excess moisture.

::INGREDIENTS::
Firm tofu;14 oz
Nutritional yeast;2 tbsp
Turmeric;1/2 tsp
Salt;1/4 tsp

Example with 2 ingredient sets:

::INGREDIENTS::
::TABLE Smoothie::
Banana;1
Frozen strawberries;1 cup
Soy milk;1 cup
::TABLE Topping::
Granola;2 tbsp
Chia seeds;1 tsp

::DIRECTIONS::
Press tofu and crumble into a bowl
Heat oil in a pan over medium heat
Add crumbled tofu and cook for 5 minutes
Add nutritional yeast, turmeric, and salt
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
Title;Reference Page;;1 Serving;;;calories;protein;carbs;fat;equipment names;portion variation icon

::TEXT::
Short description text

::TEXT::
Optional Note
Optional callout text

::INGREDIENTS Nutrition Highlights::
Highlight text;
Highlight text;
Highlight text;

::PORTION_VARIATIONS Brand or Group Name::
Label;Calories;Protein;Carbs;Fat;Fiber;URL
Label;Calories;Protein;Carbs;Fat;Fiber;URL

::PORTION_VARIATIONS Another Brand or Group Name::
Label;Calories;Protein;Carbs;Fat;Fiber;URL

::DIRECTIONS Ways to Enjoy;bulleted;auto::
Bullet point text
Bullet point text

::DIRECTIONS Preparing Fresh Product;numbered;auto::
Step text
Step text

IMPORTANT RULES:
- Output plain text only. No markdown. No commentary.
- Use EXACT section headers.
- META must be semicolon-separated.
- If macros are unknown, use 0.
- The 11th META field is equipment/materials. Leave blank if none.
- The 12th META field is the portion variation icon name. Use an existing equipment/material icon name or leave blank.
- Use the INGREDIENTS section for Nutrition Highlights when making info pages.
- For Nutrition Highlights, put each highlight on its own line with a trailing semicolon.
- Use one ::PORTION_VARIATIONS ...:: block per brand/group when needed.
- Each portion variation row format is: Label;Calories;Protein;Carbs;Fat;Fiber;URL
- Include URL when there is a product purchase page. Leave blank if not available.
- Each ::DIRECTIONS ...:: header format is: ::DIRECTIONS Label;step style;start mode::
- step style must be either numbered or bulleted
- start mode must be auto, force-right-column, or keep-with-first-step
- If a field is unknown, leave it blank but keep delimiters intact

Example:

::META::
Protein Bars;Reference Page;;1 Serving;;;190;15;11;7;protein bar;protein bar

::TEXT::
A quick reference page for high-protein snack bars with macro comparisons.

::INGREDIENTS Nutrition Highlights::
High in protein to support satiety;
Convenient shelf-stable snack option;
Can vary significantly in fiber and fat content;

::PORTION_VARIATIONS Misfits::
Caramel Fudge;190;15;11;7;5;https://example.com/caramel-fudge
Chocolate Brownie;195;15;8;9;12;https://example.com/chocolate-brownie

::PORTION_VARIATIONS No Cow::
Peanut Butter Chocolate Chip;190;20;7;5;19;https://example.com/pb-choc-chip

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
- Output plain text only. No markdown. No explanations

::META::
Page Title;Day of Eating;;1 Day;;;Total Calories;Total Protein;Total Carbs;Total Fat;

::TEXT::
Short day overview or description

::TEXT::
Optional Note
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
- Use one meal per line in ::DAY_MEALS::
- Meal Label examples: Breakfast, Lunch, Dinner, Snack, Mid-Morning Snack, Afternoon Snack, Evening Snack
- Meal row format must be exactly:
  Meal Label;Meal Name;Portion Note;Calories;Protein;Carbs;Fat
- Use numbers only for calories/protein/carbs/fat, without units
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
Note
This is a sample day of eating. Nutritional needs vary based on the individual.

::DAY_MEALS Meals::
Breakfast;Green Maca Smoothie;1 smoothie;516;24;64;26
Mid-Morning Snack;Raspberries;1 bowl;63;1;16;0
Lunch;Black Bean Cowboy Caviar;1 serving;418;20;70;10
Afternoon Snack;Almonds;1.5 oz;246;9;9;21
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
    const instructions = `Analyze the meal screenshots or meal data I provide and return ONLY plain text meal rows in this exact format:

Meal Label;Meal Name;Portion Note;Calories;Protein;Carbs;Fat

Rules:
- Output one meal per line
- No markdown
- No bullets
- No numbering
- No code fences
- No explanation before or after
- Keep the semicolon structure exactly the same
- Meal Label examples: Breakfast, Lunch, Dinner, Snack, Mid-Morning Snack, Afternoon Snack, Evening Snack
- Portion Note should be short, like "1 serving", "1 bowl", "1 smoothie", "1 plate", "1 bar", or "1 cup"
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
 * Handle saving recipe as JSON
 */
function handleSaveJson() {
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
        loadRecipeToForm(currentRecipe);
        renderRecipePage();
    }
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

    elements.zoomLevelDisplay().textContent = `${zoomLevel}%`;
    page.style.transform = `scale(${scale})`;

    // Update wrapper dimensions to match scaled page size
    // This prevents the scaled content from being cropped
    if (wrapper) {
        wrapper.style.width = `${pageWidth * scale}px`;
        wrapper.style.height = `${pageHeight * scale}px`;
    }
}

function centerPreview() {
    const container = elements.previewContainer();
    const wrapper = elements.recipePage()?.closest('.recipe-page-wrapper');

    if (!container || !wrapper) return;

    const containerRect = container.getBoundingClientRect();
    const wrapperRect = wrapper.getBoundingClientRect();

    const left = Math.max(
        0,
        container.scrollLeft + (wrapperRect.left - containerRect.left) - ((container.clientWidth - wrapperRect.width) / 2)
    );
    const top = Math.max(
        0,
        container.scrollTop + (wrapperRect.top - containerRect.top) - ((container.clientHeight - wrapperRect.height) / 2)
    );

    container.scrollTo({
        left,
        top,
        behavior: 'smooth'
    });
}

/**
 * Calculate and set zoom level to fit the page in the preview container
 */
function setZoomToFit() {
    const container = elements.previewContainer();
    const page = elements.recipePage();
    if (!container || !page) return;

    const containerStyles = getComputedStyle(container);
    const paddingX = parseFloat(containerStyles.paddingLeft) + parseFloat(containerStyles.paddingRight);
    const paddingY = parseFloat(containerStyles.paddingTop) + parseFloat(containerStyles.paddingBottom);
    const containerWidth = container.clientWidth - paddingX;
    const containerHeight = container.clientHeight - paddingY;
    const { width: pageWidth, height: pageHeight } = getRecipePageDimensions();

    if (!pageWidth || !pageHeight) return;

    // Calculate scale to fit entire page with some margin
    const scaleX = containerWidth / pageWidth;
    const scaleY = containerHeight / pageHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    zoomLevel = Math.round(scale * 100);
    updateZoom();
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
    overlayClone.querySelector('.hero-image, .hero-image-export, .hero-placeholder')?.remove();
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
    const coverWidth = img.naturalWidth * coverScale;
    const coverHeight = img.naturalHeight * coverScale;
    const baseX = (heroRect.width - coverWidth) * posX;
    const baseY = (heroRect.height - coverHeight) * posY;

    const drawWidth = coverWidth * zoom;
    const drawHeight = coverHeight * zoom;
    const drawX = heroRect.x + baseX - ((drawWidth - coverWidth) / 2);
    const drawY = heroRect.y + baseY - ((drawHeight - coverHeight) / 2);

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
