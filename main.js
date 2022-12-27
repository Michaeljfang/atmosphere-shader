const scene = new THREE.Scene();
const persp = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 2000);
// FOV, aspect ratio, near clip, far clip
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector('#bg'),
	//antialiasing:true
});
THREE.Cache.enabled = true;

const file_loader = new THREE.FileLoader();
file_loader.setResponseType("text");

var planet;
var atmo;
var atmo_mat_custom;
var input_delay;

var y_rotation_speed = 0.005;

const resources_list = {
	"planet_tex": false,
	"planet_ref": false,
	//"planet_bmp": false,
	"atmo_frag": false,
	"atmo_vert": false,
}

const parameters = {
	'planet_radius': 6.378,
	'atmo_radius': 6.478,
	'planet_mass': 60000,

	'view_path_samples': 20.0,
	'light_path_samples': 20.0,
	'temperature': 300,
}


const deg_to_rad = (deg) => (Math.PI/180) * deg;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );
persp.position.set(0,0,11);

// loop set up and validate input fields.
// sliders
const slider_controls = ["view_path_samples", "light_path_samples", "temperature"];
var slider_controls_html = [null, null, null];

slider_controls.forEach((item, i) => {
	slider_controls_html[i] = document.getElementById(item);
	slider_controls_html[i].oninput = () => {
		parameters[item] = slider_controls_html[i].value;
		document.getElementById(item+"_display").textContent = String(slider_controls_html[i].value);
	}
})

slider_controls_html[0].addEventListener("input", () => {
	if(slider_controls_html[0].value < 50)document.getElementById("view_path_samples_advice").textContent = "inaccurate";
	else if(slider_controls_html[0].value < 200)document.getElementById("view_path_samples_advice").textContent = "okay";
	else if(slider_controls_html[0].value < 1000)document.getElementById("view_path_samples_advice").textContent = "decent";
});

slider_controls_html[2].addEventListener("input", () => {
	if(slider_controls_html[2].value < 273)document.getElementById("temperature_advice").textContent = "freezing";
	else if(slider_controls_html[2].value < 310)document.getElementById("temperature_advice").textContent = "temperate";
	else if(slider_controls_html[2].value < 323)document.getElementById("temperature_advice").textContent = "hot";
	else if(slider_controls_html[2].value <= 700 && slider_controls_html[2].value > 550)document.getElementById("temperature_advice").textContent = "Mercury surface";
	else if(slider_controls_html[2].value < 770 && slider_controls_html[2].value > 700)document.getElementById("temperature_advice").textContent = "Venus surface";
	else document.getElementById("temperature_advice").textContent = "burning";
});

// number inputs
const number_controls = {
	"planet_radius": null,
	"planet_mass": null
};
Object.keys(number_controls).forEach((item_name) => {
	number_controls[item_name] = document.getElementById(item_name);
})
const number_controls_multiplier = {
	"planet_radius": 0.001,
	"planet_mass": 1
}
function validate_number_inputs(input_name, value){
	// THIS WILL USE DISPLAYED VALUES,
	// aka value displayed on the UI.
	switch(input_name){
		case "planet_radius": return (value >= 100 && value <= 10000);
		case "planet_mass": return (value >= 100 && value <= 100000);
		default: return false;
	}
}
function respond_to_number_inputs(input_name, value){
	// THIS WILL USED SCALED VALUES,
	// aka the values saved to "parameters",
	// aka the value passed to the shaders
	switch(input_name){
		case "planet_radius":
			planet.scale.set(value, value, value);
			return;
		default:
			return;
	}
}

document.addEventListener("keyup", (e) => {
	// TODO perhaps check if focus is in list of input widgets?
	if(document.activeElement === document.body){return;}
	clearTimeout(input_delay);
	input_delay = setTimeout(() => {
		// make every key-up in the target area a trigger to check input parameters
		Object.keys(number_controls).forEach((item_name) => {
			var html_element = document.getElementById(item_name);
			if (validate_number_inputs(item_name, html_element.value)){
				var scaled_input_value = html_element.value * number_controls_multiplier[item_name];
				respond_to_number_inputs(item_name, scaled_input_value);
				document.getElementById(item_name).setCustomValidity("");
				parameters[item_name] = scaled_input_value;
				document.getElementById(item_name+"_display").textContent = String(html_element.value);
			} else {
				document.getElementById(item_name).setCustomValidity(item_name + " out of range");
			}
		})
	}, 500)
})

// DIRECTIONAL LIGHT

var light_direction = [45, 30];
var light_distance = 20;
const dir_light = new THREE.DirectionalLight( 0xffffff,  1);

dir_light.position.set(
	light_distance * Math.cos(deg_to_rad(light_direction[1])) * Math.sin(deg_to_rad(light_direction[0])),
	light_distance * Math.sin(deg_to_rad(light_direction[1])),
	light_distance * Math.cos(deg_to_rad(light_direction[1])) * Math.cos(deg_to_rad(light_direction[0]))
);
scene.add(dir_light);



const ambient = new THREE.AmbientLight(0x262636); // soft white light
scene.add(ambient);


// RESOURCES
var planet_mesh = new THREE.SphereGeometry(1, 128, 64);
const texture_loader = new THREE.TextureLoader();

var earth_diffuse_tex;
texture_loader.load('./tex/earth_eq.png', (response) => {
	earth_diffuse_tex = response; resources_list["planet_tex"] = true; start_page();
});
var earth_roughness_tex;
texture_loader.load('./tex/earth_land_tiny.jpg', (response) => {
	earth_roughness_tex = response; resources_list["planet_ref"] = true; start_page();
});

