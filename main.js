import * as physics_utils from "./physics_utils.js";

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.module.js';

import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.149.0/examples/jsm/controls/OrbitControls.js";


const scene = new THREE.Scene();
const persp = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.001, 2000);
// FOV, aspect ratio, near clip, far clip
var renderer;

try {
	renderer = new THREE.WebGLRenderer({
		canvas: document.querySelector('#bg'),
		//antialiasing:true
	});
} catch (e){
	document.getElementById("main_page").innerHTML = "";
	document.getElementById("loading_screen").innerHTML =
		'<div><div style="z-index: 20;font-size:30px;position:relative;">Couldn\'t access graphics device</div><d'+
		'iv style="z-index: 20;font-size:17px;">Please check your system graphics, browser settings and reload this page.<br>' +
		'Some script/fingerprinting blockers can block access to webGL.<br>' +
		'If problem persists, raise an issue at www.github.com/michaeljfang/atmosphere-shader</div></div>';
	throw new Error("Couldn't load three.js scene. See text in page.");
}
THREE.Cache.enabled = true;

const controls = new OrbitControls(persp, document.querySelector('#bg'));

const file_loader = new THREE.FileLoader();
file_loader.setResponseType("text");

var planet;
var atmo;
var atmo_mat_custom;
var input_delay;

var y_rotation_speed = 0.005;

const parameters = {
	'planet_radius': 6.378,
	'atmo_radius': 6.478,
	'planet_mass': 60000,

	'view_path_samples': 100.0,
	'light_path_samples': 5.0,
	'temperature': 300,
	'surface_density': 10,

	'red_scatter_base': 12,
	'opacity_curve_base': 40,

	'atmo_color_R': 0.78,
	'atmo_color_G': 0.85,
	'atmo_color_B': 1,
	
	'star_temp': 5400,
	'star_rgb': new THREE.Vector3(1,1,1),
}

function polar_to_cartesian(radius, longitude, latitude){
	return [
		radius * Math.cos(deg_to_rad(latitude)) * Math.sin(deg_to_rad(longitude)),
		radius * Math.sin(deg_to_rad(latitude)),
		radius * Math.cos(deg_to_rad(latitude)) * Math.cos(deg_to_rad(longitude))
	];
}

const deg_to_rad = (deg) => (Math.PI/180) * deg;

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild( renderer.domElement );
persp.position.set(0,11,11);

// loop set up and validate input fields.
// sliders
const slider_controls = {
	"view_path_samples": null, "light_path_samples": null, "temperature": null, "surface_density": null, "red_scatter_base": null, "opacity_curve_base": null,
	"atmo_color_R": null, "atmo_color_G": null, "atmo_color_B": null,
	"star_temp": null, 
};

Object.keys(slider_controls).forEach((item_name) => {
	slider_controls[item_name] = document.getElementById(item_name);
	slider_controls[item_name].oninput = () => {
		parameters[item_name] = slider_controls[item_name].value;
		document.getElementById(item_name+"_display").textContent = String(slider_controls[item_name].value);
	}
});


slider_controls["view_path_samples"].addEventListener("input", () => {
	if(slider_controls["view_path_samples"].value < 50)document.getElementById("view_path_samples_advice").textContent = "inaccurate";
	else if(slider_controls["view_path_samples"].value < 200)document.getElementById("view_path_samples_advice").textContent = "okay";
	else if(slider_controls["view_path_samples"].value < 750)document.getElementById("view_path_samples_advice").textContent = "decent";
	else if(slider_controls["view_path_samples"].value < 1000)document.getElementById("view_path_samples_advice").textContent = "GPU on fire";
});

slider_controls["temperature"].addEventListener("input", () => {
	if(slider_controls["temperature"].value < 273)document.getElementById("temperature_advice").textContent = "freezing";
	else if(slider_controls["temperature"].value < 310)document.getElementById("temperature_advice").textContent = "temperate";
	else if(slider_controls["temperature"].value < 323)document.getElementById("temperature_advice").textContent = "hot";
	else if(slider_controls["temperature"].value <= 700 && slider_controls["temperature"].value > 550)document.getElementById("temperature_advice").textContent = "Mercury surface";
	else if(slider_controls["temperature"].value < 770 && slider_controls["temperature"].value > 700)document.getElementById("temperature_advice").textContent = "Venus surface";
	else document.getElementById("temperature_advice").textContent = "burning";
});

