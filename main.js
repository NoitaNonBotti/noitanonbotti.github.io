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

// ---------- Background Shader ----------

const bgMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: { value: 0 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main(){
            vUv = uv;
            gl_Position = vec4(position,1.0);
        }
    `,
    fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        float noise(vec2 p){
            return sin(p.x)*sin(p.y);
        }

        vec3 palette(float t){
            vec3 a = vec3(0.03,0.04,0.08);
            vec3 b = vec3(0.08,0.05,0.18);
            vec3 c = vec3(0.15,0.08,0.28);
            vec3 d = vec3(0.05,0.18,0.35);
            return mix(
                mix(a,b,sin(t)*0.5+0.5),
                mix(c,d,cos(t*0.7)*0.5+0.5),
                0.5
            );
        }

        void main(){
            vec2 uv = vUv * 2.0 - 1.0;
            float t = uTime * 0.15;

            float n = noise(uv*4.0 + t) + noise(uv*6.0 - t*1.3);
            n *= 0.5;

            float radial = length(uv);
            float vignette = smoothstep(1.2,0.2,radial);

            vec3 col = palette(n + t);
            col *= vignette;

            gl_FragColor = vec4(col,1.0);
        }
    `,
    depthWrite: false
});

const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), bgMaterial);
bgMesh.frustumCulled = false;
scene.add(bgMesh);

// ---------- Lighting ----------

const ambient = new THREE.AmbientLight(0x1c2545, 0.7);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 1.1);
key.position.set(5,5,5);
scene.add(key);

const rim = new THREE.DirectionalLight(0x445bff, 1.0);
rim.position.set(-5,-2,-5);
scene.add(rim);

// ---------- Hero ----------

const hero = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5,3),
    new THREE.MeshStandardMaterial({
        color: 0x1e2240,
        metalness: 0.9,
        roughness: 0.25,
        emissive: 0x3a4bff,
        emissiveIntensity: 0.25
    })
);
scene.add(hero);

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

const sections = 4;
const sectionSpacing = 12;

for(let s=0; s<sections; s++){
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
        mesh.position.y = -s*sectionSpacing + Math.random()*6;
        mesh.position.z = (Math.random()-0.5)*14 - 5;

        mesh.userData.baseY = mesh.position.y;

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

const sectionsData = [
    {id:"home",  title:"Noitanonbotti", content:"A Truly non vibe coding developer that creates this website for literally compliance" },
    {id:"about", title:"About",         content:"I do not have any experience in anything what so ever."},
];

const wrapper=document.createElement("div");
wrapper.style.position="relative";
wrapper.style.zIndex="2";
document.body.appendChild(wrapper);

sectionsData.forEach(sec=>{
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

    const h=document.createElement("h1");
    h.innerText=sec.title;
    h.style.fontSize="3rem";
    h.style.color="#ffffff";

    const p=document.createElement("p");
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

let currentSection = 0;
let targetCameraY = 0;

function goToSection(index){
    currentSection = THREE.MathUtils.clamp(index,0,sections-1);
    targetCameraY = -currentSection*sectionSpacing;
    document.getElementById(sectionsData[currentSection].id)
        .scrollIntoView({behavior:"smooth"});
}

sectionsData.forEach((sec,index)=>{
    const btn=document.createElement("button");
    btn.innerText=sec.title;
    btn.style.background="transparent";
    btn.style.border="none";
    btn.style.cursor="pointer";
    btn.style.color="#6f83ff";
    btn.style.fontSize="0.9rem";
    btn.onclick=()=>goToSection(index);
    nav.appendChild(btn);
});

// scroll wheel section snapping
let wheelTimeout;
window.addEventListener("wheel",e=>{
    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(()=>{
        if(e.deltaY>0) goToSection(currentSection+1);
        else goToSection(currentSection-1);
    },50);
});

// reveal
window.addEventListener("scroll",()=>{
    sectionsData.forEach(sec=>{
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
});

const clock=new THREE.Clock();

function animate(){
    const t=clock.getElapsedTime();

    bgMaterial.uniforms.uTime.value=t;

    hero.rotation.x=t*0.4;
    hero.rotation.y=t*0.6;

    camera.position.y += (targetCameraY - camera.position.y)*0.07;
    camera.position.x += (mouse.x*2 - camera.position.x)*0.05;
    camera.lookAt(0,camera.position.y,0);

    const recycleThreshold = camera.position.y - sectionSpacing*1.2;

    objects.forEach((o,i)=>{
        o.rotation.x+=0.01;
        o.rotation.y+=0.015;

        o.position.y -= 0.02;

        if(o.position.y < recycleThreshold){
            o.position.y = camera.position.y + sectionSpacing*2 + Math.random()*5;
        }
    });

    renderer.render(scene,camera);
}

renderer.setAnimationLoop(animate);
