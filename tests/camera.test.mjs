import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../static/vendor/three.module.js';
const api=await import('../static/js/camera.js').catch(()=>({}));
class Surface extends EventTarget {
 constructor(){super();this.style={};this.clientHeight=720;this.clientWidth=1280;this.doc=new EventTarget();this.ownerDocument=this.doc;this.doc.documentElement={clientWidth:1280,clientHeight:720};}
 getRootNode(){return this.doc;}setPointerCapture(){}releasePointerCapture(){}
}
function pointer(el,type,button=2,buttons=2,x=100){const event=new Event(type,{cancelable:true});Object.assign(event,{pointerId:1,pointerType:'mouse',button,buttons,clientX:x,clientY:100,pageX:x,pageY:100});el.dispatchEvent(event);}
test('cancelling a right-drag prevents buttonless rotation after focus loss',()=>{
 const el=new Surface(),camera=new THREE.PerspectiveCamera(35,1,.1,40);camera.position.set(0,4.75,6);
 let controls=api.createCameraControls(camera,el,new THREE.Vector3(0,.35,0));
 pointer(el,'pointerdown');pointer(el,'pointermove',2,2,160);controls.update();
 controls=api.cancelCameraGesture(controls);const after=camera.position.clone();
 pointer(el,'pointermove',-1,0,300);controls.update();
 assert.ok(after.distanceTo(camera.position)<1e-8);
 // A fresh right gesture must still work after cancellation.
 pointer(el,'pointerdown',2,2,100);pointer(el,'pointermove',2,2,200);controls.update();
 assert.ok(after.distanceTo(camera.position)>.1);controls.dispose();
});