slider_controls["star_temp"].addEventListener("input", () => {
	var rgb_list = physics_utils.temperature_to_rgb(parameters['star_temp']);
	var rgb_hex = physics_utils.rgb_to_hex(rgb_list, 255);
	document.getElementById("star_temp_display_block").innerHTML = "█".fontcolor(rgb_hex);
	parameters['star_rgb'] = new THREE.Vector3(rgb_list[0], rgb_list[1], rgb_list[2]);
	scene.remove(dir_light);
	dir_light.dispose();
	dir_light = new THREE.DirectionalLight(rgb_hex,  1);
	dir_light.position.set()
	var light_position = polar_to_cartesian(light_distance, light_direction[0], light_direction[1]);
	dir_light.position.set(light_position[0], light_position[1], light_position[2]);
	scene.add(dir_light);
})


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
			atmo_mesh.dispose();
			parameters['atmo_radius'] = value + 1;
			atmo_mesh = new THREE.SphereGeometry(parameters['atmo_radius'], atmo_sphere_subdivision, Math.ceil(atmo_sphere_subdivision/2));
			scene.remove(atmo);
			//atmo = new THREE.Mesh(atmo_mesh, new THREE.MeshBasicMaterial());
			atmo = new THREE.Mesh(atmo_mesh, atmo_mat_custom);
			scene.add(atmo);
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
var dir_light = new THREE.DirectionalLight(0xffffff,  1);

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

const resources = {
	"planet_tex": {"loader": texture_loader,"source": "./tex/earth_eq.png", "item": null},
	"planet_ref": {"loader": texture_loader,"source": "./tex/earth_land_tiny.jpg", "item": null},
	"atmo_frag": {"loader": file_loader,"source": "./atmo_shader_frag.glsl", "item": null},
	"atmo_vert": {"loader": file_loader,"source": "./atmo_shader_vert.glsl", "item": null},
	"planet_frag": {"loader": file_loader,"source": "./planet_shader_frag.glsl", "item": null},
	"planet_vert": {"loader": file_loader,"source": "./planet_shader_vert.glsl", "item": null},
}
var resources_names = Object.keys(resources);
var load_counter = 0;

function sequential_loading(){
	var name = resources_names[load_counter]
	console.log(name);
	resources[name]["loader"].load(resources[name]["source"], (response) => {
		resources[name]["item"] = response;
		load_counter++;
		if (load_counter >= resources_names.length) start_page();
		else {
			sequential_loading();
		}
	})
}


const atmo_sphere_subdivision = 128;
var atmo_mesh = new THREE.SphereGeometry(parameters['atmo_radius'], atmo_sphere_subdivision, Math.ceil(atmo_sphere_subdivision/2));
const atmo_mat = new THREE.MeshPhysicalMaterial({
	color: 0x888890, opacity: 0.5, transparent: true
})

function light_rotation(key_code){
	
	if (key_code == 37){light_direction[0] += 5;}
	else if (key_code == 39){light_direction[0] -= 5;}
	else if (key_code == 38){light_direction[1] += 5;}
	else if (key_code == 40){light_direction[1] -= 5;}

	// light_direction: [azimuth (0-360), altitude(+-90)]
	if (light_direction[0] > 360){light_direction[0] -= 360;}
	else if (light_direction[0] < 0){light_direction[0] += 360;}
	light_direction[1] = Math.min(Math.max(light_direction[1], -90), 90);

	var light_position = polar_to_cartesian(light_distance, light_direction[0], light_direction[1]);
	dir_light.position.set(light_position[0], light_position[1], light_position[2]);
}


