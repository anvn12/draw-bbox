const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const scaleSelect = document.getElementById('scaleSelect');
const formatSelect = document.getElementById('formatSelect');
const imageInfo = document.getElementById('imageInfo');
const canvasContainer = document.getElementById('canvasContainer');

// Zoom elements
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnZoomReset = document.getElementById('btnZoomReset');
const zoomLabel = document.getElementById('zoomLabel');

const inputs = [
    document.getElementById('val1'), document.getElementById('val2'),
    document.getElementById('val3'), document.getElementById('val4')
];
const labels = [
    document.getElementById('lbl1'), document.getElementById('lbl2'),
    document.getElementById('lbl3'), document.getElementById('lbl4')
];

let currentImage = null;
let zoomLevel = 1.0;
const ZOOM_STEP = 0.1;

function updateLabels() {
    const format = formatSelect.value;
    if (format === 'xyxy') {
        labels[0].innerText = 'x1 (min X):'; labels[1].innerText = 'y1 (min Y):';
        labels[2].innerText = 'x2 (max X):'; labels[3].innerText = 'y2 (max Y):';
    } else if (format === 'xywh') {
        labels[0].innerText = 'x (top-left):'; labels[1].innerText = 'y (top-left):';
        labels[2].innerText = 'Width:';        labels[3].innerText = 'Height:';
    } else if (format === 'cxcywh') {
        labels[0].innerText = 'cx (Center X):'; labels[1].innerText = 'cy (Center Y):';
        labels[2].innerText = 'Width:';         labels[3].innerText = 'Height:';
    }
    draw();
}

function applyZoom() {
    if (!currentImage) return;
    // Scale the CSS display size of the canvas, leaving internal coordinates untouched
    canvas.style.width = `${currentImage.width * zoomLevel}px`;
    canvas.style.height = `${currentImage.height * zoomLevel}px`;
    zoomLabel.innerText = `${Math.round(zoomLevel * 100)}%`;
}

function fitToScreen() {
    if (!currentImage) return;
    const containerW = canvasContainer.clientWidth - 20; // 20px padding
    const containerH = canvasContainer.clientHeight - 20;
    
    // Calculate ratio needed to fit image inside container
    const ratioW = containerW / currentImage.width;
    const ratioH = containerH / currentImage.height;
    
    // Pick the smaller ratio to ensure it fits completely, max 1.0
    zoomLevel = Math.min(ratioW, ratioH, 1.0);
    applyZoom();
}

// Zoom Event Listeners
btnZoomIn.addEventListener('click', () => { zoomLevel += ZOOM_STEP; applyZoom(); });
btnZoomOut.addEventListener('click', () => { 
    if (zoomLevel > 0.1) { zoomLevel -= ZOOM_STEP; applyZoom(); } 
});
btnZoomReset.addEventListener('click', fitToScreen);

// Mouse Wheel Zooming (Hold CTRL to zoom)
canvasContainer.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault(); // Stop page scrolling
        if (e.deltaY < 0) {
            zoomLevel += ZOOM_STEP;
        } else if (zoomLevel > 0.1) {
            zoomLevel -= ZOOM_STEP;
        }
        applyZoom();
    }
});

imageUpload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            currentImage = img;
            // Set true internal canvas resolution
            canvas.width = img.width;
            canvas.height = img.height;
            imageInfo.innerText = `Image Size: ${img.width} x ${img.height} px`;
            
            fitToScreen(); // Auto-fit the new image
            draw();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

scaleSelect.addEventListener('change', draw);
formatSelect.addEventListener('change', updateLabels);
inputs.forEach(input => input.addEventListener('input', draw));

function draw() {
    if (!currentImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    ctx.drawImage(currentImage, 0, 0);

    let v1 = parseFloat(inputs[0].value) || 0;
    let v2 = parseFloat(inputs[1].value) || 0;
    let v3 = parseFloat(inputs[2].value) || 0;
    let v4 = parseFloat(inputs[3].value) || 0;

    const isNormalized = scaleSelect.value === 'normalized';
    const format = formatSelect.value;
    const imgW = currentImage.width;
    const imgH = currentImage.height;

    if (isNormalized) {
        v1 *= imgW; v3 *= imgW; 
        v2 *= imgH; v4 *= imgH; 
    }

    let x, y, w, h;

    if (format === 'xyxy') {
        x = v1; y = v2; w = v3 - v1; h = v4 - v2;
    } else if (format === 'xywh') {
        x = v1; y = v2; w = v3; h = v4;
    } else if (format === 'cxcywh') {
        w = v3; h = v4; x = v1 - (w / 2); y = v2 - (h / 2);
    }

    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.lineWidth = Math.max(2, imgW / 300);
    ctx.strokeStyle = '#00ff00';
    ctx.stroke();
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; 
    ctx.fill();
}

updateLabels();