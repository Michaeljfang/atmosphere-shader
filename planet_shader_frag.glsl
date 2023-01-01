in vec4 vpos;
in mat4 modelMatrix;
in vec3 frag_position; // fragment world-space position


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


void main(){
	// units: 1 = 1Mm, kg, s, K.

	cameraPosition;
	gl_FragColor = vec4(remaining_colors, opacity_from_mass);
}