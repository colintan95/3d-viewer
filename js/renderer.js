var gl;

var SCREEN_WIDTH = 640.0;
var SCREEN_HEIGHT = 480.0;

var PROJ_NEAR = 0.1;
var PROJ_FAR = 1000.0;

var render = {
    
    // Methods
    
    // Initializes WebGL and shaders
    init: function(canvas) {
        gl = null;
    
        try {
            gl = canvas.getContext("webgl") || 
                    canvas.getContext("experimental-webgl");
        }
        catch(e) {
            console.log(e);
        }

        if (!gl) {
            console.log("Could not initialize WebGL");
            gl = null;
            return false;
        }
        
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        this.resize(canvas.width, canvas.height);

        
        this.program = gl.createProgram();
        
        this.loadShader("2d-vertex-shader");
        this.loadShader("2d-fragment-shader");
        
        gl.attachShader(this.program, this.vertShader);
        gl.attachShader(this.program, this.fragShader);
        
        gl.linkProgram(this.program);
        gl.useProgram(this.program);
        
        
        // Attributes
        
        this.posLoc = gl.getAttribLocation(this.program, "vPosition");
        
        this.posBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        
        gl.bufferData(gl.ARRAY_BUFFER,
                      new Float32Array(this.renderModel.posData), 
                      gl.STATIC_DRAW);
        
        this.normalLoc = gl.getAttribLocation(this.program, "vNormal");
        
        this.normalBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuf);
        gl.bufferData(gl.ARRAY_BUFFER, 
                      new Float32Array(this.renderModel.normData), 
                      gl.STATIC_DRAW);
        
        this.texCoordLoc = gl.getAttribLocation(this.program, "vTexCoord");
        
        this.texCoordBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuf);
        gl.bufferData(gl.ARRAY_BUFFER,
                      new Float32Array(this.renderModel.texData),
                      gl.STATIC_DRAW);
        
        
        // Texture
        
        this.renderTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE,
                      this.renderTextureImg);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        
        
        // Uniforms
        
        this.modelMatLoc = gl.getUniformLocation(this.program, "uModelMat");
        this.modelMat = mat4.create();
        gl.uniformMatrix4fv(this.modelMatLoc, false, 
                            new Float32Array(this.modelMat));
        
        this.viewMatLoc = gl.getUniformLocation(this.program, "uViewMat");
        this.viewMat = mat4.create();
        mat4.translate(this.viewMat, this.viewMat, [0.0, 0.0, -75.0]);
        gl.uniformMatrix4fv(this.viewMatLoc, false, 
                            new Float32Array(this.viewMat));
        
        this.projMatLoc = gl.getUniformLocation(this.program, "uProjMat");
        var projMat = mat4.create();
        mat4.perspective(projMat, Math.PI / 4.0, this.canvasWidth / 
                         this.canvasHeight, PROJ_NEAR, PROJ_FAR);
        gl.uniformMatrix4fv(this.projMatLoc, false, new Float32Array(projMat));
        
        this.normMatLoc = gl.getUniformLocation(this.program, "uNormMat");
        var normMat = mat3.create();
        var modelViewMat = mat4.create();
        mat4.multiply(modelViewMat, this.viewMat, this.modelMat);
        mat3.normalFromMat4(normMat, modelViewMat);
        gl.uniformMatrix3fv(this.normMatLoc, false, new Float32Array(normMat));
        
        this.lightPosLoc = gl.getUniformLocation(this.program, "uLightPos");
        var lightPos = [0.0, 0.0, 0.0, 1.0];
        gl.uniform3fv(this.lightPosLoc, lightPos);
        
        this.textureLoc = gl.getUniformLocation(this.program, "uTexture");
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.renderTexture);
        gl.uniform1i(this.textureLoc, 0);
        
        this.ambtColorLoc = gl.getUniformLocation(this.program, "uAmbtColor");
        gl.uniform3fv(this.ambtColorLoc, new Float32Array(this.ambtColor));
        
        this.diffColorLoc = gl.getUniformLocation(this.program, "uDiffColor");
        gl.uniform3fv(this.diffColorLoc, new Float32Array(this.diffColor));
        
        this.specColorLoc = gl.getUniformLocation(this.program, "uSpecColor");
        gl.uniform3fv(this.specColorLoc, new Float32Array(this.specColor));
        
        this.shininessLoc = gl.getUniformLocation(this.program, "uShininess");
        gl.uniform1f(this.shininessLoc, this.shininess);
        
        this.specStrengthLoc = gl.getUniformLocation(this.program, 
                                                     "uSpecStrength");
        gl.uniform1f(this.specStrengthLoc, this.specStrength);
        
        
        return true;
    },
    
    
    // Call on every frame
    draw: function() {
        gl.useProgram(this.program);
        
        var rotateMat = mat4.create();
        mat4.rotate(rotateMat, rotateMat, this.rotateX + this.rotateMoveX, 
                    [1.0, 0.0, 0.0]);
        mat4.rotate(rotateMat, rotateMat, this.rotateY + this.rotateMoveY, 
                    [0.0, 1.0, 0.0]);
        
        var translateMat = mat4.create();
        var dx = this.translateX + this.translateMoveX;
        var dy = this.translateY + this.translateMoveY;
        mat4.translate(translateMat, translateMat, [dx, dy, 0]);
        
        var modelDrawMat = mat4.create();
        mat4.multiply(modelDrawMat, rotateMat, this.modelMat);
        mat4.multiply(modelDrawMat, translateMat, modelDrawMat);
        gl.uniformMatrix4fv(this.modelMatLoc, false, 
                            new Float32Array(modelDrawMat));
        
        var viewDrawMat = mat4.create();
        var zoomMat = mat4.create();
        mat4.translate(zoomMat, zoomMat, [0, 0, this.zoom + this.zoomMove]);
        mat4.multiply(viewDrawMat, zoomMat, this.viewMat);
        gl.uniformMatrix4fv(this.viewMatLoc, false, 
                            new Float32Array(viewDrawMat));
        
        var normMat = mat3.create();
        var modelViewMat = mat4.create();
        mat4.multiply(modelViewMat, viewDrawMat, modelDrawMat);
        mat3.normalFromMat4(normMat, modelViewMat);
        gl.uniformMatrix3fv(this.normMatLoc, false, 
                            new Float32Array(normMat));
        
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
        gl.enableVertexAttribArray(this.posLoc);
        gl.vertexAttribPointer(this.posLoc, 4, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuf);
        gl.enableVertexAttribArray(this.normalLoc);
        gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuf);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, this.renderModel.numVert);
    },
    
    setRenderModel: function(model) {
        this.renderModel = model;  
    },
    
    setRenderTextureImage: function(img) {
        this.renderTextureImg = img;  
    },
    
    
    // Translate Move
    
    startTranslateMove: function() {
        this.translateMoveX = 0.0;
        this.translateMoveY = 0.0;
    },
    
     resetTranslateMove: function() {
        this.translateMoveX = 0.0;
        this.translateMoveY = 0.0;
    },
    
    setTranslateMove: function(dx, dy) {
        this.translateMoveX = dx;
        this.translateMoveY = dy;
    },
    
    endTranslateMove: function() {
        this.translateX += this.translateMoveX;
        this.translateY += this.translateMoveY;
        
        this.translateMoveX = 0.0;
        this.translateMoveY = 0.0;
    },
    
    // Rotate Move
    
    startRotateMove: function() {
        //mat4.identity(this.rotateMoveMat);
        this.rotateMoveX = 0.0;
        this.rotateMoveY = 0.0;
    },
    
    resetRotateMove: function() {
        //mat4.identity(this.rotateMoveMat);  
        this.rotateMoveX = 0.0;
        this.rotateMoveY = 0.0;
    },
    
    setRotateMove: function(angle, axis) {
       // mat4.rotate(this.rotateMoveMat, this.rotateMoveMat, angle, axis);
    },
    
    setRotateMoveX: function(angle) {
        this.rotateMoveX = angle;  
    },
    
    setRotateMoveY: function(angle) {
        this.rotateMoveY = angle;  
    },
    
    endRotateMove: function() {
       // mat4.multiply(this.modelMat, this.rotateMoveMat, this.modelMat);
       // mat4.identity(this.rotateMoveMat);
        
        this.rotateX += this.rotateMoveX;
        this.rotateY += this.rotateMoveY;
        
        this.rotateMoveX = 0.0;
        this.rotateMoveY = 0.0;
    },
    
    // Zoom Move
    
    startZoomMove: function() {
        this.zoomMove = 0.0;
    },
    
    resetZoomMove: function() {
        this.zoomMove = 0.0;  
    },
    
    setZoomMove: function(zoom) {
        this.zoomMove = zoom;  
    },
    
    endZoomMove: function() {
        this.zoom += this.zoomMove;
        
        this.zoomMove = 0.0;
    },
    

    resize: function(width, height) {
        gl.viewport(0, 0, width, height);
        
        this.canvasWidth = width;
        this.canvasHeight = height;
    },
    
    
    // Loads a shader from the DOM element specified by id
    //
    // DOM element must be a <script> with type either "x-shader/x-vertex"
    // or "x-shader/x-fragment", for vertex and fragment shader respectively
    loadShader: function(id) {
        var script, source, child, shader;
        
        // Loads the shader source from the DOM element specified by id
        
        script = document.getElementById(id);
        
        if (!script) {
            return false;
        }
        
        source = "";
        child = script.firstChild;
        
        while (child) {
            if (child.nodeType == child.TEXT_NODE) {
                source += child.textContent;
            }
            
            child = child.nextSibling;
        }
        
        // Creates and compiles the shader
        
        if (script.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }
        else if (script.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        }
        else {
            return false;
        }

        gl.shaderSource(shader, source);
        
        gl.compileShader(shader);
        
        
        // Checks for any errors in compilation
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log("Error during shader compilation: " + 
                        gl.getShaderInfoLog(shader));
            return false;
        }
        
        // Assigns the respective renderer variable to the new shader
        
        if (script.type == "x-shader/x-vertex") {
            this.vertShader = shader;
        }
        else if (script.type == "x-shader/x-fragment") {
            this.fragShader = shader;
        }
    },
    
    
    // Properties
    
    program: null,
    
    posLoc: null,
    normalLoc: null,
    texCoordLoc: null,
    
    modelMatLoc: null,
    viewMatLoc: null,
    projMatLoc: null,
    normMatLoc: null,
    
    lightPosLoc: null,
    
    textureLoc: null,
    ambtColorLoc: null,
    diffColorLoc: null,
    specColorLoc: null,
    shininessLoc: null,
    specStrengthLoc: null,
    
    posBuf: null,
    normalBuf: null,
    texCoordBuf: null,
    
    vertShader: null,
    fragShader: null,
    
    renderModel: null,
    renderTexture: null,
    
    renderTextureImg: null,
    
    modelMat: null,
    viewMat: null,
    //rotateMoveMat: null,
    
    ambtColor: [0.3, 0.3, 0.3],
    diffColor: [0.8, 0.0, 0.0],
    specColor: [0.0, 0.0, 0.0],
    
    shininess: 20.0,
    
    specStrength: 5.0,
    
    // Angle of rotation in the axis in radians
    rotateX: 0.0,
    rotateY: 0.0,
    
    translateX: 0.0,
    translateY: 0.0,
    
    zoom: 0.0,
    
    translateMoveX: 0.0,
    translateMoveY: 0.0,
    
    rotateMoveX: 0.0,
    rotateMoveY: 0.0,
    
    zoomMove: 0.0,
    
    canvasWidth: 0.0,
    canvasHeight: 0.0
}