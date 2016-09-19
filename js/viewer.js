var gl;

var canvas = document.getElementById("viewer");

//var modelLoader = new Loader();
//var imageLoader = new ImageLoader();
var assetLoader = new AssetLoader();

var teapotModel = null;
var teapotTexture = null;

function getCanvasX(pageX) {
    return pageX - $(canvas).offset().left;
}

function getCanvasY(pageY) {
    return pageY - $(canvas).offset().top;
}

var progressValue = 0;

// Main function

$(function() {    
    
    $('#progress-bar').progressbar({value: progressValue});
    
    /*modelLoader.setCallback(modelLoaderDone);
    modelLoader.setResource("teapot", "assets/utah-teapot.obj", "text");
    modelLoader.loadAll();
    
    imageLoader.setCallback(imageLoaderDone);
    imageLoader.setResource("texture", "assets/texture.jpg");
    imageLoader.loadAll();*/
    
    assetLoader.onprogress = function() {
        var progress = assetLoader.completeCount / 
            assetLoader.requestsCount * 100;
        $('#progress-bar').progressbar({value: progress});
    }

    assetLoader.request("teapot", "assets/utah-teapot.obj");
    assetLoader.request("texture", "assets/texture.jpg");
    assetLoader.load(assetLoaderDone);
});

function assetLoaderDone() {
    var teapotData = assetLoader.get("teapot");
    teapotModel = new Model();
    teapotModel.parseOBJ(teapotData);
    render.setRenderModel(teapotModel);
    
    teapotTexture = assetLoader.get("texture");
    render.setRenderTextureImage(teapotTexture);
    
    checkLoaderDone();
}

/*function modelLoaderDone() {
    var teapotData = modelLoader.getResource("teapot");
        
    teapotModel = new Model();

    teapotModel.parseOBJ(teapotData.data);

    render.setRenderModel(teapotModel);
    
    progressValue += 50;

    checkLoaderDone();
}

function imageLoaderDone() {
    teapotTexture = imageLoader.getResource("texture");
    
    render.setRenderTextureImage(teapotTexture);
    
    progressValue += 50;
    
    checkLoaderDone();
}*/



function checkLoaderDone() {
    $('#progress-bar').progressbar({value: progressValue});
    
    if (teapotModel && teapotTexture) {
        $('#progress-bar').css({'visibility': 'hidden'});
        startViewer();
    }
}

// Initialize the 3d viewer
function startViewer() {
    if (!render.init(canvas)) {
        console.log("Could not initialize renderer");
    }
    
    render.draw();
    
    changeViewerTranslate();
    
    $('#viewer-translate').on("click", changeViewerTranslate);
    $('#viewer-rotate').on("click", changeViewerRotate);
    $('#viewer-zoom').on("click", changeViewerZoom);
}


// Changes to the corresponding transform mode

function changeViewerTranslate() {
    resetViewerModes();
    $(canvas).on("mousedown", startTranslateMove);
    
    $('#viewer-translate').css({'color': '#AAAAAA'});
}

function changeViewerRotate() {
    resetViewerModes();
    $(canvas).on("mousedown", startRotateMove);
    
    $('#viewer-rotate').css({'color': '#AAAAAA'});
}

function changeViewerZoom() {
    resetViewerModes();
    $(canvas).on("mousedown", startZoomMove);
    
    $('#viewer-zoom').css({'color': '#AAAAAA'});
}

function resetViewerModes() {
    $(canvas).off("mousedown", startTranslateMove);
    $(canvas).off("mousedown", startRotateMove);
    $(canvas).off("mousedown", startZoomMove);
    
    $('#viewer-translate').css({'color': '#FFFFFF'});
    $('#viewer-rotate').css({'color': '#FFFFFF'});
    $('#viewer-zoom').css({'color': '#FFFFFF'});
}


// Transformation event handlers

var refPt = [0,0];
var angle = 0.0;
var rotateSpeed = 0.005;
var translateSpeed = 0.5;
var zoomSpeed = 1.0;


// Rotate Transformation

function startRotateMove(e) {
    render.startRotateMove();
    
    refPt = [getCanvasX(e.pageX), getCanvasY(e.pageY)];
    
    $(canvas).on("mouseleave", endRotateMove);
    $(canvas).on("mouseup", endRotateMove);
    
    $(canvas).on("mousemove", changeRotateMove);
}

function changeRotateMove(e) {
    var offsetX = getCanvasX(e.pageX) - refPt[0];
    var offsetY = getCanvasY(e.pageY) - refPt[1];
    
    render.resetRotateMove();
    
    render.setRotateMoveX(offsetY * rotateSpeed * Math.PI * 2);
    render.setRotateMoveY(offsetX * rotateSpeed * Math.PI * 2);
    
    render.draw();
}

function endRotateMove(e) {
    render.endRotateMove();
    
    render.draw();
    
    $(canvas).off("mouseleave", endRotateMove);
    $(canvas).off("mouseup", endRotateMove);
    
    $(canvas).off("mousemove", changeRotateMove);
}


// Translate Transformation

function startTranslateMove(e) {
    render.startTranslateMove();
    
    refPt = [getCanvasX(e.pageX), getCanvasY(e.pageY)];
    
    $(canvas).on("mouseleave", endTranslateMove);
    $(canvas).on("mouseup", endTranslateMove);
    
    $(canvas).on("mousemove", changeTranslateMove);
}

function changeTranslateMove(e) {
    var offsetX = getCanvasX(e.pageX) - refPt[0];
    var offsetY = getCanvasY(e.pageY) - refPt[1];
    
    render.resetTranslateMove();
    
    render.setTranslateMove(offsetX * translateSpeed, 
                            -(offsetY * translateSpeed));
    
    render.draw();
}

function endTranslateMove(e) {
    render.endTranslateMove();
    
    render.draw();
    
    $(canvas).off("mouseleave", endTranslateMove);
    $(canvas).off("mouseup", endTranslateMove);
    
    $(canvas).off("mousemove", changeTranslateMove);
}


// Zoom Transformation

function startZoomMove(e) {
    render.startZoomMove();
    
    refPt = [getCanvasX(e.pageX), getCanvasY(e.pageY)];
    
    $(canvas).on("mouseleave", endZoomMove);
    $(canvas).on("mouseup", endZoomMove);
    
    $(canvas).on("mousemove", changeZoomMove);
}

function changeZoomMove(e) {
    var offset = getCanvasY(e.pageY) - refPt[1];
    
    render.resetZoomMove();
    
    render.setZoomMove(-offset * zoomSpeed);
    
    render.draw();
}

function endZoomMove(e) {
    render.endZoomMove();
    
    render.draw();
    
    $(canvas).off("mouseleave", endZoomMove);
    $(canvas).off("mouseup", endZoomMove);
    
    $(canvas).off("mousemove", changeZoomMove);
}