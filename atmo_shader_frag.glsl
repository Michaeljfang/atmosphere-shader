in vec4 vpos;
in mat4 modelMatrix;
in vec3 frag_position; // fragment world-space position
uniform vec3 obj_position;
uniform vec3 sun_position;
uniform float planet_radius;
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


float density_curve(float queried_point, float ray_path_altitude,
		float sea_level_density, float sea_level_temperature,
		float planet_mass, float planet_radius,
		float gravitational_acceleration, float gas_constant){
	// gets density of atmosphere at some point along the view ray.
	// use queried_point and ray_path_altitude to specify where the point is.
	return sea_level_density * exp(
		((-gravitational_acceleration * planet_mass) / (gas_constant * sea_level_temperature)) * // -gM/RT
		(sqrt(pow(ray_path_altitude, 2.0) + pow(queried_point, 2.0)) - planet_radius) // sqrt(height - x^2) - h0
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

	// closest distance between view path of frag and obj
	// two ways to get this:
	//float frag_path_altitude = distance_to_obj * sqrt(1.0 - pow(frag_obj_angle_cos, 2.0));
	float frag_path_altitude = length(cam_to_obj - vec_to_closest_point);
	
	float atmo_top_distance = length(cam_to_frag); // distance to frag, or distance to top of atmosphere at frag.

	// PLACEHOLDER variables
	float sea_level_density = 10.0;
	float sea_level_temperature = 300.0;
	float planet_mass = 60000.0;
	float samples = 30.0;

	// compute where starting and ending points are
	float atmo_edge_x = sqrt(pow(atmo_radius, 2.0) - pow(frag_path_altitude, 2.0)); // closer to the camera - density calc "start"
	float planet_edge_x = sqrt(pow(planet_radius-0.005, 2.0) - pow(frag_path_altitude, 2.0)); // farther to the camera - density calc "end"

	float far_side_x = max(planet_edge_x, -atmo_edge_x);
	float near_side_x = atmo_edge_x;
	float geometric_length = abs(near_side_x - far_side_x);

	// integration for density
	float accumulated_density = 0.0;
	float step_x_size = (geometric_length / samples);
	for (float i = 0.0; i <= samples; i+=1.0){
		float step_x = far_side_x + i * step_x_size; 
		accumulated_density = accumulated_density + step_x_size * density_curve(step_x, frag_path_altitude, sea_level_density, sea_level_temperature, planet_mass, planet_radius, gravitational_acceleration, GAS_CONSTANT);
	}
	// compute opacity. supposedly it's an exponential relationship with density
	float density_to_opacity_curve_power_base = 10.0;
	float opacity_from_density = 1.0 - pow(density_to_opacity_curve_power_base, -accumulated_density/8.0);

	//float planet_radius_cos = sqrt(pow(distance_to_obj, 2.0) - pow(planet_radius, 2.0)) / distance_to_obj;

	//gl_FragColor = vec4(1.0, 1.0, 1.0, 0.4*(1.5-(1.0-frag_obj_angle_cos)/(1.0-planet_radius_cos)));
	gl_FragColor = vec4(0.82, 0.85, 1.0, opacity_from_density);
	//gl_FragColor = vec4(0.82, 0.85, 1.0, density_curve(6.390, frag_path_altitude, sea_level_density, sea_level_temperature, planet_mass, planet_radius, gravitational_acceleration, GAS_CONSTANT));
}