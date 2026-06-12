const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageUpload = document.getElementById('imageUpload');
const scaleSelect = document.getElementById('scaleSelect');
const formatSelect = document.getElementById('formatSelect');
const imageInfo = document.getElementById('imageInfo');

// Input fields and labels
const inputs = [
    document.getElementById('val1'),
    document.getElementById('val2'),
    document.getElementById('val3'),
    document.getElementById('val4')
];
const labels = [
    document.getElementById('lbl1'),
    document.getElementById('lbl2'),
    document.getElementById('lbl3'),
    document.getElementById('lbl4')
];

let currentImage = null;

// Update labels based on format selection
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

// Handle Image Upload
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
            draw();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// Event listeners for real-time drawing
scaleSelect.addEventListener('change', draw);
formatSelect.addEventListener('change', updateLabels);
inputs.forEach(input => input.addEventListener('input', draw));

function draw() {
    if (!currentImage) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // 1. Draw the image
    ctx.drawImage(currentImage, 0, 0);

    // 2. Get input values
    let v1 = parseFloat(inputs[0].value) || 0;
    let v2 = parseFloat(inputs[1].value) || 0;
    let v3 = parseFloat(inputs[2].value) || 0;
    let v4 = parseFloat(inputs[3].value) || 0;

    const isNormalized = scaleSelect.value === 'normalized';
    const format = formatSelect.value;
    const imgW = currentImage.width;
    const imgH = currentImage.height;

    // 3. Convert Normalized to Absolute if needed
    if (isNormalized) {
        v1 *= imgW;
        v3 *= imgW; // x/width scaling
        v2 *= imgH;
        v4 *= imgH; // y/height scaling
    }

    // 4. Convert all formats to Absolute xywh for Canvas rendering
    let x, y, w, h;

    if (format === 'xyxy') {
        x = v1;
        y = v2;
        w = v3 - v1;
        h = v4 - v2;
    } else if (format === 'xywh') {
        x = v1;
        y = v2;
        w = v3;
        h = v4;
    } else if (format === 'cxcywh') {
        w = v3;
        h = v4;
        x = v1 - (w / 2);
        y = v2 - (h / 2);
    }

    // 5. Draw the Bounding Box
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.lineWidth = Math.max(2, imgW / 300); // Scale line width slightly with image size
    ctx.strokeStyle = '#00ff00'; // Bright green for visibility
    ctx.stroke();
    
    // Add a semi-transparent fill for better visibility
    ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'; 
    ctx.fill();
}

// Initialize labels on load
updateLabels();