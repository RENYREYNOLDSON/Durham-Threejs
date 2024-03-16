/////////////CODE FOR THREE JS - ADVANCED COMPUTER GRAPHICS DURHAM UNIVERSITY 2023
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { NURBSSurface } from 'three/examples/jsm/curves/NURBSSurface.js';
import { NURBSCurve } from 'three/addons/curves/NURBSCurve.js';
import Stats from 'three/examples/jsm/libs/stats.module'
import { Clock } from 'three';
import {SimplifyModifier} from 'three/examples/jsm/modifiers/SimplifyModifier.js';

// Create the main scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 5000 );
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Enabling shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap; 
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
// Orbit Controls
const controls = new OrbitControls( camera, renderer.domElement );
const loader = new GLTFLoader();


//SKYBOX LOADER
{
	const loader = new THREE.CubeTextureLoader();
	const texture = loader.load([
	  'textures/Daylight Box_Right.bmp',
	  'textures/Daylight Box_Left.bmp',
	  'textures/Daylight Box_Top.bmp',
	  'textures/Daylight Box_Bottom.bmp',
	  'textures/Daylight Box_Front.bmp',
	  'textures/Daylight Box_Back.bmp',
	]);
	scene.background = texture;
}

//Lighting
// Ambient
const ambient_light = new THREE.AmbientLight("white",0.08);
scene.add(ambient_light);
// Directional
const sun = new THREE.DirectionalLight("white",2)
sun.position.set(0,400,0);
sun.castShadow=true;
scene.add( sun );
//Set up shadow properties for the light
sun.shadow.mapSize.width = 2048; // default
sun.shadow.mapSize.height = 2048; // default
sun.shadow.camera.near = 0.5; // default
sun.shadow.camera.far = 2000; // default
sun.shadow.camera.bottom=-250;
sun.shadow.camera.top=250;
sun.shadow.camera.right=250;
sun.shadow.camera.left=-250;




//Create parametric Curve around the centre
var repeats = 100;
var textureLoader = new THREE.TextureLoader();
textureLoader.setPath('textures/');
var texture = textureLoader.load('grass_2.jpg', function (texture) {
    texture.encoding = THREE.sRGBEncoding;
});
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(repeats, repeats);
function terrainFunction(u, v) {
    var radius = 300;
    var hillHeight = 20;
    var flatBottomHeight = -0.5;
    var flatBottomSize = 0.5;

    var angle = u * Math.PI * 2;
    var distanceToCenter = v * radius;

    var x = Math.cos(angle) * distanceToCenter;
    var y = flatBottomHeight;
    if (distanceToCenter > flatBottomSize * radius) {
        y += hillHeight * smoothStep(flatBottomSize * radius, radius, distanceToCenter);
    }
    var z = Math.sin(angle) * distanceToCenter;
    var u = (Math.atan2(x, z) / (2 * Math.PI) + 0.5) * repeats;
    var v = (y / hillHeight + 0.5) * repeats;
    return { position: new THREE.Vector3(x, y, z), uv: new THREE.Vector2(u, v) };
}

function smoothStep(edge0, edge1, x) {
    var t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
    return t * t * (3 - 2 * t);
}

var geometry = new THREE.BufferGeometry();
var vertices = [];
var indices = [];
var uvs = [];
var numPoints = 100;

for (var i = 0; i <= numPoints; i++) {
    for (var j = 0; j <= numPoints; j++) {
        var u = i / numPoints;
        var v = j / numPoints;
        var point = terrainFunction(u, v);

        vertices.push(point.position.x, point.position.y, point.position.z);
        uvs.push(u, v);

        if (i < numPoints && j < numPoints) {
            var vertexIndex = i * (numPoints + 1) + j;
            indices.push(vertexIndex, vertexIndex + 1, vertexIndex + numPoints + 1);
            indices.push(vertexIndex + 1, vertexIndex + numPoints + 2, vertexIndex + numPoints + 1);
        }
    }
}

geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
geometry.setIndex(indices);

var material = new THREE.MeshStandardMaterial({ map: texture, side: THREE.DoubleSide });
var mesh = new THREE.Mesh(geometry, material);
mesh.position.z=30
mesh.receiveShadow=true;
scene.add(mesh);
/////


