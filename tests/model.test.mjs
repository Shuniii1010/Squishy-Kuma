import test from 'node:test';
import assert from 'node:assert/strict';
import {createBear,updateBear} from '../static/js/model.js';
import {Deformer} from '../static/js/physics.js';

test('reference model consists only of a thick bear head, ears and facial details',()=>{
 const {meshes}=createBear();assert.ok(meshes.some(m=>m.name==='head'));
 assert.ok(meshes.every(m=>!/body|arm|foot|tail|belly/.test(m.name)));
 let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity;
 for(const mesh of meshes)for(let i=0;i<mesh.geometry.attributes.position.count;i++){
  const p=mesh.geometry.attributes.position;minY=Math.min(minY,p.getY(i));maxY=Math.max(maxY,p.getY(i));minX=Math.min(minX,p.getX(i));maxX=Math.max(maxX,p.getX(i));
 }
 assert.ok(minY>=.025);assert.ok(maxY-minY>.5);assert.ok(maxX-minX>2.5);
});
test('muzzle, eyes and inner-ear patches face upward on the head surface',()=>{
 const {meshes}=createBear();
 for(const name of ['muzzle','nose','eye--0.56','eye-0.56','inner-ear-0','inner-ear-1']){
  const mesh=meshes.find(m=>m.name===name);assert.ok(mesh,name);const normal=mesh.geometry.attributes.normal;
  let mean=0;for(let i=0;i<normal.count;i++)mean+=normal.getY(i);
  assert.ok(mean/normal.count>.4,`${name} faces inward`);
 }
});
test('all facial details use the same deformation field; the underside stays above the floor',()=>{
 const {meshes}=createBear(),d=new Deformer({floor:.025});d.begin([.5,.69,.1],[0,1,0],1.08);
 for(let i=0;i<90;i++)d.step(1/120,100,50);updateBear(meshes,d);
 let maxMovement=0;
 for(const mesh of meshes){const p=mesh.geometry.attributes.position,r=mesh.userData.rest,out=[0,0,0];
  for(let i=0;i<p.count;i+=11){const j=i*3;d.sample(r[j],r[j+1],r[j+2],out);
   assert.ok(Math.hypot(p.getX(i)-out[0],p.getY(i)-out[1],p.getZ(i)-out[2])<1e-6);
   assert.ok(p.getY(i)>=.025-1e-6);
   maxMovement=Math.max(maxMovement,Math.hypot(p.getX(i)-r[j],p.getY(i)-r[j+1],p.getZ(i)-r[j+2]));
  }
 }
 assert.ok(maxMovement>.25);
});
