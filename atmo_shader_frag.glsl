in vec4 vpos;
in mat4 modelMatrix;
in vec3 frag_position; // fragment world-space position
uniform vec3 obj_position;
uniform vec3 sun_position;
uniform float planet_radius;
uniform float planet_mass;
uniform float temperature; // temperature of atmosphere (assuming uniform temperature)
uniform float surface_density; // density of atmosphere at the planet surface
uniform float red_scatter_base; // exponential base to calculate remaining unscattered red light after some distance

uniform vec3 star_colors;


uniform float atmo_radius;
const float gravitational_acceleration = 9.8e-6; // Mm/s2
const float GAS_CONSTANT = 8.314e-6; // N*Mm/(mol*K)

uniform float view_path_samples;
uniform float light_path_samples;

// // = camera.matrixWorldInverse * object.matrixWorld
// in mat4 modelViewMatrix;

// // = camera.projectionMatrix
// in mat4 projectionMatrix;

// // = camera.matrixWorldInverse
// in mat4 viewMatrix;

// // = inverse transpose of modelViewMatrix
// in mat3 normalMatrix;

// // = camera position in world space
// in vec3 cameraPosition;


vec3 project(vec3 from, vec3 onto){
	return onto * (dot(from, onto) / dot(onto, onto));
}


float density_curve(float queried_altitude,
		float surface_density, float temperature,
		float planet_mass, float planet_radius,
		float gravitational_acceleration, float gas_constant
		){
	// gets density of atmosphere at some point along the view ray.
	// use queried_point and ray_path_altitude to specify where the point is.
	return surface_density * exp(
		((-gravitational_acceleration * planet_mass) / (gas_constant * temperature)) * // -gM/RT
		(queried_altitude - planet_radius) // sqrt(height - x^2) - h0
	);
}


void main(){
	// units: 1 = 1Mm, kg, s, K.

	cameraPosition;

	vec3 world_frag_position = frag_position.xyz + obj_position.xyz;

	vec3 cam_to_frag = world_frag_position - cameraPosition;
	vec3 cam_to_obj = obj_position - cameraPosition;
	float frag_obj_angle_cos = dot(normalize(cam_to_frag), normalize(cam_to_obj));


	// computed variables
	float distance_to_obj = length(cam_to_obj);
	vec3 vec_to_closest_point = project(cam_to_obj, cam_to_frag);
	vec3 obj_to_closest_point = vec_to_closest_point - cam_to_obj;

	// closest distance between view path of frag and obj
	// two ways to get this:
	//float frag_path_altitude = distance_to_obj * sqrt(1.0 - pow(frag_obj_angle_cos, 2.0));
	float frag_path_altitude = length(obj_to_closest_point);

	float atmo_top_distance = length(cam_to_frag); // distance to frag, or distance to top of atmosphere at frag.

	// OPACITY
	// compute where starting and ending points are for integration
	float atmo_edge_x = sqrt(pow(atmo_radius, 2.0) - pow(frag_path_altitude, 2.0)); // always positive, aka the closer side
	float planet_edge_x = sqrt(pow(planet_radius-0.005, 2.0) - pow(frag_path_altitude, 2.0));
	float far_side_x = max(planet_edge_x, -atmo_edge_x); // farther to the camera - density calc "end"
	float near_side_x = atmo_edge_x; // closer to the camera - density calc "start"
	float geometric_length = abs(near_side_x - far_side_x);

	// COLOR
	vec3 light_direction = -normalize(sun_position);

	float total_accumulated_mass_along_the_light_paths = 0.0;

	// numerical integration for density. no closed form solution :(
	float accumulated_mass = 0.0;
	float step_x_size = (geometric_length / view_path_samples);
	for (float i = 0.0; i <= view_path_samples; i+=1.0){
		// OPACITY
		float step_x = far_side_x + i * step_x_size;
		float queried_altitude = sqrt(pow(frag_path_altitude, 2.0) + pow(step_x, 2.0));
		// mass at the query point multiplied by step size
		float this_mass = step_x_size * density_curve(queried_altitude, surface_density, temperature, planet_mass, planet_radius, gravitational_acceleration, GAS_CONSTANT);
		accumulated_mass += this_mass;


		// COLOR
		// obj_to_x: x is the sample point along the view path.
		vec3 obj_to_x = obj_to_closest_point + step_x * normalize(-cam_to_frag);
		// light_path_x_vec is a vector parallel to the light path,
		// given the queried x point along the view path and the light path that intersects that point,
		// get the vector that goes from the light path's closest approach to the planet to that x point.
		// this vector can give one end of the integration along the light path.
		vec3 light_path_x_vec = project(obj_to_x, (light_direction)) + 1e-6; // add small number to avoid getting a zero vector
		float light_path_x_on_view_path = length(light_path_x_vec) * dot(-light_direction, normalize(light_path_x_vec));
		// this gets the other end of the integration along the light path.
		vec3 obj_to_light_path_closest_approach = obj_to_x - light_path_x_vec;
		float light_path_altitude = length(obj_to_light_path_closest_approach);
		float light_path_x_on_atmo_edge = sqrt(pow(atmo_radius, 2.0) - pow(light_path_altitude, 2.0));
		
		// finally integrate over the light path from atmo edge to the x point.
		float accumulated_mass_along_light_path = 0.0;
		float step_x_size_light = ((light_path_x_on_atmo_edge - light_path_x_on_view_path) / light_path_samples);

		for (float light_i = 0.0; light_i <= light_path_samples; light_i+= 1.0){
			float step_x_light = light_path_x_on_view_path + light_i * step_x_size_light;
			float queried_altitude_light = sqrt(pow(light_path_altitude, 2.0) + pow(step_x_light, 2.0));
			float this_mass_light = step_x_size_light * density_curve(queried_altitude_light, surface_density, temperature, planet_mass, planet_radius, gravitational_acceleration, GAS_CONSTANT);
			accumulated_mass_along_light_path += this_mass_light;
		}
		total_accumulated_mass_along_the_light_paths += this_mass * accumulated_mass_along_light_path;
	
	}

	// compute opacity. supposedly it's an exponential relationship with density
	float mass_to_opacity_curve_power_base = 10.0;
	float opacity_from_mass = 1.0 - pow(mass_to_opacity_curve_power_base, -accumulated_mass/8.0);

	// compute colors.
	float light_traveled_mass = total_accumulated_mass_along_the_light_paths / (geometric_length * 10.0);
	vec3 atmospheric_color = vec3(0.70, 0.74, 1.0);
	vec3 remaining_colors = star_colors * atmospheric_color * vec3(
		pow(red_scatter_base, -light_traveled_mass),
		pow(red_scatter_base * pow(700.0/550.0, 4.0), -light_traveled_mass),
		pow(red_scatter_base * pow(700.0/470.0, 4.0), -light_traveled_mass)
	);
	//float planet_radius_cos = sqrt(pow(distance_to_obj, 2.0) - pow(planet_radius, 2.0)) / distance_to_obj;
	gl_FragColor = vec4(0.82, 0.85, 1.0, opacity_from_mass);
	gl_FragColor = vec4(remaining_colors, opacity_from_mass);
}