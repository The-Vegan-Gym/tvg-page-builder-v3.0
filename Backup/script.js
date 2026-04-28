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

/**
 * Empty recipe template (starts blank)
 */
const EMPTY_RECIPE = {
    title: "",
    image: "",
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
    servingsLabel: "Ingredients for 1 Serving",
    instructionsLabel: "Instructions for 1 Serving",
    leftColumnSteps: 3,
    materials: [],
    ingredients: [],
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

// ================================================
// DOM ELEMENTS
// ================================================

const elements = {
    // Form inputs
    title: () => document.getElementById('title'),
    heroImage: () => document.getElementById('hero-image'),
    imageUploadArea: () => document.getElementById('image-upload-area'),
    imagePreviewThumb: () => document.getElementById('image-preview-thumb'),
    uploadPlaceholder: () => document.getElementById('upload-placeholder'),
    imageControls: () => document.getElementById('image-controls'),
    imageScale: () => document.getElementById('image-scale'),
    imageScaleValue: () => document.getElementById('image-scale-value'),
    imagePosX: () => document.getElementById('image-pos-x'),
    imagePosY: () => document.getElementById('image-pos-y'),
    description: () => document.getElementById('description'),
    pageNumber: () => document.getElementById('page-number'),
    calories: () => document.getElementById('calories'),
    protein: () => document.getElementById('protein'),
    carbs: () => document.getElementById('carbs'),
    fat: () => document.getElementById('fat'),
    selectedMaterialsPreview: () => document.getElementById('selected-materials-preview'),
    btnSelectEquipment: () => document.getElementById('btn-select-equipment'),
    equipmentOverlay: () => document.getElementById('equipment-overlay'),
    equipmentGrid: () => document.getElementById('equipment-grid'),
    btnCloseEquipment: () => document.getElementById('btn-close-equipment'),
    btnSaveEquipment: () => document.getElementById('btn-save-equipment'),
    servingsLabel: () => document.getElementById('servings-label'),
    ingredientsList: () => document.getElementById('ingredients-list'),
    addIngredient: () => document.getElementById('add-ingredient'),
    instructionsLabel: () => document.getElementById('instructions-label'),
    leftColumnSteps: () => document.getElementById('left-column-steps'),
    instructionsList: () => document.getElementById('instructions-list'),
    addInstruction: () => document.getElementById('add-instruction'),
    note: () => document.getElementById('note'),

    // Buttons
    btnExportJpg: () => document.getElementById('btn-export-jpg'),
    btnPrint: () => document.getElementById('btn-print'),
    btnSaveJson: () => document.getElementById('btn-save-json'),
    btnLoadJson: () => document.getElementById('btn-load-json'),
    jsonFileInput: () => document.getElementById('json-file-input'),
    btnClear: () => document.getElementById('btn-clear'),
    btnZoomIn: () => document.getElementById('btn-zoom-in'),
    btnZoomOut: () => document.getElementById('btn-zoom-out'),
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
            svg: item.svg
        }));

        console.log(`Loaded ${AVAILABLE_MATERIALS.length} equipment icons`);
    } catch (error) {
        console.error('Error loading icons database:', error);
        // Fallback to empty array if loading fails
        AVAILABLE_MATERIALS = [];
    }
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
    const textInputs = ['title', 'description', 'pageNumber', 'calories', 'protein', 'carbs', 'fat', 'servingsLabel', 'instructionsLabel', 'note'];
    textInputs.forEach(id => {
        const element = elements[id.replace('-', '')]?.() || document.getElementById(id);
        if (element) {
            element.addEventListener('input', debounce(updateRecipeFromForm, 150));
        }
    });

    // Left column steps
    elements.leftColumnSteps()?.addEventListener('input', debounce(updateRecipeFromForm, 150));

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

    elements.imagePosX()?.addEventListener('input', () => {
        updateRecipeFromForm();
    });

    elements.imagePosY()?.addEventListener('input', () => {
        updateRecipeFromForm();
    });

    // Add ingredient button
    elements.addIngredient()?.addEventListener('click', () => {
        addIngredientRow();
    });

    // Add instruction button
    elements.addInstruction()?.addEventListener('click', () => {
        addInstructionRow();
    });
}

