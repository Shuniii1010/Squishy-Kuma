import * as THREE from '../vendor/three.module.js';

const signPow=(v,e)=>Math.sign(v)*Math.pow(Math.abs(v),e);
const HEAD={center:[0,0,0],size:[1.32,.95,.33],exponent:.57};
/** All geometry is baked in the same rest-space, including every facial detail. */
export function createBear(){
  const group=new THREE.Group(),meshes=[];
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.86,metalness:0});
  const honey=material('#bd8640'),cream=material('#fff0cb'),yellow=material('#f5d37c'),ink=material('#34251f');
  const add=(geometry,mat,name)=>{
    geometry.computeVertexNormals();
    geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
    const mesh=new THREE.Mesh(geometry,mat);mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;
    mesh.userData.rest=new Float32Array(geometry.attributes.position.array);
    mesh.frustumCulled=false;group.add(mesh);meshes.push(mesh);return mesh;
  };
  function blob(name,center,size,mat,exponent=1,rotate=0){
    const g=new THREE.SphereGeometry(1,64,40),p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      let x=signPow(p.getX(i),exponent)*size[0],y=signPow(p.getY(i),exponent)*size[1],z=signPow(p.getZ(i),exponent)*size[2];
      p.setXYZ(i,center[0]+x*Math.cos(rotate)-y*Math.sin(rotate),center[1]+x*Math.sin(rotate)+y*Math.cos(rotate),center[2]+z);
    }
    return add(g,mat,name);
  }
  function front(shape,x,y){
    const n=2/shape.exponent,[cx,cy,cz]=shape.center,[a,b,c]=shape.size;
    return cz+c*Math.pow(Math.max(.0001,1-Math.abs((x-cx)/a)**n-Math.abs((y-cy)/b)**n),1/n);
  }
  function patch(name,cx,cy,rx,ry,shape,mat,lift=.008){
    // A radial disk projected onto the parent surface: no floating flat ovals.
    const g=new THREE.BufferGeometry(),positions=[],indices=[],rings=14,segments=64;
    for(let row=0;row<=rings;row++)for(let j=0;j<=segments;j++){
      const a=j/segments*Math.PI*2,r=row/rings,x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;
      positions.push(x,y,front(shape,x,y)+lift+.007*(1-r*r));
    }
    for(let row=0;row<rings;row++)for(let j=0;j<segments;j++){
      const a=row*(segments+1)+j,b=a+segments+1;indices.push(a,b,a+1,b,b+1,a+1);
    }
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setIndex(indices);return add(g,mat,name);
  }
  const ears=[{center:[-1.04,.85,-.02],size:[.39,.41,.31],exponent:.85},{center:[1.04,.85,-.02],size:[.39,.41,.31],exponent:.85}];
  ears.forEach((ear,i)=>{blob(`ear-${i}`,ear.center,ear.size,honey,.85);patch(`inner-ear-${i}`,ear.center[0],.90,.25,.26,ear,yellow,.012);});
  blob('head',HEAD.center,HEAD.size,honey,HEAD.exponent);
  patch('muzzle',0,-.23,.42,.29,HEAD,cream,.012);
  for(const x of [-.56,.56])patch(`eye-${x}`,x,.02,.083,.094,HEAD,ink,.020);
  patch('nose',0,-.17,.099,.079,HEAD,ink,.038);
  function mouth(name,coords){
    const points=coords.map(([x,y])=>new THREE.Vector3(x,y,front(HEAD,x,y)+.044));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),28,.021,8,false),ink,name);
  }
  mouth('mouth-stem',[[0,-.21],[0,-.26],[0,-.285]]);
  mouth('mouth-left',[[0,-.275],[-.06,-.335],[-.12,-.34],[-.17,-.315]]);
  mouth('mouth-right',[[0,-.275],[.06,-.335],[.12,-.34],[.17,-.315]]);
  // Lay the thick face-shaped toy on the table, as in the supplied photo.
  // Bake this pose into EVERY mesh before capturing the shared rest coordinates.
  const pose=new THREE.Matrix4().makeRotationX(-Math.PI/2);
  pose.setPosition(0,.36,0);
  for(const mesh of meshes){mesh.geometry.applyMatrix4(pose);mesh.userData.rest=new Float32Array(mesh.geometry.attributes.position.array);}
  group.userData.meshes=meshes;
  return {group,meshes};
}

export function updateBear(meshes,deformer){
  const out=[0,0,0];
  for(const mesh of meshes){
    const p=mesh.geometry.attributes.position,r=mesh.userData.rest;
    for(let i=0;i<p.count;i++){const j=i*3;deformer.sample(r[j],r[j+1],r[j+2],out);p.setXYZ(i,...out);}
    p.needsUpdate=true;mesh.geometry.computeVertexNormals();
    // Raycasts must use fresh bounds after local stretching.
    mesh.geometry.computeBoundingSphere();mesh.geometry.computeBoundingBox();
  }
}
