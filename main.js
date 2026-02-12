import * as THREE from 'three';

const container = document.getElementById("container");

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);
camera.position.set(0, 0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "0";
container.appendChild(renderer.domElement);

let scrollOffset = 0;

// ---------- Voronoi Shadertoy Background ----------
const bgMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uScroll: { value: 0 }
    },
    vertexShader: `
varying vec2 vUv;
void main() {
vUv = uv;
gl_Position = vec4(position,1.0);
}
`,
    fragmentShader: `
uniform float uTime;
uniform vec2 uResolution;
uniform float uScroll;
varying vec2 vUv;

#define SIZE 30.0
#define t uTime*2.0

vec3 col1 = vec3(91.0,33.0,119.0)/255.0;
vec3 col2 = vec3(47.0,107.0,175.0)/255.0;

vec2 ran(vec2 uv){
uv *= vec2(dot(uv,vec2(127.1,311.7)), dot(uv,vec2(227.1,521.7)));
return 1.0 - fract(tan(cos(uv)*123.6)*3533.3)*fract(tan(cos(uv)*123.6)*3533.3);
}

vec2 pt(vec2 id){
return sin(t*(ran(id+0.5)-0.5) + ran(id-20.1)*8.0)*0.5;
}

void main() {
vec2 fragCoord = vUv * uResolution;
vec2 uv = (fragCoord - 0.5*uResolution.xy)/uResolution.x;

// Scroll offset
vec2 off = vec2(uTime/50.0, uScroll/30.0);
uv += off;
uv *= SIZE;

vec2 gv = fract(uv)-0.5;
vec2 id = floor(uv);

float mindist = 1e9;
vec2 vorv;

for(float i=-1.0;i<=1.0;i++){
for(float j=-1.0;j<=1.0;j++){
vec2 offv = vec2(i,j);
float dist = length(gv + pt(id+offv) - offv);
if(dist < mindist){
mindist = dist;
vorv = (id + pt(id+offv) + offv)/SIZE - off;
}
}
}

vec3 col = mix(col1, col2, clamp(vorv.x*2.2 + vorv.y, -1.0, 1.0)*0.5 + 0.5);
gl_FragColor = vec4(col,1.0);
}
`,
    depthWrite: false
});

const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), bgMaterial);
bgMesh.frustumCulled = false;
scene.add(bgMesh);

