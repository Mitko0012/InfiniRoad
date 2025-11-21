let resourcesToLoad = {};
let deltaTime = 0;
let then = 0;
let colorToClear = {red: 0, green: 0, blue: 0, alpha: 1};

let keysDown = {};
window.addEventListener("keydown", (e) => {
    keysDown[e.key] = true;
});
window.addEventListener("keyup", (e) => {
    keysDown[e.key] = false;
});

let onStart;
let onUpdate;

async function start(canvasId) {
    canvas = document.getElementById(canvasId);
    gl = canvas.getContext("webgl");
    let loadingResources = [];
    if(gl === null)
        throw new Error("WebGL could not be loaded");
    for(let resource of Object.values(resourcesToLoad)) {
        if(resource.type === "text") {
            resource.value = resourceLoader.loadTextFile(resource.source);
            loadingResources.push(resource.value);
        }
        else if(resource.type === "image") {
            resource.value = resourceLoader.loadImage(resource.source);
            loadingResources.push(resource.value);
        }
    }
    await resourceLoader.awaitMultipleResources(loadingResources);
    const resolvedResources = await resourceLoader.awaitMultipleResources(loadingResources);
    let i = 0;
    for(let resource of Object.values(resourcesToLoad)) {
        resource.value = resolvedResources[i++].value;
    }
        onStart();
        requestAnimationFrame(update);
    }

function update(now) {
    let nowSecs = now / 1000;
    deltaTime = nowSecs - then; 
    then = nowSecs;
    if(canvas.offsetWidth != canvas.width) {
        canvas.width = canvas.offsetWidth;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    if(canvas.offsetHeight != canvas.height) {
        canvas.height = canvas.offsetHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.clearColor(colorToClear.red, colorToClear.green, colorToClear.blue, colorToClear.alpha);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    onUpdate();
    
    requestAnimationFrame(update);
}


