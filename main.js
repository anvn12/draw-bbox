const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const imageInfo = document.getElementById('imageInfo');
const canvasContainer = document.getElementById('canvasContainer');
const iouValueDisplay = document.getElementById('iouValue');

// Sidebar toggle elements
const sidebar = document.getElementById('sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');

// Box 1 Config Elements
const scaleSelect1 = document.getElementById('scaleSelect1');
const formatSelect1 = document.getElementById('formatSelect1');
const borderThickness1 = document.getElementById('borderThickness1');
const fillOpacity1 = document.getElementById('fillOpacity1');
const valThickness1 = document.getElementById('valThickness1');
const valOpacity1 = document.getElementById('valOpacity1');
const paste1 = document.getElementById('paste1'); // NEW

// Box 2 Config Elements
const scaleSelect2 = document.getElementById('scaleSelect2');
const formatSelect2 = document.getElementById('formatSelect2');
const borderThickness2 = document.getElementById('borderThickness2');
const fillOpacity2 = document.getElementById('fillOpacity2');
const valThickness2 = document.getElementById('valThickness2');
const valOpacity2 = document.getElementById('valOpacity2');
const paste2 = document.getElementById('paste2'); // NEW

// Zoom elements
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnZoomReset = document.getElementById('btnZoomReset');
const zoomLabel = document.getElementById('zoomLabel');

// Coordinate Inputs
const inputs = [];
for (let i = 1; i <= 8; i++) inputs.push(document.getElementById(`val${i}`));
const labels = [];
for (let i = 1; i <= 8; i++) labels.push(document.getElementById(`lbl${i}`));

let currentImage = null;
let zoomLevel = 1.0;
const ZOOM_STEP = 0.1;

// --- NEW: Paste Handling Logic ---
function handlePaste(event, inputElements) {
    const rawText = event.target.value;
    
    // Regex to extract all numbers (including negatives and decimals)
    // Works with spaces, commas, newlines, or mixed separators
    const extractedNumbers = rawText.match(/-?\d+(\.\d+)?/g);
    
    if (extractedNumbers && extractedNumbers.length >= 4) {
        inputElements[0].value = parseFloat(extractedNumbers[0]);
        inputElements[1].value = parseFloat(extractedNumbers[1]);
        inputElements[2].value = parseFloat(extractedNumbers[2]);
        inputElements[3].value = parseFloat(extractedNumbers[3]);
        draw(); // Redraw immediately after pasting
    }
}

// Bind paste events
paste1.addEventListener('input', (e) => handlePaste(e, inputs.slice(0, 4)));
paste2.addEventListener('input', (e) => handlePaste(e, inputs.slice(4, 8)));


// Sidebar Toggle Logic
openSidebarBtn.addEventListener('click', () => sidebar.classList.remove('collapsed'));
closeSidebarBtn.addEventListener('click', () => sidebar.classList.add('collapsed'));

function updateLabels() {
    const labelSets = [
        ['x1 (min X):', 'y1 (min Y):', 'x2 (max X):', 'y2 (max Y):'],
        ['x (top-left):', 'y (top-left):', 'Width:', 'Height:'],
        ['cx (Center X):', 'cy (Center Y):', 'Width:', 'Height:']
    ];
    
    let activeSet1 = formatSelect1.value === 'xyxy' ? 0 : (formatSelect1.value === 'xywh' ? 1 : 2);
    for (let i = 0; i < 4; i++) labels[i].innerText = labelSets[activeSet1][i];
    
    let activeSet2 = formatSelect2.value === 'xyxy' ? 0 : (formatSelect2.value === 'xywh' ? 1 : 2);
    for (let i = 0; i < 4; i++) labels[i+4].innerText = labelSets[activeSet2][i];
    
    draw();
}

function applyZoom() {
    if (!currentImage) return;
    canvas.style.width = `${currentImage.width * zoomLevel}px`;
    canvas.style.height = `${currentImage.height * zoomLevel}px`;
    zoomLabel.innerText = `${Math.round(zoomLevel * 100)}%`;
}

function fitToScreen() {
    if (!currentImage) return;
    const containerW = canvasContainer.clientWidth - 20;
    const containerH = canvasContainer.clientHeight - 20;
    const ratioW = containerW / currentImage.width;
    const ratioH = containerH / currentImage.height;
    zoomLevel = Math.min(ratioW, ratioH, 1.0);
    applyZoom();
}

