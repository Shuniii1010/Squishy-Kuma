import {Store,PRESETS} from './state.js';
import {t} from './i18n.js';
import {SquishAudio,bindAudioGestures} from './audio.js';

const $=id=>document.getElementById(id);
let storage;try{storage=window.localStorage;}catch{}
const store=new Store(storage);let scene,status='ready',errorKey=null,toastTimer,lastCount=store.value.count,toastKey=null;
const audio=new SquishAudio(()=>toast('soundUnavailable'));
function toast(key){toastKey=key;$('toast').textContent=t(store.value.lang,key);$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').classList.remove('visible');toastKey=null;},2400);}
function render(){
  const s=store.value,lang=s.lang;document.documentElement.lang=lang==='zh'?'zh-CN':'en';
  document.title=`${t(lang,'title')} · Squishy-Kuma`;
  document.querySelector('meta[name=description]').content=t(lang,'metaDescription');
  document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(lang,el.dataset.i18n));
  document.querySelector('.language').setAttribute('aria-label',t(lang,'language'));
  document.querySelector('.presets').setAttribute('aria-label',t(lang,'presets'));
  $('lang-zh').setAttribute('aria-pressed',String(lang==='zh'));$('lang-en').setAttribute('aria-pressed',String(lang==='en'));
  $('lang-zh').setAttribute('aria-label',t(lang,'languageZh'));$('lang-en').setAttribute('aria-label',t(lang,'languageEn'));
  $('sound-label').textContent=t(lang,s.sound?'soundOn':'soundOff');$('sound').setAttribute('aria-label',t(lang,s.sound?'soundOn':'soundOff'));
  $('sound').setAttribute('aria-pressed',String(s.sound));$('sound-icon').setAttribute('href',s.sound?'#i-sound':'#i-mute');
  for(const key of ['softness','bounce']){$(key).value=s[key];$(key).style.setProperty('--value',`${s[key]}%`);$(`${key}-value`).textContent=s[key];}
  document.querySelectorAll('[data-preset]').forEach(button=>{const selected=button.dataset.preset===s.preset;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
  $('count').textContent=new Intl.NumberFormat(lang==='zh'?'zh-CN':'en-US').format(s.count);
  if(s.count>lastCount){$('count').classList.remove('count-pop');void $('count').offsetWidth;$('count').classList.add('count-pop');}lastCount=s.count;
  $('scene-status').textContent=t(lang,status);$('bear-canvas').setAttribute('aria-label',t(lang,'canvasLabel'));
  $('home-view').title=t(lang,'homeView');$('home-view').setAttribute('aria-label',t(lang,'homeView'));
  document.querySelector('.panel-kicker').textContent=t(lang,'panelKicker');
  if(matchMedia('(pointer:coarse)').matches)$('operation-hint').textContent=t(lang,'touchHint');
  if(errorKey){$('loading-text').textContent=t(lang,errorKey);$('error-detail').textContent=t(lang,errorKey==='error'?'errorDetail':'loadError');}
  if(toastKey)$('toast').textContent=t(lang,toastKey);
  audio.setEnabled(s.sound);
}
store.subscribe(render);render();
$('lang-zh').onclick=()=>store.update({lang:'zh'});$('lang-en').onclick=()=>store.update({lang:'en'});
$('sound').onclick=()=>{store.update({sound:!store.value.sound});if(store.value.sound)audio.unlock();};
for(const key of ['softness','bounce'])$(key).addEventListener('input',event=>store.update({[key]:Number(event.target.value),preset:'custom'}));
document.querySelectorAll('[data-preset]').forEach(button=>button.onclick=()=>{const preset=button.dataset.preset;store.update({...PRESETS[preset],preset});});
$('reset-count').onclick=()=>{store.clearCount();toast('countReset');};
$('reset-shape').onclick=()=>{scene?.reset();toast('shapeReset');};$('home-view').onclick=()=>scene?.home();$('retry').onclick=()=>location.reload();
bindAudioGestures(document,audio);
function showError(key){errorKey=key;$('loading').hidden=false;$('error-detail').hidden=false;$('retry').hidden=false;$('viewport').setAttribute('aria-busy','false');render();}
try{
  const {createScene}=await import('./scene.js');
  scene=createScene({canvas:$('bear-canvas'),viewport:$('viewport'),getSettings:()=>store.value,
    onPress(){store.press();void audio.playFromGesture('press',store.value.bounce);},
    onRelease(){void audio.playFromGesture('release',store.value.bounce);},
    onStatus(key){status=key;$('scene-status').textContent=t(store.value.lang,key);},onError:showError});
  $('loading').hidden=true;$('viewport').setAttribute('aria-busy','false');
}catch(error){console.error('Squishy-Kuma initialization:',error);showError(/webgl|context/i.test(error.message)?'error':'loadError');}
