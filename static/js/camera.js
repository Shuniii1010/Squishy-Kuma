import * as THREE from '../vendor/three.module.js';
import {OrbitControls} from '../vendor/OrbitControls.js';
export function createCameraControls(camera,canvas,target){
  const c=new OrbitControls(camera,canvas);c.target.copy(target);
  c.enableDamping=true;c.dampingFactor=.09;c.enablePan=false;c.minDistance=4.6;c.maxDistance=10;
  c.minPolarAngle=.25;c.maxPolarAngle=Math.PI*.47;
  c.mouseButtons={LEFT:null,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.ROTATE};
  c.touches={ONE:null,TWO:null};c.update();return c;
}
/** Public disconnect alone retains OrbitControls' private pointer tracking.
 * Recreate it to discard all gesture state and damping, retaining the view. */
export function cancelCameraGesture(controls){
  const target=controls.target.clone(),camera=controls.object,canvas=controls.domElement;
  controls.dispose();return createCameraControls(camera,canvas,target);
}
