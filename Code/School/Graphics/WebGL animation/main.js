// CSc 305 - A2
// M. Donovan Aikman
// V00263072

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Interplanetary Conquest
////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// A 60-second cosmic microdrama that loops endlessly.
//
// Changes in this file can be found throughout as noted but primarily in 3 places:
// 		Global variables
//		Subfunctions sections
//		Main render function to establish non-global variables and call subroutines
//	Where I made big changes are easy to spot because I have added long slash lines around them like this
////////////////////////////////////////////////////////////////////////////////////////////////////////////

var canvas;
var gl;

var program ;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;

//CHANGED THESE LIGHT VARIABLES
var lightPosition = vec4(-10.0, 0, 0.0, .2 );                 

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 1.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;
// if I had more time to play I would run around with the above variables more
// as it is though, I am just going to play with shininess this time.
// it gets changed throughout by setTextureAs();

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix ;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, -1.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var resetTimerFlag = true ;
var animFlag = true ;
var prevTime = 0.0 ;
var useTextures = 1 ;

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
for ( var j = 0; j < texSize; j++)
image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
for ( var j = 0; j < texSize; j++ )
for(var k =0; k<4; k++)
image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var textureArray = [] ;

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// My only global variables
////////////////////////////////////////////////////////////////////////////////////////////////////////////
var TimeFrames = [];
var setTexture = 1;
var shaderSwing = 0.0;
var shaderTime;
////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////


function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

function loadFileTextureClamped(tex, filename)
{
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadFileTextureRepeat(tex, filename)
{
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleRepeatTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function initTextures() {
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Obviously I made changes here too.

    // 0 - won't be used in execution. Here for debugging and avoiding off-by-one errors.
    // Not efficient but a helpful thing when learning.
    textureArray.push({}) ;
    loadFileTextureClamped(textureArray[textureArray.length-1],"textures/0none.gif") ;

    // 1 - Sky background
    textureArray.push({}) ;
    loadFileTextureRepeat(textureArray[textureArray.length-1],"textures/1sky.jpg") ;
  
    // 2 - Planet surface
    textureArray.push({}) ;
    loadFileTextureRepeat(textureArray[textureArray.length-1],"textures/2planet.jpg") ;
   
    // 3 - Asteroid surface
    textureArray.push({}) ;
    loadFileTextureClamped(textureArray[textureArray.length-1],"textures/3asteroid.png") ;

    // 4 - Eyeball
    textureArray.push({}) ;
    loadFileTextureClamped(textureArray[textureArray.length-1],"textures/4eyeball.png") ;
    
    // 5 - Lander hull
    textureArray.push({}) ;
    loadFileTextureClamped(textureArray[textureArray.length-1],"textures/5lander.png") ; 
    
    // 6 - Flag
    textureArray.push({}) ;
    loadFileTextureClamped(textureArray[textureArray.length-1],"textures/6flag.png") ;

    // 7 - Arm
    textureArray.push({}) ;
    loadFileTextureClamped(textureArray[textureArray.length-1],"textures/7arm.jpg") ;


}

function handleRepeatTextureLoaded(textureObj) {
    // I made this for the ONE texture (2-Planet surface) that needs it. It is identical to base
    // except gl.CLAMP_TO_EDGE became gl.REPEAT
    // which is necessary for the shifting lava mist effects
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}


function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(lightPosition) );
    // Moved this line below to the texture instead as it will change with texture in my implementation.
    // gl.uniform1f( gl.getUniformLocation(program,"shininess"),materialShininess );
}

function toggleTextures() {
    // only used on button toggle
    useTextures = 1 - useTextures ;
    gl.uniform1i( gl.getUniformLocation(program,"useTextures"), useTextures );
}


