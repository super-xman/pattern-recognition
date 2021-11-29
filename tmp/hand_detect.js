const head = document.querySelector('head');
const scripts = document.createDocumentFragment();
const script1 = document.createElement('script', {src: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js'});
const script2 = document.createElement('script', {src: 'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js'});
const script3 = document.createElement('script', {src: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'});
const script4 = document.createElement('script', {src: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'});

scripts.appendChild(script1);
scripts.appendChild(script2);
scripts.appendChild(script3);
scripts.appendChild(script4);
head.appendChild(scripts);


// const body = document.querySelector('body');
const video = document.createElement('video');

function onResults(results) {
    if (results.multiHandLandmarks) {
        var landmarks = results.multiHandLandmarks;
        if(landmarks.length === 0) {
            return;
        }
        var points = landmarks[0]; // list(21), {x:,y:,z:}
        console.log(points[0]);
    }
}

const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
    maxNumHands: 2,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({image: video});
    },
});
camera.start();

export {hands};