window.addEventListener('resize',()=>{
    bgMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

// ---------- Lighting ----------

const ambient = new THREE.AmbientLight(0x1c2545, 0.7);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(5,5,5);
scene.add(key);

const rim = new THREE.DirectionalLight(0x445bff, 1.0);
rim.position.set(-5,-2,-5);
scene.add(rim);

// ---------- Objects ----------

const objects = [];
const geometries = [
    new THREE.BoxGeometry(1,1,1,6,6,6),
    new THREE.TorusGeometry(0.8,0.25,32,64),
    new THREE.ConeGeometry(0.8,1.6,64)
];

const palette = [
    0x3f51b5,
    0x5c6bc0,
    0x3949ab,
    0x6a1b9a,
    0x283593
];

const sections_data = [
    {id:"about",           title:"About",           content:"c1a6af08c76cb9a1a8f263689fd3f7ed3e69fc6bab11fad44e4f9a2d5f7de2a75ChfwHF+HbQ/jfV/3HdgK2Qi2zzpvFrW+zUpIxSUenvyzy1NeAqaglPxY0TTO7+2fgG7S0qHwDVpTFD6zZ7H7Ocf/ji2T62hO5U+fhntxBjGll4BNZ/UtFdoGwahIFzpqXFCIlX5eiplPUDhHbbih3nWL9ogq7gm8XdzyCOS745ftPM2S0/GN76q8a6DhRrWOmJ3gFCz8i7V1I+xzyovtfv9dRH73ryKkaV6xiCMB6iztBYdsvrKKfaVV2U9m6RDt4mR4j+AP/6Shjd0Z8EZ+bXtiq74CZEEJpJ3SDrU+dmBs8jnMXRpp6iH4WeMMNjp7ZhJ/eu6CV3qZqlrZNoOJw==76a45d91b0db60538102caab42fd1e5105585cad286d13739aa86e09c2075b9e"},
    {id:"routine",         title:"Routine",         content:"6ccc0e8b956392b8abffe74f45cc611aa1c7943c2b7dd3153bd900079087769334wOt7JOtxoENmPDeJNsvOrz9jaN7ZtWLbhYsqg3d495LpA25sntUZ7cRFtyEddv9tCMDN36LI38cjHe0GVeGdJ9lwRdICd7HNyF/sqdcZ4=6b026bb98f8406bb460865b402bc6f01cbf066ece62601bda7f7bd146e7f2f41"},
    {id:"must_have",       title:"Must Haves",      content:"602aa4434c02306070eb513d9d7102b7c2c409f12db2c594bac549cb6761334bvMrlqYn6CavLgxAsxtMaQ9rDMlGTCuk1D5eQ57/2D0/tl7kWp0QtniAIJsYHslVhCDQ274cBhXOCpZIb4cHzzA/B1RKfhCTorGQG0IPgbo45F6Z2hBLjRHiP7n8KrtA0uS6sulbiDJlD9tHx92X61qLWGsMT9534+pZujmDVJlqt3YTr8TmnNPyZZD6eviXVnEB8WzOTUuaUGhafI/gfVg==c328466ccd2701b8bf185a56c95fe6e922e35c426ced9ea5ce2dc774dcefffba"},
    {id:"additional_info", title:"Additional Info", content:"acc6ceca941811749bd2551fbc03ed155b9c64406a2bb63e4c74abc76d5bdfaeIN0am6nSiHtqeZuNOzPQfQf6Qd63/S+srxgMm8yxtnEQEMirk30Ljfqqd92iuCVo9GWkxtCVFH2QYUuwKVULHA==7c35f1a315d2cbdff42523b2c67e98fa8a439df9bbeb1296b843d3c723f19ea2"},
];


const sections = sections_data.length;
const section_spacing = 12;

for(let s=0; s < sections; s++){
    for(let i=0;i<6;i++){

        const color = palette[(i+s)%palette.length];

        const mesh = new THREE.Mesh(
            geometries[i%geometries.length],
            new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.85,
                roughness: 0.25,
                emissive: color,
                emissiveIntensity: 0.12
            })
        );

        mesh.position.x = (Math.random()-0.5)*(10 + s*4);
        mesh.position.y = -s*section_spacing + Math.random()*6;
        mesh.position.z = (Math.random()-0.5)*14 - 5;

        scene.add(mesh);
        objects.push(mesh);
    }
}

// ---------- UI ----------

document.body.style.margin="0";
document.body.style.height=`${sections*100}vh`;
document.body.style.fontFamily="Helvetica, Arial, sans-serif";
document.body.style.color="#d6e2ff";
document.body.style.background="transparent";

const wrapper=document.createElement("div");
wrapper.style.position="relative";
wrapper.style.zIndex="2";
document.body.appendChild(wrapper);

// actual content of section
sections_data.forEach(sec => {
    const div=document.createElement("section");
    div.id=sec.id;
    div.style.minHeight="100vh";
    div.style.display="flex";
    div.style.flexDirection="column";
    div.style.justifyContent="center";
    div.style.paddingLeft="15vw";
    div.style.maxWidth="800px";
    div.style.opacity="0";
    div.style.transform="translateY(40px)";
    div.style.transition="all 0.8s ease";

    const h = document.createElement("h1");
    h.classList.add('section_header');
    h.innerText=sec.title;
    h.style.fontSize="3rem";
    h.style.color="#ffffff";

    const p = document.createElement("p");
    p.classList.add('section_content');
    p.innerText=sec.content;
    p.style.color="#9fb4ff";
    p.style.fontSize="1.2rem";
    p.style.lineHeight="1.6";

    div.appendChild(h);
    div.appendChild(p);
    wrapper.appendChild(div);
});

// ---------- Tabs ----------