// Takes an array of textures and calls render if the textures are created
// Not changed from base code
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log("boo"+texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               console.log("ready to render") ;
               window.requestAnimFrame(render);
               }
               },5) ;
    
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
 
    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;

    gl.uniform1i( gl.getUniformLocation(program, "useTextures"), useTextures );
    gl.uniform1i( gl.getUniformLocation(program, "setTexture"), setTexture );

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // set a default material
    setColor(materialDiffuse) ;
    
  
    
    // set the callbacks for the UI elements
    // this was modified with the !animFlag check to prevent frame lag when using these
    // This came up in Brandon's office hours, which is where I learned it
    document.getElementById("sliderXi").oninput = function() {
        RX = this.value ;
        if( !animFlag ){
            window.requestAnimFrame(render);
        }
    };
    document.getElementById("sliderYi").oninput = function() {
        RY = this.value;
        if( !animFlag ){
            window.requestAnimFrame(render);
        }
    };
    document.getElementById("sliderZi").oninput = function() {
        RZ =  this.value;
        if( !animFlag ){
            window.requestAnimFrame(render);
        }
    };
    
    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };
    
    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };
    
    // load and initialize the textures
    initTextures() ;
    
    // Recursive wait for the textures to load
    waitForTextures(textureArray) ;
    //setTimeout (render, 100) ;
    
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Begin of my from-scratch functions
////////////////////////////////////////////////////////////////////////////////////////////////////////////

// because I get sick of typing out PI values in javascript
function toRadians(angle){
    return angle * (Math.PI /180);
}

function setTextureAs(texture, shineee) {
    // As you guessed, this sets the desired texture and its shininess for the shaders
    materialShininess = shineee;
    gl.uniform1f( gl.getUniformLocation(program, "shininess"),materialShininess );
    gl.uniform1i( gl.getUniformLocation(program,"setTexture"), texture );
}

function PlanetSystem() {
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	// The Planet surface
	// And two captured asteroid rotating around it
    // Only the global TIME variable is used in this instance as nothing here depends on script timing
	////////////////////////////////////////////////////////////////////////////////////////////////////////

    // backdrop
    gPush() ;
    {
        setTextureAs(1, 0.0);
        gTranslate(0,6,0) ;
        gRotate(90,1,0,0);
        setColor(vec4(0.0,0.0,0.0,1.0)) ;
        s = 50;
        gScale(s,s,s);
        drawCylinder() ;
        gScale(1/s,1/s,1/s);
    }
    gPop() ;

    
    // Planet surface
    setTextureAs(2, 10.0);
    setColor(vec4(0.3,0.3,0.3,0.5)) ;
    gPush() ;
    {
		gTranslate(0,-11,0) ;
		gScale(10,10,10);
        drawSphere() ;
        gScale(.1,.1,.1);
    }
    
    // Bumps
    setTextureAs(2, 30.0);
    pointybump(15,1,0,1);
    // auto-generating these
    for (bump = 3 ; bump<22; bump++) {
        pointybump(15*bump,1,0,1);
        pointybump(-10*bump,-1.6,0,.6);
        pointybump(25*bump,-.3,0,-.3);
        pointybump(25*bump,-.6,0,1.3);
    }
    
    // but manually doing these so the pattern appears less generated
    roundbump(35,1,0,0,.3);
    roundbump(23,2,0,.3,.35);
    roundbump(37,2.1,0,.5,.35);
    roundbump(47,2,0,.3,.23);
    roundbump(58,2,0,.3,.15);
    roundbump(39,1,0,-.7,.23);
    roundbump(33,1,0,-.7,.13);
    roundbump(23,1.1,0,-.8,.13);
    // closes planet
    
    setTextureAs(3, 10.0);
    // first captured asteroid
    // in same push/pop because it circles the planet center
    gPush();
    {
        gRotate(80,0,0,1);
        gRotate((TIME/3)*180/3.14159,0,1,0) ;
        gTranslate(22,0,0);
        gRotate(TIME*22.1,1,0,1);
        s = .8
        gScale(s,s,s);
        setColor(vec4(0.5,0.5,0.5,1.0)) ;
        drawSphere() ;
        gScale(1/s,1/s,1/s);
    }
    gPop();
    
    // second captured asteroid
    // also in the same pushpop for same-same
    gPush();
    {
        gRotate(110,0,0,1);
        gRotate((TIME/2.7)*180/3.14159,0,1,0) ;
        gTranslate(23,0,0);
        gRotate(TIME*33.1,0,1,1);
        s = .86
        gScale(s,s,s);
        setColor(vec4(0.5,0.5,0.5,1.0)) ;
        drawSphere() ;
        gScale(1/s,1/s,1/s);
    }
    gPop();
    
    
    // closes planet references
    gPop();
    
}

