const gravitational_acceleration = 9.8e-6;
const gravitational_constant = 6.6743e-23;
const speed_of_light = 299.79;

function gas_particle_speed(temperature, molar_mass) {
	// get root mean squared speed of gas
	// temperature: Kelvin,
	// molar_mass: kilograms per mole.
	if (temperature <= 0.0 || molar_mass <= 0.0) {
		return -1.0;
	}
	return sqrt((3 * GAS_CONSTANT * temperature) / molar_mass) / 1_000_000;
}

function schwarzchild_radius(planet_mass) {
	// limit radius slider. no black holes
	// mass is in 10^20kg, distance in 10^6 meters (million meters),
	// returns in 10^6 meters (million meters).
	return 10e14 * (2 * gravitational_constant * planet_mass) / Math.pow(speed_of_light, 2);

}
function schwarzchild_mass(planet_radius) {
	//limit planet mass slider. no black holes
	return planet_radius * Math.pow(speed_of_light, 2) / (10e14 * 2 * gravitational_constant);
}



function planet_mass(planet_radius, planet_density) {
	return 4 / 3 * Math.PI * Math.pow(planet_radius, 3) * planet_density;
}

function oops_all_exosphere(planet_radius, planet_density, temperature, molar_mass) {
	var gas_speed = gas_particle_speed(temperature, molar_mass);
	var escape_velocity = 2 * gravitational_acceleration * planet_mass(planet_radius, planet_density) / pow(speed_of_light, 2);
	if (gas_speed >= escape_velocity) { return true; }
	else { return false; }
}

export function temperature_to_rgb(t) {
	// t: temperature in Kelvin.
	if (t <= 0) { return null; }
	t /= 1000;
	var red = Math.min(1, Math.max(0, (-3 / 46) * t + 1.43));
	//var green = Math.max(0, Math.min(0.5 * Math.pow(t + 0.1, 2 / 5) - 0.05, 1, Math.max(0, (-2.2 / 46) * t + 1.32)));
	var green = Math.max(0, Math.min(0.5 * Math.pow(t - 0.4, 1/2) - 0.05, 1, Math.max(0, (-2.2 / 46) * t + 1.32)));
	var blue = Math.max(0, Math.min(1, Math.pow(t - 0.4, 1 / 3) - 0.85));
	return [red, green, blue];
}

export function rgb_to_hex(rgb_list){
	var c = [
		Number(parseInt(rgb_list[0] * 255)).toString(16),
		Number(parseInt(rgb_list[1] * 255)).toString(16),
		Number(parseInt(rgb_list[2] * 255)).toString(16)
	];
	return "#" + (c[0].length == 1 ? "0" : "") + c[0] + (c[1].length == 1 ? "0" : "") + c[1] + (c[2].length == 1 ? "0" : "") + c[2];
}