const nav=document.createElement("div");
nav.style.position="fixed";
nav.style.right="40px";
nav.style.top="50%";
nav.style.transform="translateY(-50%)";
nav.style.display="flex";
nav.style.flexDirection="column";
nav.style.gap="20px";
nav.style.zIndex="3";
document.body.appendChild(nav);

let current_section = 0;
let targetCameraY = 0;

function go_to_section(index){
    current_section = THREE.MathUtils.clamp(index,0,sections-1);
    targetCameraY = -current_section*section_spacing;

    scrollOffset = current_section / sections;

    document.getElementById(sections_data[current_section].id)
        .scrollIntoView({behavior:"smooth"});
}

// side bar
sections_data.forEach((sec,index)=>{
    const btn=document.createElement("button");
    btn.innerText=sec.title;
    btn.style.background="transparent";
    btn.style.border="none";
    btn.style.cursor="pointer";
    btn.style.color="#ffffff";
    btn.style.fontSize="0.9rem";
    btn.onclick=()=>go_to_section(index);
    nav.appendChild(btn);
});

let wheelTimeout;
window.addEventListener("wheel",e=>{
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(()=>{
        if(e.deltaY>0) go_to_section(current_section + 1);
            else go_to_section(current_section - 1);
    },50);
});

window.addEventListener("scroll",()=>{
    sections_data.forEach(sec=>{
        const el=document.getElementById(sec.id);
        const rect=el.getBoundingClientRect();
        if(rect.top<window.innerHeight*0.6){
            el.style.opacity="1";
            el.style.transform="translateY(0)";
        }
    });
});

const mouse={x:0,y:0};
window.addEventListener("mousemove",e=>{
    mouse.x=(e.clientX/window.innerWidth)*2-1;
    mouse.y=-(e.clientY/window.innerHeight)*2+1;
});

window.addEventListener("resize",()=>{
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
    bgMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

const clock=new THREE.Clock();

var time_prev = clock.getElapsedTime();

function lerpf(a, b, t) {
    return a + (b - a) * t;
}

function animate(){
    const time = clock.getElapsedTime();
    const dt = time - time_prev;
    time_prev = time;

    bgMaterial.uniforms.uTime.value = time;
    bgMaterial.uniforms.uScroll.value = lerpf(bgMaterial.uniforms.uScroll.value, scrollOffset, dt * 0.8);

    const lerp_speed = 5;
    camera.position.y = lerpf(camera.position.y, mouse.y * 0.5 + targetCameraY, dt * lerp_speed);
    camera.position.x = lerpf(camera.position.x, mouse.x, dt * lerp_speed);

    camera.lookAt(0, camera.position.y, 0);

    const recycle_threshold = camera.position.y - section_spacing * 1.2;

    objects.forEach((obj, i) => {
        var multiplier = (i + 1);
        obj.rotation.x += 1 * dt * multiplier * 0.1;
        obj.rotation.y += 0.15 * dt * multiplier * 0.2;

        obj.position.y -= 2 * dt * multiplier * 0.1;

        if(obj.position.y < recycle_threshold) {
            obj.position.y = camera.position.y + section_spacing * 2 + Math.random() * 5;
        }
    });

    renderer.render(scene, camera);
}

function decrypt_everything(key) {
    var crypt = new SimpleCrypto(key);
    
    try {
        $(".section_content").text(function(idx, o_text) {
            return `${crypt.decrypt(o_text)}`;
        });


        alert("WOHOO, correct password!");

        $("#password_decryption_form").hide();
    }

    catch(except) {
        alert("Ooops, wrong password :O, try again please :); hint: it's related to our class :O");
    }
}

// jquery stuff
$(document).ready(function() {
    go_to_section(0);

    $("#decrypt_password_input").on("keyup", function(evt) {
        if(evt.key === "Enter" || evt.keyCode === 13) {

            var key = $(this).val();
            decrypt_everything(key);
        }
    });

    $("#submit_btn").click(function() {
        var key = $("#decrypt_password_input").val();
        decrypt_everything(key);
    });
});

renderer.setAnimationLoop(animate);