function pointybump(t,x,y,z){
    gPush() ;
    {
        gRotate(t,x,y,z) ;
        gTranslate(0,10,0) ;
        gRotate(-90,1,0,0) ;
        drawCone() ;
    }
    gPop() ;
}

function roundbump(t,x,y,z,s){
    gPush() ;
    {
        gRotate(t,x,y,z) ;
        gTranslate(0,10,0) ;
        gScale(s,s,s);
        drawSphere() ;
        gScale(1/s, 1/s, 1/s);
    }
    gPop() ;
}

function Lander(Timer, In, Out){
    // This draws and handles the main events of the lander module
    // Body
    // upped this for even more "shiny"
    materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
    gPush();
    setTextureAs(5, 100);
    // figure out if we are descending, sitting, or blasting off and adjust position based on that
    if ((Timer >= In[0]) && (Timer <= In[1])){
        inter = 7.5 - (7.33 * Math.sin(toRadians(90) * (Timer-In[0])/(In[1]-In[0])));
        gTranslate(0,inter,0) ;
    } else if ((Timer >= Out[0]) && (Timer <= Out[1])){
        inter = 7.5 - (7.33 * Math.sin(toRadians(90) + toRadians(90) * (Timer-Out[0])/(Out[1]-Out[0])));
        gTranslate(0,inter,0) ;
    } else if ((Timer >= In[0]) && (Timer <= Out[1])){
        gTranslate(0,.17,0) ;
    } else {
        gTranslate(0,7.5,0);
    }
    {
        setColor(vec4(0.0,1.0,0.0,1.0)) ;
        gScale(.4,1.1,.4);
        drawSphere() ;
        gScale(2.5,1/1.1,2.5);
    }
    {
        gPush();
        setColor(vec4(0.0,1.0,0.0,1.0)) ;
        gTranslate(0,-.75,0);
        gRotate(90,1,0,0);
        gScale(.6,.5,.6);
        drawCylinder() ;
        gScale(2.5,1/.5,2.5);
        gPop();
    }
        
    // Fins!
    setTextureAs(5, 100);
    for (fin = 0; fin < 3; fin++){
        gPush();
        gRotate(120*fin,0,1,0) ;
        gTranslate(0,-.8,.4) ;
        setColor(vec4(1.0,0.0,0.0,1.0)) ;
        gScale(.1,.4,.1);
        drawSphere() ;
        gScale(10,2.5,10);
        gPop();
    }
    
    // ViewPort
    // This was supposed to make the ship look more like Futurama
    // Adds a touch of Among Us though.
    gPush();
        {
        
        setColor(vec4(0.5,0.5,1.0,1.0)) ;
        gTranslate(-.1,.65,.1) ;
        gScale(.25,.15,.25);
        drawSphere() ;
        gScale(4,1/.15,4);
    }
    gPop();
    
    // Flame
    {
        gPush();
        // dropping the shiny here added nicely to the flame
        // make it look less like an orange pickle
        setTextureAs(0,1);
        gTranslate(0,-.8,0) ;
        setColor(vec4(1.0,0.65,0.0,.1)) ;
        // Figures out if we are landing, sitting, or taking off to draw flame size
        // The blast off size is deliberately larger.
        if ((Timer >= In[0]) && (Timer <= In[1])){
            factor = Math.sin(toRadians(90) * (Timer-In[0])/(In[1]-In[0]));
        } else if ((Timer >= Out[0]) && (Timer <= Out[1])){
            factor = Math.sin(toRadians(90) + toRadians(90) * (Timer-Out[0])/(Out[1]-Out[0])) * 1.25;
        } else {
            factor = 0;
        }
        gScale(.2, 1.5 * factor ,.2);
        drawSphere() ;
        gScale(10, 2 ,10);
        gPop();
    }
    gPop();
    // set this back to normal
    materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
}