const atmo_sphere_subdivision = 128;
var atmo_scale = 6.478;
const atmo_mesh = new THREE.SphereGeometry(parameters['atmo_radius'], atmo_sphere_subdivision, Math.ceil(atmo_sphere_subdivision/2));
const atmo_mat = new THREE.MeshPhysicalMaterial({
	color: 0x888890, opacity: 0.5, transparent: true
})


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
	if(document.activeElement !== document.body){return;}
	// console.log(key);
	// camera controls
	if (188 === key.keyCode && persp.position.z < 400){
		persp.position.z *= 1.05;
	} else if (190 === key.keyCode && persp.position.z > 6.5){
		persp.position.z /= 1.05;
	} else if (65 === key.keyCode && persp.position.x > -2) {
		persp.position.x -= 0.1;
	} else if (68 === key.keyCode && persp.position.x < 2) {
		persp.position.x += 0.1;
	} else if (83 === key.keyCode && persp.position.y > -1) {
		persp.position.y -= 0.1;
	} else if (87 === key.keyCode && persp.position.y < 1) {
		persp.position.y += 0.1;
	}
	
	else if (key.keyCode == 173 && persp.fov < 175){
		persp.fov += 5;
	} else if (key.keyCode == 61 && persp.fov > 2){
		persp.fov -= 5;
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

	// debug planet show/hide
	else if (key.keyCode == 80) {
		planet.visible = !planet.visible;
	}
		
	else if (key.keyCode == 219){
		atmo_mat_custom.side = THREE.BackSide;
	} else if (key.keyCode == 221){
		atmo_mat_custom.side = THREE.FrontSide;
	} else if (key.keyCode == 220){
		atmo_mat_custom.side = THREE.DoubleSide;
	} else if (key.keyCode == 12 || key.keyCode == 101){
		atmo.position.set(0,0,0);
		atmo.rotation.set(0,0,0);
	}


	// light controls
	else if ([37, 38, 39, 40].includes(key.keyCode)) {
		light_rotation(key.keyCode);
	}

	// debug atmo rotation or translation
	else if (key.keyCode === 104){
		if (key.shiftKey){atmo.position.y += 0.5;;}
		else {atmo.rotation.y -= 0.1;}
	} else if (key.keyCode === 98){
		if (key.shiftKey){atmo.position.y -= 0.5;}
		else {atmo.rotation.y += 0.1;}
		
	} else if (key.keyCode == 102){
		if (key.shiftKey){atmo.position.x += 0.5;}
		else {atmo.rotation.x += 0.1;}
		
	} else if (key.keyCode == 100){
		if (key.shiftKey){atmo.position.x -= 0.5;}
		else {atmo.rotation.x -= 0.1;}
	} else if (key.keyCode == 105 && key.shiftKey){
		atmo.position.z -= 0.5;
	} else if (key.keyCode == 99 && key.shiftKey){
		atmo.position.z += 0.5;
	}

	// debug atmo scale
	else if (key.keyCode == 49 && atmo_scale < 10){
		atmo_scale -= 0.1;
		atmo.scale.set(atmo_scale, atmo_scale, atmo_scale);
		console.log(atmo_scale);
	} else if (key.keyCode == 50 && atmo_scale > 1){
		atmo_scale += 0.1;
		atmo.scale.set(atmo_scale, atmo_scale, atmo_scale);
		console.log(atmo_scale);
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
	atmo_mat_custom.uniforms.obj_position.value = new THREE.Vector3(
		atmo.position.x, atmo.position.y, atmo.position.z
	);
	atmo_mat_custom.uniforms.sun_position.value = new THREE.Vector3(
		dir_light.position.x, dir_light.position.y, dir_light.position.z
	);
	atmo_mat_custom.uniforms.planet_radius.value = parameters['planet_radius'];
	atmo_mat_custom.uniforms.atmo_radius.value = parameters['atmo_radius'];
	atmo_mat_custom.uniforms.view_path_samples.value = parameters['view_path_samples'];
	atmo_mat_custom.uniforms.light_path_samples.value = parameters['light_path_samples'];
	atmo_mat_custom.uniforms.planet_mass.value = parameters['planet_mass'];
	atmo_mat_custom.uniforms.temperature.value = parameters['temperature'];

	requestAnimationFrame(animate);
	renderer.render(scene, persp);
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
		map: earth_diffuse_tex, roughnessMap: earth_roughness_tex
		//needsUpdate: true
	})
	
	planet = new THREE.Mesh(planet_mesh, earth_mat);
	scene.add(planet);
	planet.scale.set(parameters['planet_radius'], parameters['planet_radius'], parameters['planet_radius']);
	planet.rotation.x = 0.8;

	atmo_mat_custom = new THREE.ShaderMaterial({
		fragmentShader: atmo_shader_frag, vertexShader: atmo_shader_vert, transparent: true, wireframe: false,
		uniforms: {
			obj_position: {value: new THREE.Vector3(0.0,0.0,0.0)},
			sun_position: {value: new THREE.Vector3(dir_light.position.xyz)},
			planet_radius: {value: parameters['planet_radius']},
			atmo_radius: {value: parameters['atmo_radius']},
			view_path_samples: {value: parameters['view_path_samples']},
			light_path_samples: {value: parameters['light_path_samples']},
			planet_mass: {value: parameters['planet_mass']},
			temperature: {value: parameters['temperature']}
		}
	})
	atmo = new THREE.Mesh(atmo_mesh, atmo_mat_custom)
	scene.add(atmo)

	console.log("done")
	animate();
}


