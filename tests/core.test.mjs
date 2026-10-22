import test from 'node:test';
import assert from 'node:assert/strict';

// These assertions distinguish a local soft field from global scaling,
// separate press depth from release dynamics, and protect recovery stability.
const physics = await import('../static/js/physics.js').catch(() => ({}));
const state = await import('../static/js/state.js').catch(() => ({}));
const i18n = await import('../static/js/i18n.js').catch(() => ({}));
const deform = () => new physics.Deformer();
function press(softness=70,bounce=50) {
  const d=deform(); d.begin([0,0,0],[0,0,1],1.1);
  for(let i=0;i<120;i++) d.step(1/120,softness,bounce);
  return d;
}
function z(d,x=0){const out=[0,0,0]; d.sample(x,0,0,out); return out[2];}

test('local dent leaves distant vertices unchanged',()=>{
  const d=press(); assert.ok(z(d)<-.15); assert.ok(Math.abs(z(d,3))<.0001);
});
test('softness controls press depth independently of bounce',()=>{
  assert.ok(Math.abs(z(press(100)))>3*Math.abs(z(press(0))));
  assert.ok(Math.abs(z(press(75,0))-z(press(75,100)))<.005);
});
test('bounce changes release speed and produces a bounded overshoot',()=>{
  const slow=press(70,0),fast=press(70,100); slow.release();fast.release();
  for(let i=0;i<30;i++){slow.step(1/120,70,0);fast.step(1/120,70,100);}
  assert.ok(Math.abs(z(fast))<Math.abs(z(slow))*.55);
  let max=0; for(let i=0;i<100;i++){fast.step(1/120,70,100);max=Math.max(max,z(fast));}
  assert.ok(max>.001);
});
test('all corner settings recover after repeated presses and a stalled frame',()=>{
  for(const soft of [0,100])for(const bounce of [0,100]){
    const d=press(soft,bounce);
    for(let j=0;j<18;j++){
      d.release();d.begin([j*.005,0,0],[0,0,1],1.1);d.drag([500,-500,500]);
      d.step(j===8?10:1/30,soft,bounce);
      const out=[0,0,0];d.sample(0,0,0,out);
      assert.ok(out.every(Number.isFinite));assert.ok(Math.hypot(...out)<.65);
    }
    d.release();for(let i=0;i<1800;i++)d.step(1/120,soft,bounce);
    assert.ok(Math.abs(z(d))<.0001,`unsettled ${soft},${bounce}`);
  }
});
test('reset clears shape and residual motion',()=>{
  const d=press();d.reset();assert.equal(z(d),0);d.step(.1,100,100);assert.equal(z(d),0);
});
const memory=()=>{let v=null;return {getItem:()=>v,setItem:(_,s)=>{v=s;}};};
test('count and choices survive reload; independent resets preserve settings',()=>{
  const m=memory(),s=new state.Store(m); assert.equal(s.value.count,0);assert.equal(s.value.lang,'zh');
  s.press();s.update({lang:'en',sound:false,softness:99,bounce:4});
  const r=new state.Store(m);assert.equal(r.value.count,1);assert.equal(r.value.lang,'en');assert.equal(r.value.sound,false);
  r.clearCount();assert.equal(r.value.softness,99);assert.equal(r.value.count,0);
});
test('broken storage and invalid persisted values degrade safely',()=>{
  const bad={getItem:()=>'{',setItem:()=>{throw Error('blocked');}};
  const s=new state.Store(bad);s.press();assert.equal(s.value.count,1);
  const malformed=new state.Store({getItem:()=>JSON.stringify({count:-7,lang:'xx',softness:'oops',bounce:1000,sound:'false'}),setItem:()=>{}});
  assert.equal(malformed.value.count,0);assert.equal(malformed.value.lang,'zh');assert.equal(malformed.value.softness,72);assert.equal(malformed.value.bounce,100);assert.equal(malformed.value.sound,true);
});
test('every interface message has both Chinese and English',()=>{
  assert.deepEqual(Object.keys(i18n.messages.zh).sort(),Object.keys(i18n.messages.en).sort());
  assert.ok(Object.values(i18n.messages.en).every(v=>typeof v==='string'&&v.length));
});