function Arm(Timer, Out, In){
    // My main hierarchal object
    // each segment depends on the one before it being drawn out before it can be drawn
    SegOutTime = (Out[1] - Out[0])/5;
    SegInTime = (In[1] - In[0])/5;
    Angle = -180 / 5;
    gPush();
    setTextureAs(7, 70);
    setColor(vec4(0.0,0.0,0.0,1.0)) ;
    // figure out if we are extending, holding or retracting the arm, otherwise do nothing
    // Extend arm
    if ((Timer >= Out[0]) && (Timer <= Out[1])){
        SegNo = Math.floor((Timer - Out[0])/SegOutTime);
        Swing = Math.sin(toRadians(90) * (((Timer - Out[0])/SegOutTime) - SegNo));
        DrawSeg = 0; 
        // draw completed
        while (DrawSeg < SegNo){       
            gTranslate(0,0.5,0) ;
            gRotate(Angle,0,0,1);
            gTranslate(0,0.5,0) ;
            gScale(.05,.5,.05);
            drawCube() ;
            gScale(20,2,1/.05);
            DrawSeg++;
        }
        // animate active
        gTranslate(0,(0.5*Swing),0) ;
        gRotate((Angle*Swing),0,0,1);
        gTranslate(0,(0.5*Swing),0) ;
        gScale(.05,(.5*Swing),.05);
        drawCube() ;
        gScale(20,1/(.5*Swing),1/.05);
    } else if ((Timer >= Out[1]) && (Timer <= In[0])) {
        // hold arm if it's time
        SegNo = 5;
        DrawSeg = 0; 
        // draw completed
        while (DrawSeg < SegNo){
            gTranslate(0,0.5,0) ;
            gRotate(Angle,0,0,1);
            gTranslate(0,0.5,0) ;
            gScale(.05,.5,.05);
            drawCube() ;
            gScale(20,2,1/.05);
            DrawSeg++;
        }
    } else if ((Timer >= In[0]) && (Timer < In[1])){
        // Retract arm
        SegNo = 4 - Math.floor((Timer - In[0])/SegInTime);
        Swing = 1 - Math.sin(toRadians(90) * ((Timer - In[0]) % SegInTime));
        DrawSeg = 0; 
        // draw completed
        while (DrawSeg < SegNo){
            gTranslate(0,0.5,0) ;
            gRotate(Angle,0,0,1);
            gTranslate(0,0.5,0) ;
            gScale(.05,.5,.05);
            drawCube() ;
            gScale(20,2,1/.05);
            DrawSeg++;
        }
        gTranslate(0,(0.5*Swing),0) ;
        gRotate((Angle*Swing),0,0,1);
        gTranslate(0,(0.5*Swing),0) ;
        gScale(.05,(.5*Swing),.05);
        drawCube() ;
        gScale(20,1/(.5*Swing),1/.05);
    }
        
    gPop();
}

function FlagPlanting(Timer, Planted){
    // this is actually independent of the arm
    // However, it is dependent on drawing out the sequence to match properly
    // and appear connected
    gPush();
    setTextureAs(6, 70.0);
    // "draw" out the old start path to get us to the spot again
    SegNo = 5;
    DrawSeg = 0; 
    setColor(vec4(0.5,0.5,1.0,1.0)) ;
    while (DrawSeg < SegNo){
        gTranslate(0,0.5,0) ;
        gRotate(-36,0,0,1);
        gTranslate(0,0.5,0) ;
        // don't draw here
        DrawSeg++;
    }
    // plant the flag if it is time
    {
        if ((Timer >= Planted[0]) && (Timer <= Planted[1])) {
            PlantTime = Planted[1] - Planted[0];
            Swing = Math.sin(toRadians(90) * ((Timer - Planted[0])/PlantTime));
            gTranslate(0,(0.5*Swing),0) ;
            gRotate((-18*Swing),0,0,1);
            gTranslate(0,(0.5*Swing),0) ;
            gScale(.04,(.5*Swing),.025);
            drawCube() ;
            gScale(1/.04,(1/.5*Swing),1/.25);
        }
    }
    gPop();
}

