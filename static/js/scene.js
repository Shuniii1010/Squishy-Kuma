import * as THREE from '../vendor/three.module.js';
import {createCameraControls,cancelCameraGesture} from './camera.js';
import {createBear,updateBear} from './model.js';
import {Deformer} from './physics.js';

export function createScene({canvas,viewport,getSettings,onPress,onRelease,onStatus,onError}){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,40);
  camera.position.set(.15,5.2,3.5);
  const homePosition=camera.position.clone(),homeTarget=new THREE.Vector3(0,.35,0);
  let controls=createCameraControls(camera,canvas,homeTarget);
  function clearCameraGesture(){controls=cancelCameraGesture(controls);}
  scene.add(new THREE.HemisphereLight('#fff8e8','#9b8b6b',2.4));
  const key=new THREE.DirectionalLight('#fff5df',3.3);key.position.set(-3.5,6,5);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=5;key.shadow.camera.bottom=-4;
  key.shadow.normalBias=.025;key.shadow.bias=-.0001;key.shadow.radius=5;scene.add(key);
  const fill=new THREE.DirectionalLight('#ffffff',1.2);fill.position.set(4,3,1);scene.add(fill);
  const rim=new THREE.DirectionalLight('#ffe7b5',1.1);rim.position.set(1,4,-4);scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#78623c',opacity:.13}));
  floor.rotation.x=-Math.PI/2;floor.position.y=.012;floor.receiveShadow=true;scene.add(floor);
  // Broad contact shadow, painted procedurally; no external image asset.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=256;
  const context=shadowCanvas.getContext('2d');
  if(context){const gradient=context.createRadialGradient(128,128,10,128,128,126);gradient.addColorStop(0,'rgba(117,89,48,0.22)');gradient.addColorStop(.45,'rgba(117,89,48,0.12)');gradient.addColorStop(1,'rgba(117,89,48,0)');context.fillStyle=gradient;context.fillRect(0,0,256,256);
    const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.4),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;scene.add(shadow);}
  const {group,meshes}=createBear();scene.add(group);
  const deformer=new Deformer({floor:.025}),raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  const dragPlane=new THREE.Plane(),start=new THREE.Vector3(),dragPoint=new THREE.Vector3();
  const touches=new Set();let activePointer=null,dirty=false,destroyed=false,frame,previous=performance.now();
  function ray(event){const r=canvas.getBoundingClientRect();pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
  function restPoint(hit){
    const p=hit.object.geometry.attributes.position,rest=hit.object.userData.rest,f=hit.face;
    const a=new THREE.Vector3().fromBufferAttribute(p,f.a),b=new THREE.Vector3().fromBufferAttribute(p,f.b),c=new THREE.Vector3().fromBufferAttribute(p,f.c);
    const bary=THREE.Triangle.getBarycoord(hit.point,a,b,c,new THREE.Vector3());
    if(!bary)return hit.point.toArray();
    return [0,1,2].map(axis=>rest[f.a*3+axis]*bary.x+rest[f.b*3+axis]*bary.y+rest[f.c*3+axis]*bary.z);
  }
  function finish(){
    if(activePointer===null)return;
    const id=activePointer;activePointer=null;
    deformer.release();controls.enabled=true;canvas.classList.remove('pressing');
    if(canvas.hasPointerCapture(id))try{canvas.releasePointerCapture(id);}catch{}
    onRelease();onStatus('release');
  }
  function down(event){
    if(event.pointerType==='touch'){touches.add(event.pointerId);if(touches.size>1){finish();return;}}
    if(event.button!==0||activePointer!==null)return;
    ray(event);const hit=raycaster.intersectObjects(meshes,false)[0];if(!hit)return;
    event.preventDefault();
    if(event.pointerType!=='touch')event.stopImmediatePropagation();
    const point=restPoint(hit),normal=hit.normal?.clone()||hit.face.normal.clone();
    normal.normalize();
    // The shared radius also includes details attached to the selected surface.
    deformer.begin(point,normal.toArray(),1.08);
    activePointer=event.pointerId;controls.enabled=false;
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),hit.point);
    start.copy(hit.point);canvas.setPointerCapture(activePointer);canvas.classList.add('pressing');
    onPress();onStatus('pressing');
  }
  function move(event){
    if(activePointer!==null){
      if(event.pointerId!==activePointer)return;
      if(event.pointerType==='mouse'&&!(event.buttons&1)){finish();return;}
      ray(event);if(raycaster.ray.intersectPlane(dragPlane,dragPoint))deformer.drag(dragPoint.sub(start).toArray());
    }else if(event.pointerType==='mouse'){
      ray(event);canvas.classList.toggle('hovering',raycaster.intersectObjects(meshes,false).length>0);
    }
  }
  function up(event){touches.delete(event.pointerId);if(event.pointerId===activePointer)finish();}
  function loseFocus(){touches.clear();finish();clearCameraGesture();}
  function visibility(){if(document.hidden)loseFocus();}
  function leaveWindow(event){if(event.relatedTarget===null)loseFocus();}
  function contextMenu(event){event.preventDefault();}
  function lostCapture(event){up(event);clearCameraGesture();}
  canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointermove',move);
  canvas.addEventListener('lostpointercapture',lostCapture);canvas.addEventListener('contextmenu',contextMenu);
  window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);window.addEventListener('blur',loseFocus);
  document.addEventListener('visibilitychange',visibility);document.addEventListener('pointerout',leaveWindow);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();loseFocus();destroyed=true;cancelAnimationFrame(frame);onError('error');});
  function resize(){const {width,height}=viewport.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);}
  const observer=new ResizeObserver(resize);observer.observe(viewport);resize();
  function tick(now){
    if(destroyed)return;
    const dt=(now-previous)/1000;previous=now;const {softness,bounce}=getSettings();
    const moving=deformer.step(dt,softness,bounce);
    if(moving||dirty)updateBear(meshes,deformer);dirty=moving;
    controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(tick);
  }
  renderer.render(scene,camera);frame=requestAnimationFrame(tick);
  return {
    reset(){finish();deformer.reset();updateBear(meshes,deformer);dirty=false;onStatus('ready');},
    home(){finish();clearCameraGesture();camera.position.copy(homePosition);controls.target.copy(homeTarget);controls.update();onStatus('ready');},
    dispose(){destroyed=true;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();renderer.dispose();
      canvas.removeEventListener('pointerdown',down,true);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('lostpointercapture',lostCapture);canvas.removeEventListener('contextmenu',contextMenu);
      window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);window.removeEventListener('blur',loseFocus);document.removeEventListener('visibilitychange',visibility);document.removeEventListener('pointerout',leaveWindow);}
  };
}
