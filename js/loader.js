function AssetLoader() {
    this.requests = [];
    this.callback = null;
    
    this.requestsCount = 0;
    this.completeCount = 0;
    
    this.loadedCount = 0;
    this.errorsCount = 0;
    
    this.onprogress = null;
    
    this.assets = {};
}

AssetLoader.prototype.get = function(ident) {
    return this.assets[ident];
}

AssetLoader.prototype.request = function(ident, file) {
    
    // No duplicate ids allowed
    if (this.assets.hasOwnProperty(ident)) {
        console.log("Error: Asset '" + ident + "' already defined");
        return;
    }
    
    // Assigns the id to null before asset is loaded
    this.assets[ident] = null;
    
    // Sets the type of the resource
    var type;
    if (file.endsWith('jpg') || file.endsWith('jpeg') ||
        file.endsWith('png')) {
        type = 'img';
    }
    else if (file.endsWith('obj')) {
        type = 'text';
    }
    else {
        type = 'binary';
    }

    // Creates a new request
    var req = {
        ident: ident,
        file: file,
        type: type
    };
    this.requests.push(req);
    ++this.requestsCount;
}

AssetLoader.prototype.load = function(callback) {
    var i;
    
    this.callback = callback;
    
    this.loadedCount = 0;
    this.errorsCount = 0;
    this.completeCount = 0;
    
    for (i = 0; i < this.requests.length; ++i) {

        var ident = this.requests[i].ident;
        var file = this.requests[i].file;
        var type = this.requests[i].type;
        
        // Loads image data
        if (type === 'img') {
            
            var img = new Image();
            
            var that = this;
 
            (function(that, img, ident, file) {
                img.onload = function() { that.onLoadImage(ident, file); };
            })(this, img, ident, file);
            
            (function(that, img, ident, file) {
                img.onerror = function() { that.onErrorImage(ident, file); };
            })(this, img, ident, file);
            
            img.src = file;
            
            this.assets[ident] = img;
        }
        // Loads binary data
        else {
            
            var xhrReq = new XMLHttpRequest();
            
            xhrReq.open('GET', file, true);
            
            if (type === 'text') {
                xhrReq.responseType = 'text';
            }
            else {
                xhrReq.responseType = 'binary'
            }
            
            var that = this;
            
            (function(that, req, ident, file) {
                req.onload = function() { 
                    that.onLoadXHR(req, ident, file); 
                };
            })(this, xhrReq, ident, file);

            xhrReq.send(null);
        }
    }
    
    this.requests = [];
}

AssetLoader.prototype.checkLoadDone = function() {
    if (this.onprogress) this.onprogress();
    
    if (this.completeCount === this.requestsCount) {
        // Complete!!!
        this.callback();
    }
}

AssetLoader.prototype.onLoadImage = function(ident, file) {
    ++this.loadedCount;
    
    ++this.completeCount;
    this.checkLoadDone();
}

AssetLoader.prototype.onErrorImage = function(ident, file) {
    console.log("Error: asset '" + ident + "' could not be loaded. file '" +
                file + "' could not be found.")
    
    ++this.errorsCount;
    
    ++this.completeCount;
    this.checkLoadDone();
}

AssetLoader.prototype.onLoadXHR = function(req, ident, file) {
    if (req.readyState === 4) {
        if (req.status === 200) {
            this.assets[ident] = req.response;
            ++this.loadedCount;
        }
        else {
            console.log("Error: asset '" + ident + "' could not be loaded. " +
                        "file '" + file + "' could not be found.");
            ++this.errorsCount;
        }
    }

    ++this.completeCount;
    this.checkLoadDone();
}