//3D OBJECT IMPORTING
function drawBuilding(file) {
	var lod = new THREE.LOD();

	// High Detail
	loader.load( 'models/'+file[0]+'.glb', function ( glb ) {
		//glb.scene.position.x=50;
		// Make this cast shadows
		lod.addLevel( glb.scene,0);
		glb.scene.traverse( function( node ) {
			if ( node.isMesh ) { 
				node.castShadow = true;
				node.receiveShadow=true;}
		} );
	});
	// Low Detail
	loader.load( 'models/'+file[1]+'.glb', function ( glb ) {
		//glb.scene.position.x=50;
		// Make this cast shadows
		lod.addLevel(glb.scene,200)
		glb.scene.traverse( function( node ) {
			if ( node.isMesh ) { 
				node.castShadow = true;
				node.receiveShadow=true;}
		} );
	});
	scene.add(lod)
};

function drawBuildings(buildings){
	for (let i=0;i<buildings.length;i++){
		drawBuilding(buildings[i])
	};
};

// Use billboarding to show static trees
function drawTrees(){
	for (let i=0;i<tree_count;i++){
		var randomU = Math.random();
		var randomV = Math.random();
		var treePosition = terrainFunction(randomU, randomV).position;
		var billboard = new THREE.SpriteMaterial({map: new THREE.TextureLoader().load("textures/tree_1.png")});
		var sprite = new THREE.Sprite(billboard);
		sprite.position.copy(treePosition);
		sprite.position.y+=4;
		sprite.castShadow=true;
		sprite.scale.set(10,10,10)
		if (!((sprite.position.z<110) && (sprite.position.z>-50) && (sprite.position.x<100) && (sprite.position.x>-100))){
			scene.add(sprite)
		};
		
	};

};

// Lights in buildings
function drawLights(lights){
	for (let i=0;i<lights.length;i++){
		var indoor = new THREE.PointLight( "white", 100, lights[i][3] );
		indoor.position.set(lights[i][0],lights[i][1],lights[i][2]);
		indoor.castShadow=true;
		scene.add(indoor);
		lights_array.push(indoor);
	};
};
function lightsOn(){
	for (let i=0;i<lights_array.length;i++){
		lights_array[i].intensity=100;
	};
};
function lightsOff(){
	for (let i=0;i<lights_array.length;i++){
		lights_array[i].intensity=0;
	};
};

// Class to manage skeletons
class Human{
	constructor (scene,mixer,path){
		this.scene = scene;
		this.mixer = mixer;
		this.path=path;
		this.current=0;
		this.angle = 0;
		this.step=0;
	};
	move(d){
		//Set angle toward next position
		if ((Math.abs(this.path[this.step+1][0]-this.scene.position.x)<0.1) && (Math.abs(this.path[this.step+1][2]-this.scene.position.z)<0.1)){
			this.step+=1;
			if (this.step>=this.path.length-1){
				this.step=0;
			};
		};
		this.angle=Math.atan2((this.path[this.step+1][0]-this.scene.position.x),(this.path[this.step+1][2]-this.scene.position.z));
		this.scene.rotation.set(0,this.angle,0);

		//Move toward next path
		this.scene.position.x+=Math.sin(this.angle)*0.025;
		this.scene.position.z+=Math.cos(this.angle)*0.025;
		this.mixer.update(d);
	};
};


let humans_array = [];
// Skeletal Animation
function addHuman(path){
	loader.load( 'models/mr_man_walking.glb', function ( glb ) {
		glb.scene.scale.set(0.6,0.6,0.6)
		glb.scene.position.set(path[0][0],path[0][1],path[0][2])

		//Skeletal Animations
		let mixer = new THREE.AnimationMixer( glb.scene );
		var action = mixer.clipAction( glb.animations[ 0 ] );
		action.play();
		scene.add( glb.scene );
		// Make this cast shadows
		glb.scene.traverse( function( node ) {
			if ( node.isMesh ) { 
				node.castShadow = true;
				node.receiveShadow=true;}
		} );
		//Add Human to array
		humans_array.push(new Human(glb.scene,mixer,path))
		let skeleton = new THREE.SkeletonHelper(glb.scene);
		skeleton.visible=false;
		scene.add(skeleton)
	});
};



function getRndInteger(min, max) {
	return Math.floor(Math.random() * (max - min + 1) ) + min;
  }

