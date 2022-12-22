in vec4 vpos;
in mat4 modelMatrix;
in vec3 frag_position; // fragment world-space position
uniform vec3 obj_position;
uniform vec3 sun_position;
uniform float planet_radius;
const float gravitational_acceleration = 9.8e-6; // Mm/s2
const float GAS_CONSTANT = 8.314e-6; // N*Mm/(mol*K)

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



void main(){
	// units: 1 = 1Mm, kg, s, K.

	cameraPosition;

	vec3 world_frag_position = frag_position.xyz + obj_position.xyz;

	float frag_rad = length(frag_position.xyz);

	vec3 cam_to_frag = world_frag_position - cameraPosition;
	vec3 cam_to_obj = obj_position - cameraPosition;
	float target_direction = dot(normalize(cam_to_frag), normalize(cam_to_obj));


	// computed variables
	float distance_to_obj = length(cam_to_obj);
	// PLACEHOLDER variables
	float sea_level_density = 0.5;
	float sea_level_temperature = 300.0;
	float planet_mass = 600.0;

	float opacity = sea_level_density * pow(2.7182818284,
		(
			( - (gravitational_acceleration * planet_mass) / (GAS_CONSTANT * sea_level_temperature) ) *
			(sqrt(pow(distance_to_obj, 2.0) * (1.0 - pow(target_direction, 2.0))) - planet_radius)
		)
	);

	//gl_FragColor = vec4(frag_position.x/planet_radius, frag_position.y/planet_radius, frag_position.z/(planet_radius * 3.0), 0.9);
	//gl_FragColor = vec4((frag_position.xyz/10.0) + 0.5 + obj_position.xyz, 0.5);
	gl_FragColor = vec4(1.0, 1.0, 1.0, pow(target_direction, 3.0)/3.0);
}