function Flag(Timer, Unfurl, Exist){
    // The flag is a bit more complex than it looks
    // it was easiest to make planting and unfurling/existing into two different functions.
    gPush();
    setTextureAs(6, 70.0);
    // "draw" out the old start path to get us to the spot again
    SegNo = 5;
    DrawSeg = 0; 
    while (DrawSeg < SegNo){
        gTranslate(0,0.5,0) ;
        gRotate(-36,0,0,1);
        gTranslate(0,0.5,0) ;
        // don't draw here
        DrawSeg++;
    }
    UnfurlTime = Unfurl[1] - Unfurl[0];
    ExistTime = Exist[1] - Exist[0];
    // figure out if we are unfurling or existing and act appropriately
    if ((Timer >= Unfurl[0]) && (Timer <= Unfurl[1])){
        Swing = Math.sin(toRadians(90) * ((Timer - Unfurl[0])/UnfurlTime));
        // pole
        setColor(vec4(0.5,0.5,1.0,1.0)) ;
        gTranslate(0,0.5,0) ;
        gRotate(-18,0,0,1);
        gTranslate(0,0.5,0) ;
        gScale(.04,.5,.025);
        drawCube() ;
        gScale(25,2,40);
        // knob
        gPush();
        setColor(vec4(0.2,0.2,1.0,1.0));
        gTranslate(0,-0.5,0) ;
        gScale(.1*Swing,.1*Swing,.1*Swing);
        setTextureAs(0,100);
        drawSphere() ;
        setTextureAs(6, 70.0);
        gScale(1/(.1*Swing),1/(.1*Swing),1/(.1*Swing));
        gPop();
        // flag
        gPush();
        gTranslate(0,-0.25,0) ;
        gTranslate(-.5*Swing,0,0) ;
        gScale(.5*Swing,.25,.01);
        drawCube() ;
        gScale(1/(.5*Swing),1/.25,40);
        gPop();
    } else if ((Timer >= Exist[0]) && (Timer <= Exist[1])){
        // the power function was added to wiggle and sudden collapse to the normal sine swing
        Swing = Math.pow((Math.sin(toRadians(90) * ((Timer - Exist[0])/ExistTime))), 100);
        setColor(vec4(0.5,0.5,1.0,1.0)) ;
        gTranslate(0,0.5,0) ;
        gRotate(-18,0,0,1);
        gTranslate(0,1,0);
        gRotate(-120*Swing,0,0,1);
        gTranslate(0,-.5,0);
        gScale(.04,.5,.025);
        drawCube() ;
        gScale(25,2,40);
        // knob
        gPush();
        setColor(vec4(0.2,0.2,1.0,1.0));
        gTranslate(0,-0.5,0) ;
        gScale(.1,.1,.1);
        setTextureAs(0,100);
        drawSphere() ;
        setTextureAs(6, 70.0);
        gScale(1/(.1),1/(.1),1/(.1));
        gPop();
        // flag
        gPush();
        gTranslate(0,-0.25,0) ;
        gTranslate(-.5,0,0) ;
        gScale(.5,.25,.01);
        drawCube() ;
        gScale(1/(.5),1/.25,40);
        gPop();
    }
    gPop();
}