function randomRoute(){
	let array = []
	let route = routeRanges[Math.floor(Math.random()*routeRanges.length)]

	for (let i=0;i<Math.max(getRndInteger(9,20));i++){
		array.push([getRndInteger(route[0],route[1]),route[4],getRndInteger(route[2],route[3])])
	};
	array.push(array[0]);//Add start pos back to this
	return array;
};

//How many humans we want
function drawHumans(){
	addHuman([[-10,0,10],[-15,0,36],[-40,0,60],[-40,0,95],[34,0,80],[30,0,20],[-10,0,10]]);//Specific route
	for (let i=0;i<human_count;i++){
		addHuman(randomRoute());//Random generated routes
	};
};


// Creating Plane
//Loading textures
function drawPlane(){
	var groundTexture = new THREE.TextureLoader().load("textures/street_1.jpg")
	groundTexture.generateMipmaps=true;//Generate minmaps for performance
	groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
	groundTexture.repeat.set( 100, 100 );
	groundTexture.anisotropy = 16;//Directions
	groundTexture.encoding = THREE.sRGBEncoding;
	//Creating physical plane
	const geom = new THREE.PlaneGeometry(200,150);
	const mat = new THREE.MeshStandardMaterial({map:groundTexture});
	const plane = new THREE.Mesh(geom,mat);
	plane.position.set(0,0,30);
	plane.rotation.set(-3.14/2,0,0)
	plane.receiveShadow=true;
	plane.castShadow=false;
	scene.add(plane);
};

////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
// VARIABLES
var time = 0;
var sun_z = 0;
var human_count=15;
const tree_count=200;
const day_length=10000; //Day Length in frames
//let models = ["tavern_simple","church_simple","boots_simple","tesco_high","greggs_simple","whs_simple","next_simple","statues_high"];
let models = [["tesco_high","tesco_simple"],
				["tavern_simple","tavern_simple"],
				["church_simple","church_simple"],
				["boots_simple","boots_simple"],
				["greggs_simple","greggs_simple"],
				["whs_simple","whs_simple"],
				["next_simple","next_simple"],
				["statues_high","statues_high"]];
let lights_array = []
let lights = [[5,2,-5,100],[20,2,50,100],[-45,2,10,100],[-20,4,25,300]]
// Create random routes for the skeletons
const routeRanges=[[-25,35,1,18,0],[5,20,1,40,0],[-15,70,30,40,0],[-28,-20,20,30,1]]

// STATS
const stats = new Stats()
document.body.appendChild(stats.dom)
var clock = new THREE.Clock();


// Place all objects
drawBuildings(models);
drawTrees()
drawLights(lights)
drawHumans();
drawPlane();


// Moving camera at start
camera.position.z = 40;
camera.position.y = 20;
camera.position.x=-40;
camera.rotateX(-0.3);
camera.rotateZ(-0.3)
camera.rotateY(-0.8)

//scene.add( new THREE.CameraHelper( sun.shadow.camera ) );

// Main Animate Function
function animate() {
	requestAnimationFrame( animate );
	// Day/Night Cycle
	//Move Sun - move this in a circle
	time+=2*Math.PI/day_length;
	sun.position.x = Math.sin(time)*400;
	sun.position.y = Math.cos(time)*400;
	//sun.position.z = Math.cos(sun_z)*400;

	if (time>=2*Math.PI){time=0; sun_z+=0.1;};
	if (sun_z>=2*Math.PI){sun_z=0;};

	//Change directional Light Intensity
	sun.intensity=2*Math.cos(time);
	// Change Ambient Light Intensity
	ambient_light.intensity=Math.max(1*Math.cos(time),0.05);

	// Change Night Time Lights
	if ((time>Math.PI*0.4) && (time<Math.PI*2)){lightsOn();}else{lightsOff();};

	if ((time>Math.PI*0.5) && (time<Math.PI*1.5)){sun.intensity=0;};

	// Update Animations
	var delta = clock.getDelta();
	
	for (let i=0;i<humans_array.length;i++){
		humans_array[i].move(delta);
	};
	
	scene.backgroundIntensity=Math.max(0.01,Math.cos(time));
	renderer.render( scene, camera );
	stats.update()
}

animate();
// Handle window resize so that it corrects itself
window.addEventListener('resize', function () {
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
});
