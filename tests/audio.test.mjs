import test from 'node:test';
import assert from 'node:assert/strict';
import {SquishAudio} from '../static/js/audio.js';
// Web Audio is the platform boundary; use a small offline graph recorder in Node.
function offlineAudio(){
 const tones=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},cancelScheduledValues(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),stop(){this.stopped=true;},start(){this.started=true;}});
 const a=new SquishAudio();a.ctx={state:'running',currentTime:0,createGain:node,createBiquadFilter:node,createOscillator(){const n=node();tones.push(n);return n;}};a.master=node();
 return {a,tones};
}
test('first press at audio time zero and its immediate release both schedule sound',()=>{
 const {a,tones}=offlineAudio();a.play('press');a.play('release');
 assert.equal(tones.filter(n=>n.started).length,2);
});
test('rapid repeated sound is bounded and mute stops existing tones immediately',()=>{
 const {a,tones}=offlineAudio();
 for(let i=0;i<10;i++){a.ctx.currentTime=i*.08;a.play(i%2?'press':'release',100);}
 assert.ok(a.voices.length<=3);a.setEnabled(false);
 assert.ok(tones.every(n=>n.stopped));assert.equal(a.master.gain.value,0);
 const before=tones.length;a.play('press');assert.equal(tones.length,before);
});
