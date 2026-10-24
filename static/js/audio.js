/** Quiet synthesized rubbery squeaks. No downloaded audio or autoplay. */
export class SquishAudio {
  constructor(onUnavailable=()=>{}){this.enabled=true;this.ctx=null;this.voices=[];this.last={press:-Infinity,release:-Infinity};this.onUnavailable=onUnavailable;this.playRequest=0;}
  async unlock(){
    if(!this.enabled)return false;
    try{
      if(!this.ctx||this.ctx.state==='closed'){
        const AudioCtx=window.AudioContext||window.webkitAudioContext;
        if(!AudioCtx)throw Error('unavailable');
        this.ctx=new AudioCtx();this.master=this.ctx.createGain();this.master.gain.value=.40;
        const limiter=this.ctx.createDynamicsCompressor();limiter.threshold.value=-22;limiter.ratio.value=8;
        this.master.connect(limiter);limiter.connect(this.ctx.destination);
      }
      // Touch pointerdown need not grant activation; retry from pointerup/touchend.
      // Safari also exposes interrupted after switching apps or locking the screen.
      if(this.ctx.state==='suspended'||this.ctx.state==='interrupted')await this.ctx.resume();
      return this.enabled&&this.ctx.state==='running';
    }catch{this.onUnavailable();return false;}
  }
  async playFromGesture(kind,bounce=50){
    const request=++this.playRequest;
    // unlock() calls resume synchronously, while still inside the trusted event.
    const ready=await this.unlock();
    if(ready&&request===this.playRequest)this.play(kind,bounce);
  }
  setEnabled(enabled){
    this.enabled=enabled;
    if(this.master){this.master.gain.cancelScheduledValues(this.ctx.currentTime);this.master.gain.setValueAtTime(enabled?.4:0,this.ctx.currentTime);}
    if(!enabled){this.playRequest++;for(const voice of this.voices)try{voice.stop();}catch{}this.voices=[];}
  }
  play(kind,bounce=50){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime;
    if(now-this.last[kind]<.065)return;
    this.last[kind]=now;
    while(this.voices.length>=3){try{this.voices.shift().stop();}catch{}}
    try{
      const b=bounce/100,osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();
      const duration=kind==='press'?.19:.23+b*.08;
      osc.type='sine';filter.type='lowpass';filter.frequency.value=900;
      osc.frequency.setValueAtTime(kind==='press'?245:190+140*b,now);
      osc.frequency.exponentialRampToValueAtTime(kind==='press'?115:105+60*b,now+duration);
      if(kind==='release')osc.frequency.setValueAtTime(265+130*b,now+.035);
      gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.16,now+.018);gain.gain.exponentialRampToValueAtTime(.001,now+duration);
      osc.connect(filter);filter.connect(gain);gain.connect(this.master);osc.start(now);osc.stop(now+duration+.02);
      this.voices.push(osc);osc.onended=()=>{this.voices=this.voices.filter(v=>v!==osc);osc.disconnect();filter.disconnect();gain.disconnect();};
    }catch{this.onUnavailable();}
  }
}

/** Capture activation before the canvas or orbit controls can consume the event.
 * These handlers only unlock; a blank tap never emits a squish or changes count. */
export function bindAudioGestures(target,audio){
  const events=['pointerdown','pointerup','touchend','click','keydown'];
  const unlock=()=>{void audio.unlock();};
  const options={capture:true,passive:true};
  for(const event of events)target.addEventListener(event,unlock,options);
  return ()=>{for(const event of events)target.removeEventListener(event,unlock,options);};
}