// Event Listeners for UI
btnZoomIn.addEventListener('click', () => { zoomLevel += ZOOM_STEP; applyZoom(); });
btnZoomOut.addEventListener('click', () => { if (zoomLevel > 0.1) { zoomLevel -= ZOOM_STEP; applyZoom(); } });
btnZoomReset.addEventListener('click', fitToScreen);

canvasContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomLevel += ZOOM_STEP;
        else if (zoomLevel > 0.1) zoomLevel -= ZOOM_STEP;
        applyZoom();
    }
});

// Sync Sliders
borderThickness1.addEventListener('input', (e) => { valThickness1.innerText = e.target.value; draw(); });
fillOpacity1.addEventListener('input', (e) => { valOpacity1.innerText = e.target.value; draw(); });
borderThickness2.addEventListener('input', (e) => { valThickness2.innerText = e.target.value; draw(); });
fillOpacity2.addEventListener('input', (e) => { valOpacity2.innerText = e.target.value; draw(); });

imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            canvas.width = img.width;
            canvas.height = img.height;
            imageInfo.innerText = `Image Size: ${img.width} x ${img.height} px`;
            fitToScreen();
            draw();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

scaleSelect1.addEventListener('change', draw);
formatSelect1.addEventListener('change', updateLabels);
scaleSelect2.addEventListener('change', draw);
formatSelect2.addEventListener('change', updateLabels);

inputs.forEach(input => input.addEventListener('input', draw));

// --- Core Logic & Math ---
function parseBox(v1, v2, v3, v4, format, isNormalized, imgW, imgH) {
    if (isNormalized) {
        v1 *= imgW; v3 *= imgW; 
        v2 *= imgH; v4 *= imgH; 
    }
    let x1, y1, x2, y2, x, y, w, h;
    if (format === 'xyxy') {
        x1 = v1; y1 = v2; x2 = v3; y2 = v4;
        x = x1; y = y1; w = x2 - x1; h = y2 - y1;
    } else if (format === 'xywh') {
        x = v1; y = v2; w = v3; h = v4;
        x1 = x; y1 = y; x2 = x + w; y2 = y + h;
    } else if (format === 'cxcywh') {
        w = v3; h = v4;
        x = v1 - (w / 2); y = v2 - (h / 2);
        x1 = x; y1 = y; x2 = x + w; y2 = y + h;
    }
    return { x, y, w, h, x1, y1, x2, y2 };
}

function calculateIoU(box1, box2) {
    const xA = Math.max(box1.x1, box2.x1);
    const yA = Math.max(box1.y1, box2.y1);
    const xB = Math.min(box1.x2, box2.x2);
    const yB = Math.min(box1.y2, box2.y2);

    const interWidth = Math.max(0, xB - xA);
    const interHeight = Math.max(0, yB - yA);
    const interArea = interWidth * interHeight;

    const box1Area = Math.max(0, box1.w) * Math.max(0, box1.h);
    const box2Area = Math.max(0, box2.w) * Math.max(0, box2.h);
    const unionArea = box1Area + box2Area - interArea;

    if (unionArea <= 0) return 0;
    return interArea / unionArea;
}

function drawBox(box, colorHex, thickness, opacity) {
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.lineWidth = parseFloat(thickness);
    ctx.strokeStyle = colorHex;
    ctx.stroke();
    
    const r = parseInt(colorHex.slice(1, 3), 16);
    const g = parseInt(colorHex.slice(3, 5), 16);
    const b = parseInt(colorHex.slice(5, 7), 16);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${parseFloat(opacity)})`; 
    ctx.fill();
}

function draw() {
    if (!currentImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.drawImage(currentImage, 0, 0);

    const imgW = currentImage.width;
    const imgH = currentImage.height;

    const isNorm1 = scaleSelect1.value === 'normalized';
    const b1 = inputs.slice(0, 4).map(i => parseFloat(i.value) || 0);
    const box1 = parseBox(b1[0], b1[1], b1[2], b1[3], formatSelect1.value, isNorm1, imgW, imgH);

    const isNorm2 = scaleSelect2.value === 'normalized';
    const b2 = inputs.slice(4, 8).map(i => parseFloat(i.value) || 0);
    const box2 = parseBox(b2[0], b2[1], b2[2], b2[3], formatSelect2.value, isNorm2, imgW, imgH);

    drawBox(box1, '#00ff00', borderThickness1.value, fillOpacity1.value);
    drawBox(box2, '#00bfff', borderThickness2.value, fillOpacity2.value);

    const iou = calculateIoU(box1, box2);
    iouValueDisplay.innerText = iou.toFixed(4);
}

// Initialize
updateLabels();