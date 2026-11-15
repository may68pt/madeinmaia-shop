'use strict';

const ambiente = (() => {
  const duration = 84;
  const pieces = [
    {name:'Terra funda', hz:396, base:99, tide:0.085, tint:340},
    {name:'Maré interior', hz:417, base:104.25, tide:0.13, tint:440},
    {name:'Brasa lenta', hz:528, base:132, tide:0.19, tint:525},
    {name:'Câmara verde', hz:639, base:79.875, tide:0.10, tint:630},
    {name:'Eco e espaço', hz:741, base:92.625, tide:0.155, tint:760},
    {name:'Luz oblíqua', hz:852, base:106.5, tide:0.115, tint:860},
    {name:'Depois do silêncio', hz:963, base:120.375, tide:0.065, tint:970}
  ];
  function markup(index) {
    const piece=pieces[index];
    return `<div class="ambient-player" data-ambient="${index}">
      <div><strong>${piece.name}</strong><span class="ambient-meta">1 min 24 s · referência ${piece.hz} Hz</span></div>
      <div class="ambient-controls"><button type="button" data-sound="play">Ouvir ambiente</button><button type="button" data-sound="stop" hidden>Recomeçar</button><output aria-label="Tempo decorrido">0:00</output></div>
      <progress aria-label="Progresso do áudio" max="${duration}" value="0"></progress><span class="ambient-message" role="status"></span>
    </div>`;
  }
  const randomFor = (seed) => () => {
    seed=(1664525*seed+1013904223)>>>0;
    return seed/4294967296;
  };
  function synth(context,destination,index,start) {
    const p=pieces[index], random=randomFor(1627+index*41);
    const level=context.createGain();
    const fade=Float32Array.from({length:337},(_,i)=>{
      const time=i/4;
      return .74*Math.sin(Math.PI/2*Math.min(1,time/5))**2*Math.min(1,(duration-time)/13)**2;
    });
    level.gain.setValueCurveAtTime(fade,start,duration);
    const compressor=context.createDynamicsCompressor();
    compressor.threshold.value=-19;
    compressor.knee.value=16;
    compressor.ratio.value=2.1;
    const air=context.createBiquadFilter();
    air.type='lowpass';air.frequency.value=3850;
    level.connect(air);air.connect(compressor);compressor.connect(destination);
    const hall=context.createConvolver();
    const rate=context.sampleRate, n=Math.floor(rate*4.5), ir=context.createBuffer(2,n,rate);
    for(let ch=0;ch<2;ch++){
      const a=ir.getChannelData(ch);
      let smooth=0;
      for(let j=0;j<n;j++){
        smooth=.45*smooth+.55*(random()*2-1);
        const env=(1-j/n)**3.15;
        a[j]=smooth*env*Math.min(1,j/(rate*.042));
      }
      for(const [t,g] of [[.039,.17],[.079,.10],[.128,.15],[.197,.08],[.298,.09]]){
        a[Math.floor((t+ch*.005)*rate)]+=g;
      }
    }
    hall.buffer=ir;
    const wet=context.createGain();
    wet.gain.value=.29+index*.012;
    hall.connect(wet);wet.connect(level);
    const mix=context.createGain();
    mix.connect(level);mix.connect(hall);
    const nodes=[];
    function panTo(source,pan,to){
      if(typeof context.createStereoPanner==='function'){
        const stereo=context.createStereoPanner();
        stereo.pan.value=pan;source.connect(stereo);stereo.connect(to);
      }else source.connect(to);
    }
    function tone({frequency,gain,at,attack,hold=0,tail,pan=0,shape='sine',glide=0}){
      const osc=context.createOscillator(), envelope=context.createGain();
      const begin=start+at, end=Math.min(start+duration,begin+attack+hold+tail);
      if(end<=begin+attack+hold)return;
      osc.type=shape;
      osc.frequency.setValueAtTime(frequency,begin);
      if(glide)osc.frequency.exponentialRampToValueAtTime(frequency*glide,end);
      const curve=Float32Array.from({length:256},(_,i)=>{
        const t=(end-begin)*i/255;
        if(t<attack)return gain*Math.sin(Math.PI/2*t/attack)**2;
        const fraction=Math.max(0,(t-attack-hold)/(end-begin-attack-hold));
        return gain*(1-fraction)**(tail<11?3:2);
      });
      envelope.gain.setValueCurveAtTime(curve,begin,end-begin);
      osc.connect(envelope);panTo(envelope,pan,mix);
      osc.start(begin);osc.stop(end);
      nodes.push(osc);
    }
    const wind=context.createBuffer(1,rate*5,rate), bed=wind.getChannelData(0);
    let brown=0;
    for(let i=0;i<bed.length;i++){brown=(brown+.025*(random()*2-1))/1.025;bed[i]=brown*2.6;}
    const breeze=context.createBufferSource(), band=context.createBiquadFilter(), breezeGain=context.createGain();
    breeze.buffer=wind;breeze.loop=true;band.type='bandpass';band.frequency.value=p.tint;band.Q.value=.92;
    breezeGain.gain.value=.15;
    breeze.connect(band);band.connect(breezeGain);breezeGain.connect(mix);
    const drift=context.createOscillator(), swing=context.createGain();
    drift.frequency.value=p.tide;swing.gain.value=.05;drift.connect(swing);swing.connect(breezeGain.gain);
    drift.start(start);drift.stop(start+duration);breeze.start(start);breeze.stop(start+duration);nodes.push(drift,breeze);
    // Overlapping chords unfold in three phrases. Exact reference is quiet and sustained.
    tone({frequency:p.hz,gain:.022,at:4,attack:16,hold:35,tail:24,pan:0});
    const fifth=p.base*1.5;
    for(const [at,root,pan] of [[0,p.base,-.14],[17,fifth,.22],[34,p.base,-.22],[51,fifth,.16]]){
      tone({frequency:root,gain:.112,at,attack:7,hold:10,tail:14,pan});
      tone({frequency:root*2,gain:.026,at:at+.35,attack:9,hold:5,tail:12,pan:-pan,shape:'triangle'});
      tone({frequency:root*(index===2||index===5?1.2:1.5),gain:.042,at:at+1,attack:8,hold:5,tail:12,pan:pan*.8});
    }
    const timings=[[6,17,32,50,66],[7,20,36,51,64],[8,23,39,54,67],[5,20,35,52,68],[9,24,41,56,69],[8,22,36,51,64],[6,21,38,53,67]][index];
    for(const [j,at] of timings.entries()){
      const base=p.base*(j%3===1?3:2), pan=(random()-.5)*1.18;
      for(const [ratio,gain,attack,tail] of [[1,.096,.19,10],[2.007,.022,.10,7],[2.76,.015,.075,4.4],[4.09,.006,.048,2.9]]){
        tone({frequency:base*ratio,gain,at,attack,tail,pan,glide:1.0006});
      }
    }
    for(const [j,at] of [13,27,45,60,72].entries()){
      tone({frequency:p.base*(j%2?6:4),gain:.008,at,attack:1.9,hold:1,tail:6,pan:j%2?.61:-.61});
    }
    return nodes;
  }
  let active=null;
  function resetUI(panel){
    panel.querySelector('[data-sound="play"]').textContent='Ouvir ambiente';
    panel.querySelector('[data-sound="stop"]').hidden=true;
    panel.querySelector('progress').value=0;
    panel.querySelector('output').textContent='0:00';
  }
  function stop(){
    if(!active)return;
    const {context,panel}=active;
    active=null;
    context.close().catch(()=>{});
    resetUI(panel);
  }
  function tick(session){
    if(active!==session)return;
    const {context,panel,start}=active;
    if(!panel.isConnected){stop();return;}
    const time=Math.max(0,context.currentTime-start);
    if(time>=duration){stop();return;}
    panel.querySelector('progress').value=time;
    panel.querySelector('output').textContent=`${Math.floor(time/60)}:${String(Math.floor(time)%60).padStart(2,'0')}`;
    requestAnimationFrame(()=>tick(session));
  }
  async function toggle(panel){
    const button=panel.querySelector('[data-sound="play"]');
    const status=panel.querySelector('.ambient-message');
    button.disabled=true;
    try{
      if(active?.panel===panel){
        if(active.context.state==='running'){
          await active.context.suspend();button.textContent='Continuar';
        }else{
          await active.context.resume();button.textContent='Pausar';
        }
        return;
      }
      stop();
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio){status.textContent='O navegador não oferece reprodução deste ambiente.';return;}
      const context=new Audio();
      const start=context.currentTime+.05;
      active={context,panel,start};
      synth(context,context.destination,Number(panel.dataset.ambient),start);
      await context.resume();
      if(active?.context!==context)return;
      status.textContent='';
      button.textContent='Pausar';
      panel.querySelector('[data-sound="stop"]').hidden=false;
      tick(active);
    }catch{
      if(active?.panel===panel)stop();
      status.textContent='O áudio não arrancou. Toca novamente para tentar.';
    }finally{button.disabled=false;}
  }
  document.addEventListener('click',(event)=>{
    const button=event.target.closest('[data-sound]');
    if(!button)return;
    const panel=button.closest('[data-ambient]');
    if(button.dataset.sound==='stop'){
      stop();
      toggle(panel);
    }else toggle(panel);
  });
  return {markup,synth,stop};
})();
