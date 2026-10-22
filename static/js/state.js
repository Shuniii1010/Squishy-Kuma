export const PRESETS={mochi:{softness:94,bounce:16},classic:{softness:72,bounce:52},pudding:{softness:58,bounce:92}};
const defaults={lang:'zh',sound:true,count:0,softness:72,bounce:52,preset:'classic'};
const clamp=(v,fallback)=>typeof v==='number'&&Number.isFinite(v)?Math.round(Math.max(0,Math.min(100,v))):fallback;
export class Store {
  constructor(storage){
    this.storage=storage;this.listeners=new Set();let saved={};
    try{saved=JSON.parse(storage?.getItem('squishy-kuma.v1')||'{}')||{};}catch{}
    this.value=this.sanitize({...defaults,...saved});
  }
  sanitize(v){return {lang:v.lang==='en'?'en':'zh',sound:typeof v.sound==='boolean'?v.sound:true,
    count:Number.isSafeInteger(v.count)&&v.count>=0?v.count:0,
    softness:clamp(v.softness,72),bounce:clamp(v.bounce,52),preset:PRESETS[v.preset]?v.preset:'custom'};}
  update(patch){
    this.value=this.sanitize({...this.value,...patch});
    try{this.storage?.setItem('squishy-kuma.v1',JSON.stringify(this.value));}catch{}
    for(const listener of this.listeners)listener(this.value);
  }
  press(){this.update({count:Math.min(Number.MAX_SAFE_INTEGER,this.value.count+1)});}
  clearCount(){this.update({count:0});}
  subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
}