/**
 * Initialize action button listeners
 */
function initializeButtonListeners() {
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
}

// ================================================
// FORM MANAGEMENT
// ================================================

/**
 * Load recipe data into the form
 */
function loadRecipeToForm(recipe) {
    elements.title().value = recipe.title || '';
    elements.description().value = recipe.description || '';
    elements.pageNumber().value = recipe.pageNumber || '';
    elements.calories().value = recipe.macros?.calories || '';
    elements.protein().value = recipe.macros?.protein || '';
    elements.carbs().value = recipe.macros?.carbs || '';
    elements.fat().value = recipe.macros?.fat || '';
    elements.servingsLabel().value = recipe.servingsLabel || 'Ingredients for 1 Serving';
    elements.instructionsLabel().value = recipe.instructionsLabel || 'Instructions for 1 Serving';
    elements.leftColumnSteps().value = recipe.leftColumnSteps || 3;
    elements.note().value = recipe.note || '';

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
    currentRecipe.materials = recipe.materials || [];
    updateSelectedMaterialsPreview();

    // Load ingredients
    const ingredientsList = elements.ingredientsList();
    ingredientsList.innerHTML = '';
    (recipe.ingredients || []).forEach((ingredient, index) => {
        addIngredientRow(ingredient.name, ingredient.amount);
    });

    // Load instructions
    const instructionsList = elements.instructionsList();
    instructionsList.innerHTML = '';
    (recipe.instructions || []).forEach((instruction, index) => {
        addInstructionRow(instruction);
    });
}

/**
 * Update recipe state from form values
 */
