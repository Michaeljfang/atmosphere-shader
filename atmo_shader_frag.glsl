in vec4 vpos;

// = object.matrixWorld
in mat4 modelMatrix;
in vec3 frag_position; // fragment world-space position
uniform vec3 obj_position;
uniform vec3 sun_position;
uniform float planet_radius;


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

//// NEED: view direction, light direction, object location, object size?

void main(){
	// vec4 fragDirection = vec4(screenSpace.xy * fov, 1.0, 1.0) * inverse(projectionViewMatrix);
	// fragDirection.xyz /= fragDirection.w;
	// modelMatrix;....
	// gl_FragCoord;
	// gl_FrontFacing;
	// gl_PointCoord;

	cameraPosition;

	vec3 world_frag_position = frag_position.xyz + obj_position.xyz;

	float frag_rad = length(frag_position.xyz);

	vec3 cam_to_frag = world_frag_position - cameraPosition;
	vec3 cam_to_obj = obj_position - cameraPosition;
	float target_direction = dot(normalize(cam_to_frag), normalize(cam_to_obj));

	//gl_FragColor = vec4(frag_position.x/planet_radius, frag_position.y/planet_radius, frag_position.z/(planet_radius * 3.0), 0.9);
	//gl_FragColor = vec4((frag_position.xyz/10.0) + 0.5 + obj_position.xyz, 0.5);
	gl_FragColor = vec4(1.0, 1.0, 1.0, pow(target_direction, 3.0)/3.0);
}