document.addEventListener('keydown', event_handler, false);
function event_handler(key) {
	if(document.activeElement !== document.body){return;}
	// console.log(key);
	// camera/planet position
	// if (188 === key.keyCode && persp.position.z < 400){
	// 	if (key.shiftKey){planet.position.z *= 1.05;}
	// 	else {persp.position.z *= 1.05;}
	// } else if (190 === key.keyCode && persp.position.z > 0.4 + parameters['planet_radius']){
	// 	if (key.shiftKey){planet.position.z /= 1.05;}
	// 	else {persp.position.z /= 1.05;}
	// } else if (65 === key.keyCode && persp.position.x > -2) {
	// 	if (key.shiftKey){planet.position.x -= 0.1;}
	// 	else {persp.position.x -= 0.1;}
	// } else if (68 === key.keyCode && persp.position.x < 2) {
	// 	if (key.shiftKey){planet.position.x += 0.1;}
	// 	else {persp.position.x += 0.1;}
	// } else if (83 === key.keyCode && persp.position.y > -1) {
	// 	if (key.shiftKey){planet.position.y -= 0.1;}
	// 	else {persp.position.y -= 0.1;}
	// } else if (87 === key.keyCode && persp.position.y < 1) {
	// 	if (key.shiftKey){planet.position.y += 0.1;}
	// 	else {persp.position.y += 0.1;}
	// }
	
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
		
	// else if (key.keyCode == 219){
	// 	atmo_mat_custom.side = THREE.BackSide;
	// } else if (key.keyCode == 221){
	// 	atmo_mat_custom.side = THREE.FrontSide;
	// } else if (key.keyCode == 220){
	// 	atmo_mat_custom.side = THREE.DoubleSide;
	// }
	else if (key.keyCode == 12 || key.keyCode == 101){
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


	else {
		console.log(key);
	}
}

// var time = 100000;
// var frame_time = 1000;
var prev_frame = new Date();
var cam_to_atmo;
function animate() {
	// frame_time = Date.now() - time;
	// time = Date.now();
	// document.getElementById("fps").textContent = frame_time == 0 ? document.getElementById("fps").textContent : Number.parseInt(frame_time);

	var current_frame = new Date();
	var frame_time = (current_frame - prev_frame) / 1000;
	prev_frame = current_frame;
	controls.update();

	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	persp.aspect = window.innerWidth/window.innerHeight;
	persp.updateProjectionMatrix();
	// mesh.rotation.x += 0.007;

	// check if cam is in atmosphere and switch render sides.
	cam_to_atmo = new THREE.Vector3(persp.position.x, persp.position.y, persp.position.z).sub(new THREE.Vector3(atmo.position.x, atmo.position.y, atmo.position.z)).length();
	if (cam_to_atmo > parameters['atmo_radius']){
		atmo_mat_custom.side = THREE.FrontSide;
	} else {
		atmo_mat_custom.side = THREE.BackSide;
	}
	/////////////////////////////////////
	planet.rotation.y += y_rotation_speed * frame_time * 60;

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
	atmo_mat_custom.uniforms.surface_density.value = parameters['surface_density'];
	atmo_mat_custom.uniforms.red_scatter_base.value = parameters['red_scatter_base'];
	atmo_mat_custom.uniforms.opacity_curve_base.value = parameters['opacity_curve_base'];
	atmo_mat_custom.uniforms.atmo_colors.value = new THREE.Vector3(parameters['atmo_color_R'], parameters['atmo_color_G'], parameters['atmo_color_B']);
	atmo_mat_custom.uniforms.star_rgb.value = parameters['star_rgb'];

	requestAnimationFrame(animate);
	renderer.render(scene, persp);
}

function start_page(){

	// all finished.
	const earth_mat = new THREE.MeshStandardMaterial({
		map: resources["planet_tex"]["item"], roughnessMap: resources["planet_ref"]["item"]
		//needsUpdate: true
	});
	
	planet = new THREE.Mesh(planet_mesh, earth_mat);
	scene.add(planet);
	planet.scale.set(parameters['planet_radius'], parameters['planet_radius'], parameters['planet_radius']);
	//planet.rotation.x = 0.8;

	atmo_mat_custom = new THREE.ShaderMaterial({
		fragmentShader: resources["atmo_frag"]["item"], vertexShader: resources["atmo_vert"]["item"], transparent: true, wireframe: false,
		uniforms: {
			obj_position: {value: new THREE.Vector3(0.0,0.0,0.0)},
			sun_position: {value: new THREE.Vector3(dir_light.position.xyz)},
			planet_radius: {value: parameters['planet_radius']},
			atmo_radius: {value: parameters['atmo_radius']},
			view_path_samples: {value: parameters['view_path_samples']},
			light_path_samples: {value: parameters['light_path_samples']},
			planet_mass: {value: parameters['planet_mass']},
			temperature: {value: parameters['temperature']},
			surface_density: {value: parameters['surface_density']},
			red_scatter_base: {value: parameters['red_scatter_base']},
			opacity_curve_base: {value: parameters['opacity_curve_base']},

			atmo_colors: {value: new THREE.Vector3(parameters['atmo_color_R'], parameters['atmo_color_G'], parameters['atmo_color_B'])},
			star_rgb: {value: parameters['star_rgb']},
		}
	});
	atmo = new THREE.Mesh(atmo_mesh, atmo_mat_custom);
	scene.add(atmo);

	document.body.removeChild(document.getElementById("loading_screen"));
	animate();
}


sequential_loading();