function EyeBall(Timer, Up, Down){
    // the way the sphere wrapper took my normal human eye and wrapped it was fun
    // in a "It Conquered the World" and Roger Corman kind of way so I ran with it.
    setTextureAs(4, 10.0);
    UpTime = (Up[1] - Up[0]);
    RotateTime =  (Up[1] - Down[0]);
    DownTime = (Down[1] - Down[0]);

    gPush();
    gTranslate(0,-11,0) ;
    gRotate(25,-1,0,1) ;
    setColor(vec4(1.0,0.5,0.5,1)) ;
    // Are we popping up, looking for the flag or sinking back down?
    if ((Timer >= Up[0]) && (Timer <= Up[1])){
        Swing = Math.sin(toRadians(90) * (((Timer - Up[0])/UpTime)));
        // eye up stuff
        gTranslate(0, (8.7+Swing) ,0) ;
        gRotate(90,.9,0,1);
        s = 1.2;
        gScale(s,s,s);
        drawSphere() ;
        gScale(1/s, 1/s, 1/s);
        
    } else if ((Timer >= Up[1]) && (Timer <= Down[0])) {
        // rotate eye to flag
        RotateTime = Up[1] - Down[0]
        Swing = Math.sin(toRadians(90) * (((Timer - Up[1])/RotateTime)));
        gTranslate(0, 9.7 ,0) ;
        s = 1.2;
        gRotate(145*Swing,0,1,0);
        gRotate(90,.9,0,1);
        gScale(s,s,s);
        drawSphere() ;
        gScale(1/s, 1/s, 1/s);
        
    } else if ((Timer >= Down[0]) && (Timer <= Down[1])){
        // sink eye back down
        Swing = Math.sin(toRadians(90) + toRadians(90) * (((Timer - Down[0])/DownTime)));
        gTranslate(0, (8.7+Swing) ,0) ;
        gRotate(-145,0,1,0);
        gRotate(90,.9,0,1);
        s = 1.2;
        gScale(s,s,s);
        drawSphere() ;
        gScale(1/s, 1/s, 1/s);
    }
    gPop();
}

function MoveCamera(EyePoint, Timer, KeyFrame) {
    // rather than swing around constantly, I turned the camera motion into its own event.
    // it's not super obvious except on the asteroid moons and rocketship blastoff
    // because of the planet glow. Turnoff textures via the button and its very obvious again.
    // I went to a lot of effort to make sure the light source swung with the camera here
    // I wish webGL would have done that for me but here we are.
    
    // If I had more time I would have made the swing feel more natural and less mechanical
    // It could be done with some calculus  where delta is smallest at the beginning
    // and of the camera push with the fastest moment being right in the middle.
    
    // if we haven't started or already done camera movement, do nothing
    if ((Timer < KeyFrame[0][0]) || (Timer > KeyFrame[1][1])) {
        lightPosition = vec4(-10.0, 0.0, 0.0, .2 );   
        return vec3(0,2,10);
    }

    // if we are in between the two camera movements, we are in the back position
    if ((Timer > KeyFrame[0][1]) && (Timer < KeyFrame[1][0])) {
        lightPosition = vec4(10.0, 0.0, 0.0, .2 )
        return vec3(0,2,-10);
    }

    // if we are in camera move 1 
    if ((Timer > KeyFrame[0][0]) && (Timer < KeyFrame[0][1])) {
        MoveTime = KeyFrame[0][1] - KeyFrame[0][0];
        // swing our new eye coordinates
        newX = 10 * Math.sin(Math.PI * (Timer - KeyFrame[0][0]) / MoveTime);
        newZ = 10 * Math.cos(Math.PI * (Timer - KeyFrame[0][0]) / MoveTime);
        // swing our light source
        lightX = 10 * Math.sin(toRadians(270) + Math.PI * (Timer - KeyFrame[0][0]) / MoveTime);
        lightZ = 10 * Math.sin(toRadians(180) + Math.PI * (Timer - KeyFrame[0][0]) / MoveTime);
    } else {
        // we are in camera move 2
        MoveTime = KeyFrame[1][1] - KeyFrame[1][0];
        // swing our new eye coordinates
        newX = 10 * Math.sin(Math.PI + Math.PI * (Timer - KeyFrame[1][0]) / MoveTime);
        newZ = 10 * Math.cos(Math.PI + Math.PI * (Timer - KeyFrame[1][0]) / MoveTime);
        // swing our light source
        lightX = 10 * Math.sin(toRadians(90) + Math.PI * (Timer - KeyFrame[1][0]) / MoveTime);
        lightZ = 10 * Math.sin(toRadians(0)  + Math.PI * (Timer - KeyFrame[1][0]) / MoveTime);
    }
    // otherwise, we can only be in camerapoint 2
    EyePoint[0] = newX;
    EyePoint[2] = newZ;
    // update light so it appears relative to camera eye
    // turn off textures during camera swing if you want to see this better as the planet glow obscures it 
    lightPosition = vec4(lightX,0,lightZ, .2);
    return EyePoint;
}

