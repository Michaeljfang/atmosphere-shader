
out vec4 vpos;
out vec3 frag_position;
uniform vec3 obj_position;
uniform vec3 sun_position;
uniform float planet_radius;
uniform float atmo_radius;

uniform float view_path_samples;
uniform float light_path_samples;

// // = object.matrixWorld
// uniform modelMatrix;

// // = camera.matrixWorldInverse * object.matrixWorld
// out mat4 modelViewMatrix;

// // = camera.projectionMatrix
// out mat4 projectionMatrix;

// // = camera.matrixWorldInverse
// out mat4 viewMatrix;

// // = inverse transpose of modelViewMatrix
// out mat3 normalMatrix;

// // = camera position in world space
// out vec3 cameraPosition;


void main(){
	obj_position;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	vpos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	frag_position = position;
}