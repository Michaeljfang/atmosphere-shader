
out vec4 vpos;
out vec3 frag_position;

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
	vpos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	frag_position = position;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}