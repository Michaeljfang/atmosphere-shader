const gravitational_acceleration = 9.8e-6;
const gravitational_constant = 6.6743e-23;
const speed_of_light = 299.79;

function gas_particle_speed(temperature, molar_mass){
	// get root mean squared speed of gas
	// temperature: Kelvin,
	// molar_mass: kilograms per mole.
	if (temperature <= 0.0 || molar_mass <= 0.0){
		return -1.0;
	}
	return sqrt((3 * GAS_CONSTANT * temperature) / molar_mass) / 1_000_000;
}

function schwarzchild_radius(planet_mass){
	// limit radius slider. no black holes
	// mass is in 10^20kg, distance in 10^6 meters (million meters),
	// returns in 10^6 meters (million meters).
	return 10e14 * (2 * gravitational_constant * planet_mass) / Math.pow(speed_of_light, 2);

}
function schwarzchild_mass(planet_radius){
	//limit planet mass slider. no black holes
	return planet_radius * Math.pow(speed_of_light, 2) / (10e14 * 2 * gravitational_constant);
}



function planet_mass(planet_radius, planet_density){
	return 4/3 * Math.PI * Math.pow(planet_radius, 3) * planet_density;
}

function oops_all_exosphere(planet_radius, planet_density, temperature, molar_mass){
	var gas_speed = gas_particle_speed(temperature, molar_mass);
	var escape_velocity = 2 * gravitational_acceleration * planet_mass(planet_radius, planet_density) / pow(speed_of_light, 2);
	if (gas_speed >= escape_velocity){return true;}
	else {return false;}
}

export function temperature_to_wavelength(temperature){
	// returns wavelength in nanometers.
	if(temperature <= 0){console.error("temperature_to_wavelength(): temperature is in Kelvin, cannot be negative"); return null;}
	return 2898000/temperature;
}

export function wavelength_to_rgb(wavelength, hex=true){
	// returns rgb value.
	var hundred_nm = wavelength / 100;
	var red = Math.exp(-4 * Math.pow(hundred_nm - 6.1, 2)) - 0.1 * Math.exp(-5 * Math.pow(hundred_nm - 5, 2)) + 0.1 * Math.exp(-4 * Math.pow(hundred_nm - 4.4, 2));
	var green = Math.exp(-6 * Math.pow(hundred_nm - 5.4, 2)) - 0.05 * Math.exp(-7 * Math.pow(hundred_nm - 4.4, 2)) - 0.02 * Math.exp(-10 * Math.pow(hundred_nm - 6.3, 2));
	var blue = Math.exp(-6 * Math.pow(hundred_nm - 4.5, 2)) - 0.02 * Math.exp(-10 * Math.pow(hundred_nm - 5.5, 2));
	if (red<0){green = Math.min(1, green - red); red = 0;}
	if (green<0){red = Math.min(1, red - green); green = 0;}
	if (blue <0){green = Math.min(1, green - blue/2); red = Math.min(1, red - blue/2); blue = 0;}
	var color_sum = red + green + blue;
	var multiplier = Math.pow(2, -0.1*Math.pow(hundred_nm - 5.35, 8));
	if(!hex){return [red/color_sum, green/color_sum, blue/color_sum];}
	else{var c = [
			Number(parseInt(multiplier * (red/color_sum) * 255)).toString(16),
			Number(parseInt(multiplier * (green/color_sum) * 255)).toString(16),
			Number(parseInt(multiplier * (blue/color_sum) * 255)).toString(16)
		];
		return "#" + (c[0].length == 1 ? "0" : "") + c[0] + (c[1].length == 1 ? "0" : "") + c[1] + (c[2].length == 1 ? "0" : "") + c[2];
	}
}