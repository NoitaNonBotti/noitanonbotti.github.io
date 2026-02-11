import * as THREE from 'three';

import { add } from './test.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild( renderer.domElement );

const file_loader = new THREE.FileLoader();

const clock = new THREE.Clock();

const stats_ui = new Stats();
const container = document.getElementById( 'container' );
container.appendChild( stats_ui.dom );

// scene definition
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x000000 );
const ambient_light = new THREE.AmbientLight( 0xffffff, 0.1 );
scene.add(ambient_light);

// lights
const pt_light = new THREE.PointLight( 0xAA8899, 1, 0, 0 );
pt_light.position.set( 0, 20, 25 );
scene.add( pt_light );

const pt_light_helper = new THREE.PointLightHelper( pt_light, 1.0);
scene.add( pt_light_helper );

const PI = 3.1415926535;
const DEG2RAD = PI / 180.0;

RectAreaLightUniformsLib.init();

const rect_light1 = new THREE.RectAreaLight( 0xff0000, 5, 4, 10 );
rect_light1.position.set( -5, 6, -7 );
rect_light1.rotateY(PI);
scene.add( rect_light1 );

const rect_light2 = new THREE.RectAreaLight( 0x00ff00, 5, 4, 10 );
rect_light2.position.set( 0, 6, -7 );
rect_light2.rotateY(PI + 1);
scene.add( rect_light2 );

const rect_light3 = new THREE.RectAreaLight( 0x0000ff, 5, 4, 10 );
rect_light3.position.set( 5, 6, -7 );
rect_light3.rotateY(PI + 2);
scene.add( rect_light3 );

scene.add( new RectAreaLightHelper( rect_light1 ) );
scene.add( new RectAreaLightHelper( rect_light2 ) );
scene.add( new RectAreaLightHelper( rect_light3 ) );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set( 0, 0, 20 );
camera.lookAt( 0, 0, 0 );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0.5, 0 );
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

const floor_geo = new THREE.BoxGeometry( 2000, 0.1, 2000 );
const floor_mat = new THREE.MeshStandardMaterial( { color: 0x444444 } );
floor_mat.roughnessMap = createCheckerTexture( 400 );
const floor_mesh = new THREE.Mesh( floor_geo, floor_mat );
floor_mesh.position.y = -6;
scene.add( floor_mesh );


const mat = new THREE.MeshStandardMaterial( { color: 0xffffff, roughness: 0, metalness: 0 } );
mat.fog = true;

const torus_knot_geo = new THREE.TorusKnotGeometry( 3, 1, 100, 16 ).toNonIndexed();
const torus_knot = new THREE.Mesh( torus_knot_geo, mat );

scene.add( torus_knot );

const shader_plane_geo = new THREE.PlaneGeometry( 88.8976, 50 );

let uniforms = {
    'iTime': { value: 1.0 },
    'iMouse': { value: new THREE.Vector2(70, 0) }
};

const vert_shader_src = await file_loader.loadAsync( '/public/shaders/vert_shader.vert' );
const frag_shader_src = await file_loader.loadAsync( '/public/shaders/frag_shader.frag' );

const blackhole_shader_mat = new THREE.ShaderMaterial( {
    uniforms: uniforms,
    vertexShader: vert_shader_src,
    fragmentShader: frag_shader_src,
} );

const shader_plane = new THREE.Mesh(shader_plane_geo, blackhole_shader_mat);

shader_plane.position.set(0, 25, -20);

scene.add(shader_plane);

const gltf_loader = new GLTFLoader();
gltf_loader.load("models/small_city/scene.gltf", (gltf) => {
    scene.add(gltf.scene);
    gltf.scene.position.set(4.5, 0, 25);
    gltf.scene.scale.set(0.01, 0.01, 0.01);
    console.log(gltf.scene);
})

const gui = new GUI();
const folder_scene = gui.addFolder( 'Scene' );
folder_scene.add(ambient_light, 'intensity', 0, 1, 0.1);
folder_scene.open();

const folder_shader = gui.addFolder( 'Shader' );
folder_shader.add(uniforms.iMouse.value, 'x', -50, 88.8976, 0.1);
folder_shader.add(uniforms.iMouse.value, 'y', -50, 50, 0.1);
folder_shader.open();

const folder_tonemapping = gui.addFolder( 'Tonemapping' );
folder_tonemapping.add(renderer, 'toneMappingExposure', 0.1, 1, 0.01);
folder_tonemapping.open();


window.addEventListener( 'resize', update_cam_renderer_aspect );

function update_cam_renderer_aspect() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    const delta = 5 * clock.getDelta();

    uniforms['iTime'].value += 0.2 * delta;

    rect_light1.rotateY(0.01 * delta);
    rect_light2.rotateY(0.01 * delta);
    rect_light3.rotateY(0.01 * delta);

    torus_knot.rotateX(0.01 * delta);
    torus_knot.rotateY(0.015 * delta);

    controls.update();
    stats_ui.update();

    renderer.render( scene, camera );
}

function createCheckerTexture( repeat = 1 ) {
    const canvas = document.createElement( 'canvas' );
    canvas.width = 2;
    canvas.height = 2;

    const ctx = canvas.getContext( '2d' );
    ctx.fillStyle = '#000';
    ctx.fillRect( 0, 0, 2, 2 );
    ctx.fillStyle = '#fff';
    ctx.fillRect( 0, 0, 1, 1 );
    ctx.fillRect( 1, 1, 1, 1 );

    const texture = new THREE.CanvasTexture( canvas );
    texture.repeat.set( repeat, repeat );
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    return texture;

}

renderer.setAnimationLoop( animate );