function updateRecipeFromForm() {
    currentRecipe = {
        title: elements.title()?.value || '',
        image: elements.imagePreviewThumb()?.src || '',
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
        servingsLabel: elements.servingsLabel()?.value || 'Ingredients for 1 Serving',
        instructionsLabel: elements.instructionsLabel()?.value || 'Instructions for 1 Serving',
        leftColumnSteps: parseInt(elements.leftColumnSteps()?.value) || 3,
        materials: getSelectedMaterials(),
        ingredients: getIngredientsFromForm(),
        instructions: getInstructionsFromForm(),
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

/**
 * Get ingredients array from form
 */
function getIngredientsFromForm() {
    const rows = elements.ingredientsList()?.querySelectorAll('.ingredient-row');
    return Array.from(rows || []).map(row => ({
        name: row.querySelector('.ingredient-name')?.value || '',
        amount: row.querySelector('.ingredient-amount')?.value || ''
    })).filter(ing => ing.name || ing.amount);
}

/**
 * Get instructions array from form
 */
function getInstructionsFromForm() {
    const rows = elements.instructionsList()?.querySelectorAll('.instruction-row');
    return Array.from(rows || []).map(row =>
        row.querySelector('textarea')?.value || ''
    ).filter(inst => inst);
}

/**
 * Add a new ingredient row to the form
 */
function addIngredientRow(name = '', amount = '') {
    const container = elements.ingredientsList();
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

    container.appendChild(row);
}

/**
 * Add a new instruction row to the form
 */
function addInstructionRow(text = '') {
    const container = elements.instructionsList();
    const stepNumber = container.querySelectorAll('.instruction-row').length + 1;

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

    container.appendChild(row);
}

/**
 * Renumber instruction steps after deletion
 */
function renumberInstructions() {
    const rows = elements.instructionsList()?.querySelectorAll('.instruction-row');
    rows?.forEach((row, index) => {
        row.querySelector('.step-number').textContent = index + 1;
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

    // Build materials HTML
    const materialsHtml = recipe.materials?.map(materialId => {
        const material = AVAILABLE_MATERIALS.find(m => m.id === materialId);
        if (!material) return '';
        return `<div class="material-icon-item" title="${material.name}">${material.svg}</div>`;
    }).join('') || '';

    // Build ingredients HTML
    const ingredientsHtml = recipe.ingredients?.map(ing => `
        <div class="ingredient-item">
            <span class="ingredient-name-cell">${escapeHtml(ing.name)}</span>
            <span class="ingredient-amount-cell">${escapeHtml(ing.amount)}</span>
        </div>
    `).join('') || '';

    // Split instructions into left and right columns
    const leftSteps = recipe.leftColumnSteps || 3;
    const leftInstructions = recipe.instructions?.slice(0, leftSteps) || [];
    const rightInstructions = recipe.instructions?.slice(leftSteps) || [];

    const renderInstructions = (instructions, startIndex = 0) => {
        return instructions.map((inst, idx) => `
            <div class="instruction-item">
                <span class="instruction-number">${startIndex + idx + 1}</span>
                <span class="instruction-text">${escapeHtml(inst)}</span>
            </div>
        `).join('');
    };

    // Build note callout HTML
    const noteHtml = recipe.note ? `
        <div class="note-callout">
            <span class="note-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </span>
            <span class="note-text">${escapeHtml(recipe.note)}</span>
        </div>
    ` : '';

    // Hero image HTML with positioning
    const imgSettings = recipe.imageSettings || { scale: 100, posX: 50, posY: 50 };
    const heroImageHtml = recipe.image
        ? `<img class="hero-image" src="${recipe.image}" alt="${escapeHtml(recipe.title)}" style="transform: scale(${imgSettings.scale / 100}); object-position: ${imgSettings.posX}% ${imgSettings.posY}%;">`
        : `<div class="hero-placeholder">No image uploaded</div>`;

    // Macro bar content
    const macroBarHtml = `
        <span>${recipe.macros?.calories || '0'} CAL</span>
        <span class="macro-divider">|</span>
        <span>${recipe.macros?.protein || '0'} G PROTEIN</span>
        <span class="macro-divider">|</span>
        <span>${recipe.macros?.carbs || '0'} G CARBS</span>
        <span class="macro-divider">|</span>
        <span>${recipe.macros?.fat || '0'} G FAT</span>
    `;

    // Render the complete page
    page.innerHTML = `
        <!-- Hero Section -->
        <div class="hero-section">
            ${heroImageHtml}
            <div class="hero-overlay"></div>
            <h1 class="recipe-title">${escapeHtml(recipe.title || 'Recipe Title')}</h1>
        </div>

        <!-- Macro Bar -->
        <div class="macro-bar">
            <div class="macro-bar-content">
                ${macroBarHtml}
            </div>
        </div>

        <!-- Description -->
        <div class="description-section">
            <p class="description-text">${escapeHtml(recipe.description || 'Recipe description goes here...')}</p>
        </div>

        <!-- Content Area -->
        <div class="content-area">
            <!-- Left Column -->
            <div class="left-column">
                <!-- Materials -->
                <div class="materials-section">
                    <h2 class="section-title">Materials</h2>
                    <div class="materials-icons">
                        ${materialsHtml || '<span style="color:#999;font-size:0.8rem;">No materials selected</span>'}
                    </div>
                </div>

                <!-- Ingredients -->
                <div class="ingredients-section">
                    <h2 class="section-title">${escapeHtml(recipe.servingsLabel || 'Ingredients for 1 Serving')}</h2>
                    <div class="ingredients-table">
                        ${ingredientsHtml || '<div class="ingredient-item"><span style="color:#999;">No ingredients added</span></div>'}
                    </div>
                </div>

                <!-- Instructions Header -->
                <div class="instructions-header">${escapeHtml(recipe.instructionsLabel || 'Instructions for 1 Serving')}</div>

                <!-- Left Column Instructions -->
                <div class="instructions-list-display">
                    ${renderInstructions(leftInstructions, 0) || '<div class="instruction-item"><span style="color:#999;">No instructions added</span></div>'}
                </div>
            </div>

            <!-- Right Column -->
            <div class="right-column">
                <!-- Right Column Instructions -->
                <div class="instructions-list-display">
                    ${renderInstructions(rightInstructions, leftSteps)}
                </div>

                <!-- Note Callout -->
                ${noteHtml}
            </div>
        </div>

        <!-- Page Footer -->
        <div class="page-footer">
            <span class="page-number">${escapeHtml(recipe.pageNumber || '')}</span>
        </div>
    `;
}

// ================================================
// ACTION HANDLERS
// ================================================

/**
 * Handle JPG export (8x10.5 inches at 300 DPI = 2400x3150 pixels)
 */
async function handleExportJpg() {
    const recipePage = elements.recipePage();
    const exportBtn = elements.btnExportJpg();

    // Show loading state
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Exporting...';
    exportBtn.disabled = true;

    try {
        // CSS page dimensions (72 DPI)
        const cssPageWidth = 612;
        const cssPageHeight = 792;

        // Target export dimensions (locked)
        const targetWidth = 2480;
        const targetHeight = 3508;

        // Scale ratio for html2canvas
        const scaleRatio = targetWidth / cssPageWidth;

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
        clone.style.minHeight = `${cssPageHeight}px`;
        clone.style.transform = 'none';
        clone.style.position = 'relative';

        // Fix hero image for export (html2canvas doesn't support object-fit)
const heroImage = clone.querySelector('.hero-image');
if (heroImage) {
    const imgSettings = currentRecipe.imageSettings || { scale: 100, posX: 50, posY: 50 };

    heroImage.style.width = '100%';
    heroImage.style.height = '100%';
    heroImage.style.objectFit = 'cover';
    heroImage.style.objectPosition = `${imgSettings.posX}% ${imgSettings.posY}%`;
    heroImage.style.transform = `scale(${imgSettings.scale / 100})`;
    heroImage.style.transformOrigin = 'center center';
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
            .macro-bar-content { background: #8BC53F !important; color: #000000 !important; position: relative !important; }
            .macro-bar-content span { color: #000000 !important; position: relative !important; z-index: 1 !important; }
            .macro-bar-content .macro-divider { color: #000000 !important; }
            .description-text { color: #424242 !important; }
            .section-title { color: #000000 !important; }
            .ingredient-name-cell, .ingredient-amount-cell { color: #424242 !important; }
            .ingredient-item { border-bottom-color: #E0E0E0 !important; }
            .instruction-number { background: #E0E0E0 !important; color: #616161 !important; }
            .instructions-header { background: #000000 !important; color: #ffffff !important; }
            .instruction-text { color: #424242 !important; }
            .note-callout { background: #EEEEEE !important; }
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

        // Capture with html2canvas - scale up from natural size to target
        const canvas = await html2canvas(clone, {
            scale: scaleRatio,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        // Remove the temporary container
        document.body.removeChild(exportContainer);

        // Resize canvas to exact target dimensions
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = targetWidth;
        finalCanvas.height = targetHeight;
        const ctx = finalCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(canvas, 0, 0, targetWidth, targetHeight);

        // Convert to JPG and download
        const jpgDataUrl = finalCanvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.href = jpgDataUrl;
        link.download = `${slugify(currentRecipe.title || 'recipe')}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Export error:', error);
        alert('Error exporting image. Please try again.');
    } finally {
        // Restore button state
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    }
}

/**
 * Handle print/PDF export
 */
function handlePrint() {
    // Clone the recipe page for printing
    const printPage = elements.printPage();
    printPage.innerHTML = elements.recipePage().innerHTML;

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
    link.download = `${slugify(currentRecipe.title || 'recipe')}.json`;
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
            const recipe = JSON.parse(e.target.result);
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
        currentRecipe = { ...EMPTY_RECIPE };
        loadRecipeToForm(currentRecipe);
        renderRecipePage();
    }
}

/**
 * Update zoom level display and transform
 */
function updateZoom() {
    elements.zoomLevelDisplay().textContent = `${zoomLevel}%`;
    elements.recipePage().style.transform = `scale(${zoomLevel / 100})`;
}

/**
 * Calculate and set zoom level to fit the page in the preview container
 */
function setZoomToFit() {
    const container = elements.previewContainer();
    const page = elements.recipePage();
    if (!container || !page) return;

    const containerWidth = container.clientWidth - 64; // Account for padding
    const containerHeight = container.clientHeight - 64;
    const pageWidth = 612;
    const pageHeight = 792;

    const scaleX = containerWidth / pageWidth;
    const scaleY = containerHeight / pageHeight;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

    zoomLevel = Math.round(scale * 100);
    updateZoom();
}

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
        currentRecipe = { ...recipe };
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
            const recipe = JSON.parse(jsonString);
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
