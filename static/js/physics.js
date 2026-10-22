/** A shared, smooth displacement field. Every mesh uses the same rest coordinates.
 * Small vector springs are integrated at <=1/240 s; mesh vertices are never
 * independently integrated, so there are no torn seams or accumulated drift.
 */
export class Deformer {
  constructor({floor=null}={}){this.fields=[];this.active=null;this.floor=floor;}
  begin(point,normal,radius=1.1){
    if(this.active)this.release();
    const length=Math.hypot(...normal)||1;
    const f={p:[...point],n:normal.map(v=>v/length),r:Math.max(.75,radius),q:[0,0,0],v:[0,0,0],drag:[0,0,0],held:true};
    this.fields.push(f);this.active=f;
    if(this.fields.length>10)this.fields.shift();
    return f;
  }
  drag(vector){
    if(!this.active)return;
    const length=Math.hypot(...vector),scale=Math.min(1,.6/(length||1));
    this.active.drag=vector.map(v=>v*scale);
  }
  release(){if(!this.active)return false;this.active.held=false;this.active=null;return true;}
  reset(){this.fields.length=0;this.active=null;}
  step(dt,softness,bounce){
    const s=Math.max(0,Math.min(100,softness))/100,b=Math.max(0,Math.min(100,bounce))/100;
    const elapsed=Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0));
    const steps=Math.max(1,Math.ceil(elapsed*240)),h=elapsed/steps;
    for(const f of this.fields){
      const target=f.held?f.n.map((n,i)=>-n*(.045+.30*s)+f.drag[i]*(.28+.52*s)):[0,0,0];
      const limit=f.r*.39,len=Math.hypot(...target);
      if(len>limit)for(let i=0;i<3;i++)target[i]*=limit/len;
      const w=f.held?18:3.8+13*b,zeta=f.held?1:1.05-.69*b;
      for(let j=0;j<steps;j++)for(let i=0;i<3;i++){
        f.v[i]+=((target[i]-f.q[i])*w*w-2*zeta*w*f.v[i])*h;
        f.q[i]+=f.v[i]*h;
      }
      // Also bound transient spring overshoot, including an abrupt slider change.
      const qlen=Math.hypot(...f.q);
      if(qlen>limit){for(let i=0;i<3;i++){f.q[i]*=limit/qlen;f.v[i]*=.4;}}
    }
    this.fields=this.fields.filter(f=>f.held||Math.hypot(...f.q,...f.v)>.000015);
    this.totalScale=Math.min(1,.46/(this.fields.reduce((sum,f)=>sum+Math.hypot(...f.q),0)||1));
    return this.fields.length>0;
  }
  sample(x,y,z,out){
    out[0]=x;out[1]=y;out[2]=z;
    const height=this.floor===null?1:Math.min(1,Math.max(0,(y-this.floor)/.65));
    const anchor=height*height*(3-2*height);
    const scale=(this.totalScale??1)*anchor;
    for(const f of this.fields){
      const d=((x-f.p[0])**2+(y-f.p[1])**2+(z-f.p[2])**2)/(f.r*f.r);
      if(d>6)continue;
      const weight=Math.exp(-2.8*d)*scale;
      for(let i=0;i<3;i++)out[i]+=f.q[i]*weight;
    }
    return out;
  }
}
