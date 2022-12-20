
const scene = new THREE.Scene();
const persp = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 2000);
// FOV, aspect ratio, near clip, far clip
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector('#bg')
});
THREE.Cache.enabled = true;

const file_loader = new THREE.FileLoader();
file_loader.setResponseType("text");

var planet;
var atmo;
var atmo_mat_custom;

var y_rotation_speed = 0.005;

const resources_list = {
	"planet_tex": false,
	"planet_ref": false,
	//"planet_bmp": false,
	"atmo_frag": false,
	"atmo_vert": false,
}

const deg_to_rad = (deg) => (Math.PI/180) * deg;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );


persp.position.set(0,0,10);


// DIRECTIONAL LIGHT

var light_direction = [45, 30];
var light_distance = 20;
const dir_light = new THREE.DirectionalLight( 0xffffff,  1);

dir_light.position.set(
	light_distance * Math.cos(deg_to_rad(light_direction[1])) * Math.sin(deg_to_rad(light_direction[0])),
	light_distance * Math.sin(deg_to_rad(light_direction[1])),
	light_distance * Math.cos(deg_to_rad(light_direction[1])) * Math.cos(deg_to_rad(light_direction[0]))
);
scene.add( dir_light );



const ambient = new THREE.AmbientLight(0x262636); // soft white light
scene.add(ambient);


// RESOURCES
const planet_mesh = new THREE.SphereGeometry(6.378, 64, 32);
const texture_loader = new THREE.TextureLoader();

var earth_diffuse_tex;
texture_loader.load('./tex/earth_eq.png', (response) => {
	earth_diffuse_tex = response; resources_list["planet_tex"] = true; start_page();
});
var earth_roughness_tex;
texture_loader.load('./tex/earth_land_tiny.jpg', (response) => {
	earth_roughness_tex = response; resources_list["planet_ref"] = true; start_page();
});


var atmo_shader_frag;
file_loader.load("./atmo_shader_frag.glsl", (response) => {
	atmo_shader_frag = response; resources_list['atmo_frag'] = true; start_page();
});
var atmo_shader_vert;
file_loader.load("./atmo_shader_vert.glsl", (response) => {
	atmo_shader_vert = response; resources_list['atmo_vert'] = true; start_page();
});


function light_rotation(key_code){
	light_direction;
	
	if (key_code == 37){light_direction[0] += 5;}
	else if (key_code == 39){light_direction[0] -= 5;}
	else if (key_code == 38){light_direction[1] += 5;}
	else if (key_code == 40){light_direction[1] -= 5;}

	// light_direction: [azimuth (0-360), altitude(+-90)]
	if (light_direction[0] > 360){light_direction[0] -= 360;}
	else if (light_direction[0] < 0){light_direction[0] += 360;}
	light_direction[1] = Math.min(Math.max(light_direction[1], -90), 90);

	dir_light.position.set(
		light_distance * Math.cos(deg_to_rad(light_direction[1])) * Math.sin(deg_to_rad(light_direction[0])),
		light_distance * Math.sin(deg_to_rad(light_direction[1])),
		light_distance * Math.cos(deg_to_rad(light_direction[1])) * Math.cos(deg_to_rad(light_direction[0]))
	);
}


document.addEventListener('keydown', event_handler, false);
function event_handler(key) {
	// camera controls
	if (188 === key.keyCode && persp.position.z < 50){
		persp.position.z *= 1.1;
	} else if (190 === key.keyCode && persp.position.z > 6.5){
		persp.position.z /= 1.1;
	} else if (65 === key.keyCode && persp.position.x > -2) {
		persp.position.x -= 0.1;
	} else if (68 === key.keyCode && persp.position.x < 2) {
		persp.position.x += 0.1;
	} else if (83 === key.keyCode && persp.position.y > -1) {
		persp.position.y -= 0.1;
	} else if (87 === key.keyCode && persp.position.y < 1) {
		persp.position.y += 0.1;
	}
	// planet tilt
	else if (82 === key.keyCode && planet.rotation.x > -1) {
		planet.rotation.x -= 0.1;
	} else if (70 === key.keyCode && planet.rotation.x < 1) {
		planet.rotation.x += 0.1;
	}
	// planet rotation
	else if (90 === key.keyCode && y_rotation_speed > -0.05){
		y_rotation_speed -= 0.005;
	} else if (88 === key.keyCode) {
		y_rotation_speed = 0;
	} else if (67 === key.keyCode && y_rotation_speed < 0.05){
		y_rotation_speed += 0.005;
	}

	// light controls
	else if ([37, 38, 39, 40].includes(key.keyCode)) {
		light_rotation(key.keyCode);
	}

	// debug atmo rotation
	else if (key.keyCode === 100){
		if (key.shiftkey){atmo.position.y += 0.5;}
		else {atmo.rotation.y -= 0.1;}
	} else if (key.keyCode === 102){
		if (key.shiftKey){atmo.position.y -= 0.5;}
		else {atmo.rotation.y += 0.1;}
		
	} else if (key.keyCode == 104){
		if (key.shiftKey){atmo.position.x += 0.5;}
		else {atmo.rotation.x += 0.1;}
		
	} else if (key.keyCode == 98){
		if (key.shiftKey){atmo.position.x -= 0.5;}
		else {atmo.rotation.x -= 0.1;}
		
	}


	else {
		console.log(key);
	}
}


function animate() {
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	persp.aspect = window.innerWidth/window.innerHeight;
	persp.updateProjectionMatrix();
	// mesh.rotation.x += 0.007;


	planet.rotation.y += y_rotation_speed;

	// update shader uniforms
	atmo_mat_custom.uniforms.obj_position.value.x = new THREE.Vector3(
		atmo.position
	)

	requestAnimationFrame( animate );
	renderer.render( scene, persp );
}

function start_page(){

	// whenever a resource is loaded, it requests to start the rendering.
	// When this function gets the request, it checks if all resources are loaded.
	// If all are loaded, start render, else just return and do nothing.
	var ready = true;
	Object.keys(resources_list).forEach((loaded) => {
		if (resources_list[loaded] == false){
			ready = false;
			return;
		}
	})
	if (!ready){return;}
	console.log("resources ready, building scene")

	// all finished.
	const earth_mat = new THREE.MeshStandardMaterial({
		map: earth_diffuse_tex, roughnessMap: earth_roughness_tex,
		//needsUpdate: true
	})
	
	planet = new THREE.Mesh(planet_mesh, earth_mat);
	scene.add(planet);
	planet.rotation.x = 0.8;

	const atmo_sphere_subdivision = 64;

	const atmo_mesh = new THREE.SphereGeometry(6.478, atmo_sphere_subdivision, Math.ceil(atmo_sphere_subdivision/2));
	const atmo_mat = new THREE.MeshPhysicalMaterial({
		color: 0x888890, opacity: 0.5, transparent: true
	})

	atmo_mat_custom = new THREE.ShaderMaterial({
		fragmentShader: atmo_shader_frag, vertexShader: atmo_shader_vert, transparent: true, wireframe: false,
		uniforms: {
			obj_position: {value: new THREE.Vector3(0.0,0.0,0.0)}
		}
	})
	atmo = new THREE.Mesh(atmo_mesh, atmo_mat_custom)
	scene.add(atmo)

	console.log("done")
	animate();
}

//start_page();