//
// Generic Loader
//
/*
function LoaderResult(ident, data, type) {
    this.ident = ident;
    this.data = data;
    this.type = type;
}

function LoaderResource(ident, url, type) {
    this.ident = ident;
    this.url = url;
    this.type = type;
}

function Loader() {
    this.loadList = [];
    this.xhrReqs = {};
    this.resList = {};
    this.numResource = 0;
    this.callback = null;
    
    this.numReady = 0;
    this.numErrors = 0;
    this.numLoaded = 0;

}

Loader.prototype.setCallback = function(callback) {
      this.callback = callback;
};

Loader.prototype.setResource = function(ident, url, type) {
    var resource = new LoaderResource(ident, url, type);
    
    this.numResource += 1;
    
    this.loadList.push(resource);
}

Loader.prototype.loadFinish = function() {
    
    this.numErrors = this.numLoaded - this.numReady;
    console.log("Loader - Successful: " + this.numReady + ", Errors: " + this.numErrors);
    
    if (this.callback) {
        this.callback();   
    }
}

function LoaderRequest(loader, resource) {
    this.req = new XMLHttpRequest();
    this.loader = loader;
    this.resource = resource;
    
    if (this.resource.type == "binary") {
        this.req.responseType = "arraybuffer";
    }
    else {
        this.req.responseType = "text";   
    }
    
    var request = this;
    
    this.req.addEventListener("loadend", function() { request.loadEndCallback(); });
    this.req.onreadystatechange = function() { request.readyStateCallback(); }
    
    this.req.open("GET", this.resource.url);
    this.req.send();
}

LoaderRequest.prototype.loadEndCallback = function() {

    this.loader.numLoaded += 1;
    
    if (this.loader.numLoaded == this.loader.numResource) {
        this.loader.loadFinish();   
    }
}

LoaderRequest.prototype.readyStateCallback = function() {
    if (this.req.readyState == 4 && this.req.status == 200) {
        var res = new LoaderResult(this.resource.ident, this.req.response, this.resource.type);
        this.loader.resList[this.resource.ident] = res;
        this.loader.numReady += 1;   
    }
}

Loader.prototype.loadAll = function() {
    
    if (this.loadList.length == 0) {
        this.numLoaded = 0;
        this.numReady = 0;
        this.loadFinish();
    }
    
    for (var i = 0; i < this.loadList.length; ++i) {
        var resource = this.loadList[i];
        
        var req = new LoaderRequest(this, resource);
        
        this.xhrReqs[resource.ident] = req;
    }
}

Loader.prototype.getResource = function(ident) {
    return this.resList[ident];
}


//
// ImageLoader
// 

function ImageLoader() {
    this.loadList = [];
    this.reqList = {};
    this.resList = {};
    this.numLoaded = 0;
    this.numErrors = 0;
    this.numRequests = 0;
    this.callback = null;
}

ImageLoader.prototype.setCallback = function(callback) {
    this.callback = callback;   
}

ImageLoader.prototype.setResource = function(ident, url) {
    var resource = {};
    resource.ident = ident;
    resource.url = url;
    
    this.loadList.push(resource);
    this.numRequests += 1;
}

ImageLoader.prototype.loadAll = function() {
    
    if (this.loadList.length == 0) {
        this.numLoaded = 0;
        this.numErrors = 0;
        this.finishLoad();
    }
 
    for (var i = 0; i < this.loadList.length; ++i) {
        var resource = this.loadList[i];
        
        this.reqList[resource.ident] = new ImageLoaderRequest(resource, this);
    }
}

ImageLoader.prototype.getResource = function(ident) {
    return this.resList[ident];   
}

ImageLoader.prototype.finishLoad = function() {
    console.log("Image Loader - " + "Successful: " + this.numLoaded + ", Errors: " + this.numErrors);
    
    if (this.callback) this.callback();
}

function ImageLoaderRequest(resource, loader) {
    this.resource = resource;
    this.loader = loader;
    
    var request = this;
    
    var image = new Image();
    image.onload = function() { request.loadCallback(); }
    image.onerror = function() { request.errorCallback(); }
    image.src = resource.url;
    
    loader.resList[resource.ident] = image;
}

ImageLoaderRequest.prototype.loadCallback = function() {
    this.loader.numLoaded += 1; 
    
    if (this.loader.numLoaded + this.loader.numErrors == this.loader.numRequests) {
        this.loader.finishLoad();   
    }
}

ImageLoaderRequest.prototype.errorCallback = function() {
    this.loader.numErrors += 1;
    
    if (this.loader.numLoaded + this.loader.numErrors == this.loader.numRequests) {
        this.loader.finishLoad();   
    }
}*/