function doFrameRate(time){
        // Frame rate on screen
        // You know you like geeky stuff like that!
    if (TimeFrames.length == 0){
        TimeFrames.push(time);
    } else if ((time - TimeFrames[0]) > 2){
        fps = TimeFrames.length / 2;
        // keeping this here for potential debug
        // console.log(fps, "FPS");
        document.getElementById("FPS").innerHTML = fps + " FPS";
        TimeFrames = [];
        TimeFrames.push(time);
    } else {
        TimeFrames.push(time);
    }
}

function activateTextures() {
    // I know that having all textures active is NOT the most efficient way to do this
    // See my note in the frag shader for this
    
    // none
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture0"), 0);
   
    // sky
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 1);
    
    // planet
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture2"), 2);
    
    // asteroid
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[3].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture3"), 3);

    // eyeball
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[4].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture4"), 4);
    
    // lander
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[5].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture5"), 5);
  
    // flag
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[6].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture6"), 6);

    // arm
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[7].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture7"), 7);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////
// end of my subfunctions
////////////////////////////////////////////////////////////////////////////////////////////////////////////

function render() {
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    
    eye = vec3(0,2,10);
    eye[1] = eye[1] + 0 ;
   
    // set the projection matrix
    // if I had more time, I would have played with perspective more
    // had to stick with ortho in the end
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);
    
    // initialize the modeling matrix stack
    MS= [] ;
    modelMatrix = mat4() ;
    
    // apply the slider rotations
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;
    
    // send all the matrices to the shaders
    setAllMatrices() ;
    
    // get real time
    var curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;
    }


    ////////////////////////////////////////////////////////////////////////////////////////////////////////
	// begin my added code changes to this function here
	////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Event cues
    // The first number is the event starting
    // The second is the event end
    // Only camera has all it's arrays in one array
    // I kept the rest divided for clarity so I (and you) knew what part was doing what
    // The Camera swings once, then swings again
    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    MovieLength = 60;
    Timing = TIME%MovieLength;
    CameraMove = [[35,42],[53,59]]; //35,42
    viewMatrix = lookAt(eye, at , up);
    setMV();
    Landing = [5,15];
    ArmOut = [15,20];   
    ArmIn = [26,31];    
    FlagPlant = [20,25];
    FlagUnfurl = [25, 40];
    FlagExist = [40,53];
    BlastOff= [32,40];
    EyeUp = [43,45];
    EyeDown = [50, 55];

    //////////////////////////////////////////////////////
    // Stuff for shaders
    // Make time available for the shader function
    // This computes a variable glow effect between .5 and 1
    shaderSwing = Math.abs(Math.cos(TIME/2))/2 +.5;
    gl.uniform1f( gl.getUniformLocation(program,"shaderSwing"), shaderSwing );
    
    // update the reddish references here for ambient surface glow
    lightDiffuse = vec4( shaderSwing, 1.0, 1.0, 1.0 );
    lightSpecular = vec4( shaderSwing, 1.0, 1.0, 1.0 );
    
    // Make time available for use in shader
    shaderTime = (TIME + 0.0);
    gl.uniform1f( gl.getUniformLocation(program,"shaderTime"), shaderTime );

    // those textures
    activateTextures();
   
    //////////////////////////////////////////////////////
    // Meta items
    doFrameRate(TIME);
    
    eye = MoveCamera(eye, Timing, CameraMove);
    viewMatrix = lookAt(eye, at , up);
    setMV();
    
    //////////////////////////////////////////////////////
    // Finally, let's draw some stuff!
    PlanetSystem();
    Lander(Timing, Landing, BlastOff);
    Arm(Timing, ArmOut, ArmIn);
    FlagPlanting(Timing, FlagPlant);
    Flag(Timing, FlagUnfurl, FlagExist);
    EyeBall(Timing, EyeUp, EyeDown);
    gPush() ;
    
    // end of all my changes
    //////////////////////////////////////////////////////
    if( animFlag )
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;
    
    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function(ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };
    
    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function(ev) {
        controller.dragging = false;
    };
    
    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function(ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}
