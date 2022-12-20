in vec4 vpos;

// = object.matrixWorld
in mat4 modelMatrix;
in vec3 pos;
uniform vec3 obj_position;

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
	gl_FragCoord;
	gl_FrontFacing;
	gl_PointCoord;
	pos;
	obj_position;
	//gl_FragColor = vec4(0.5,0.5,1.0, 0.5);
	//gl_FragColor = vec4(vpos[0], vpos[1], vpos[2], 0.4);
	float psize = 6.378;
	gl_FragColor = vec4(pos.x/psize, pos.y/psize, pos.z/(psize * 3.0), 0.9);
	//gl_FragColor = vec4(0.0, 0.5, 0.4, 0.5);
}