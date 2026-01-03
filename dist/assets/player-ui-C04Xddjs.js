import{l as Q}from"./index-B4IlvQTO.js";const X="https://luxury-language-api.vercel.app/api/tts",G=[{id:"en-US-AriaNeural",label:"US — Aria"},{id:"en-US-AvaNeural",label:"US — Ava"},{id:"en-US-JennyNeural",label:"US — Jenny"},{id:"en-US-GuyNeural",label:"US — Guy"},{id:"en-US-DavisNeural",label:"US — Davis"},{id:"en-US-SaraNeural",label:"US — Sara"},{id:"en-US-NancyNeural",label:"US — Nancy"},{id:"en-US-MichelleNeural",label:"US — Michelle"},{id:"en-US-ChristopherNeural",label:"US — Christopher"},{id:"en-US-TonyNeural",label:"US — Tony"},{id:"en-US-JennyMultilingualNeural",label:"US — Jenny (Multilingual)"},{id:"en-US-EmmaMultilingualNeural",label:"US — Emma (Multilingual)"}],A=1,H=0;async function Y(){try{const e=await fetch(`${X}?voices=1`);if(!e.ok)return{};const t=await e.json(),a={};for(const s of t.voices||[])String(s.ShortName).startsWith("en-US-")&&(a[s.ShortName]={styles:Array.isArray(s.StyleList)?s.StyleList:[]});return a}catch{return{}}}async function Z(e){const t=await fetch(X,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),a=o=>t.headers.get(o)||"",s={styleUsed:a("X-Style-Used"),styleRequested:a("X-Style-Requested"),fallback:a("X-Style-Fallback"),message:a("X-Style-Message"),region:a("X-Azure-Region")};if(!t.ok){let o="";try{o=await t.text()}catch{}const c=new Error(`TTS ${t.status}: ${o||"synthesis failed"}`);throw c.meta=s,c}const i=await t.blob();return i._meta=s,i}const r=(e,t)=>e.querySelector(t);function tt(){var s,i,o;const e=document.querySelector("#referenceText")||document.querySelector("#free-input")||document.querySelector("#reference-text")||document.querySelector("textarea"),t=(s=e==null?void 0:e.value)==null?void 0:s.trim(),a=(o=(i=window.getSelection())==null?void 0:i.toString())==null?void 0:o.trim();return(t||a||"").trim()}function J(e,t,a){var o;if(!e)return;const s=((o=t==null?void 0:t[a])==null?void 0:o.styles)||[],i=e.value;e.innerHTML='<option value="">(neutral)</option>'+s.map(c=>`<option value="${c}">${c}</option>`).join(""),i&&s.includes(i)&&(e.value=i)}function et(e){const t=G.map(s=>`<option value="${s.id}">${s.label}</option>`).join("");e.innerHTML=`
      <div id="tts-wrap">
        <div class="tts-box tts-compact" style="padding: 10px 12px;">
          <div class="tts-head">
            <div id="tts-note" class="tts-note" aria-live="polite" style="text-align:center; min-height:0;"></div>
          </div>
  
          <label class="tts-voice" style="width:100%; display:flex !important; flex-direction:column !important; align-items:center !important; margin-bottom:4px;">
            <span style="font-weight:700; margin-bottom:2px; font-size:1.05em; color:#333;">Voice</span>
            <select id="tts-voice" style="width:98%; padding:4px; margin:0 auto; display:block;">${t}</select>
          </label>
  
          <label class="tts-speed" style="margin-bottom:4px; width:98%;">
            <span style="font-size:0.9em; font-weight:600; color:#444;">Speed</span>
            <input id="tts-speed" type="range" min="0.7" max="1.3" step="0.05" value="${A}">
            <span id="tts-speed-out" style="font-size:0.9em;">${A.toFixed(2)}×</span>
          </label>
  
          <label class="tts-style-label" style="width:100%; display:flex !important; flex-direction:column !important; align-items:center !important; margin: 2px 0 6px 0;">
             <span style="font-weight:600; margin-bottom:2px; font-size:0.95em;">Speaking Style</span>
             <select id="tts-style" style="width:98%; padding:4px;"><option value="">(neutral)</option></select>
          </label>

          <div class="tts-mixed-row" style="width:98%; display:flex !important; justify-content:space-between !important; align-items:end; gap:8px; margin-bottom:8px;">
             
             <label class="tts-pitch-col" style="flex:1; display:flex; flex-direction:column; gap:2px;">
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; color:#444;">
                   <span>Pitch</span>
                   <span id="tts-pitch-out" style="color:#0078d7;">${H}</span>
                </div>
                <input id="tts-pitch" type="range" min="-12" max="12" step="1" value="${H}" style="width:100%; cursor:pointer;">
             </label>

             <label class="tts-degree-col" style="width:70px; display:flex; flex-direction:column; gap:2px;">
                <span style="font-size:0.85rem; font-weight:600; color:#444; text-align:center;">Degree</span>
                <input id="tts-styledegree" type="number" min="0.1" max="2.5" step="0.1" value="2.5" style="width:100%; padding:3px; text-align:center; border:1px solid #ccc; border-radius:6px;">
             </label>

          </div>
  
          <button id="tts-main" class="tts-btn tts-btn--primary"
            title="Click: play/pause • Double-click: restart & play" style="width:98%; margin-bottom:8px; padding: 8px;">🔊 Generate & Play</button>
  
          <div class="tts-skip" style="display:flex; justify-content:center; gap:10px; align-items:center;">
            <button id="tts-back" class="tts-btn tts-btn--sm" title="Back 2 seconds">↺ 2s</button>
            
            <a id="tts-download" class="tts-link" href="#" download="lux_tts.mp3" title="Download audio" style="font-size:1.4rem; line-height:1; text-decoration:none;">⬇️</a>
            
            <button id="tts-fwd"  class="tts-btn tts-btn--sm" title="Forward 2 seconds">↻ 2s</button>
          </div>
  
        </div>
      </div>
    `;const a=e.querySelector(".tts-compact");a&&Object.assign(a.style,{display:"flex",flexDirection:"column",alignItems:"center"})}const nt=e=>!e.paused&&!e.ended&&e.currentTime>0;function st(e,t){if(!e||!t)return()=>{};let a=0;const s=d=>Math.max(0,Math.min(1,d));function i(d){t.style.width=`${s(d)*100}%`}function o(){const d=e.duration||0,y=e.currentTime||0,m=d>0?y/d:0;i(m),a=requestAnimationFrame(o)}function c(){cancelAnimationFrame(a),a=requestAnimationFrame(o)}function b(){cancelAnimationFrame(a),a=0}return e.addEventListener("play",c),e.addEventListener("pause",b),e.addEventListener("ended",()=>{b(),i(1)}),e.addEventListener("timeupdate",()=>{const d=e.duration||0,y=e.currentTime||0,m=d>0?y/d:0;i(m)}),i(0),()=>b()}async function it(e){var O;const t=e||document.getElementById("tts-controls");if(!t)return;const a=document.getElementById("lux-tts-guard-style");a&&a.remove(),t.dataset.luxHidden="0",t.removeAttribute("data-luxHidden"),t.style.display="flex",t.style.visibility="visible",t.style.opacity="1",et(t);const s=r(t,"#tts-voice"),i=r(t,"#tts-speed"),o=r(t,"#tts-speed-out"),c=r(t,"#tts-main"),b=r(t,"#tts-back"),d=r(t,"#tts-fwd"),y=r(t,"#tts-download"),m=r(t,"#tts-note"),L=r(t,"#tts-pitch"),V=r(t,"#tts-pitch-out"),g=r(t,"#tts-style"),k=r(t,"#tts-styledegree"),$=t.querySelector("#tts-progress-fill")||t.querySelector(".tts-progress-fill")||t.querySelector(".tts-progress__fill")||t.querySelector("[data-tts-progress-fill]"),n=new Audio;n.preload="auto",n.playbackRate=A,window.luxTTS=Object.assign(window.luxTTS||{},{audioEl:n});const K=st(n,$);let E=await Y();J(g,E,s.value),s.addEventListener("change",()=>J(g,E,s.value));const M=()=>{var u;const l=Number(i.value)||1;o.textContent=l.toFixed(2)+"×",n.playbackRate=l,(u=window.LuxSelfPB)!=null&&u.setRefRate&&window.LuxSelfPB.setRefRate(l)},q=()=>{const l=Number(L.value)||0;V.textContent=String(l)};M(),q(),i.addEventListener("input",M),L.addEventListener("input",q),b.addEventListener("click",()=>{n.currentTime=Math.max(0,n.currentTime-2)}),d.addEventListener("click",()=>{n.currentTime=Math.min(n.duration||1/0,n.currentTime+2)});function f(l){c.textContent=l?"⏸️ Pause (dbl-click = Restart)":"🔊 Generate & Play"}function x(l,u="info"){m&&(m.textContent=l||"",m.className=`tts-note ${u==="warn"?"tts-note--warn":""}`)}let w=null,B=null,N=!1,P=!1;async function C(){var F,D,_;const l=tt();if(!l)return alert("Type or select some text first.");const u=(s==null?void 0:s.value)||G[0].id,S=Number(i.value)||1,h=Math.round((S-1)*100),v=(g==null?void 0:g.value)||"",T=parseFloat((k==null?void 0:k.value)||"1"),U=Number(L.value)||0,j=`${u}|${l}|style:${v}|deg:${T}|rate:${h}|pitch:${U}`;if(j===B&&n.src){(F=window.LuxSelfPB)!=null&&F.setReference&&window.LuxSelfPB.setReference({audioEl:n,meta:{voice:u,style:v,styledegree:T,rate:S,ratePct:h,pitchSt:U}});try{await n.play(),f(!0)}catch{}return}try{const p=await Z({text:l,voice:u,ratePct:h,pitchSt:U,style:v,styledegree:T});if(p._meta){const{styleUsed:R,styleRequested:W,fallback:z,message:I}=p._meta;I?x(I,z?"warn":"info"):z?x(`Style '${W}' unsupported. Playing neutral.`,"warn"):x(R&&R!=="neutral"?`Playing ${u} in '${R}'.`:"")}$&&($.style.width="0%"),w&&URL.revokeObjectURL(w),w=URL.createObjectURL(p),n.src=w,n.playbackRate=S,B=j,y&&(y.href=w,y.download="lux_tts.mp3"),p&&Q(p),(D=window.LuxSelfPB)!=null&&D.setReference&&window.LuxSelfPB.setReference({audioEl:n,meta:{voice:u,style:v,styledegree:T,rate:S,ratePct:h,pitchSt:U}}),await n.play(),f(!0)}catch(p){console.error(p),x(((_=p.meta)==null?void 0:_.message)||"Synthesis failed.","warn"),alert(p.message||"Text-to-speech failed")}}c.addEventListener("dblclick",async l=>{if(l.preventDefault(),P=!0,n.currentTime=0,n.src)try{await n.play(),f(!0)}catch{}else await C()}),c.addEventListener("click",async l=>{l.preventDefault(),!N&&(N=!0,setTimeout(async()=>{if(!P)if(!n.src||n.ended)await C();else if(nt(n))n.pause(),f(!1);else try{await n.play(),f(!0)}catch{}N=!1,P=!1},230))}),n.addEventListener("ended",()=>f(!1)),window.luxTTS=Object.assign(window.luxTTS||{},{stopProgress:K}),(((O=window.luxTTS)==null?void 0:O.nudge)||(()=>{}))(),console.info("[tts-player] azure controls mounted")}export{it as mountTTSPlayer};
//# sourceMappingURL=player-ui-C04Xddjs.js.map
