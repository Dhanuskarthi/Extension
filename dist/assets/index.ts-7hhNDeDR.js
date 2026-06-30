var j=Object.defineProperty;var H=(n,e,t)=>e in n?j(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var p=(n,e,t)=>H(n,typeof e!="symbol"?e+"":e,t);import{Q as y,b as X,M as Q}from"./constants-BVz2GTkz.js";import{g as U,n as A,h as Y,s as $,r as Z,i as J}from"./utils-DEOwL8Qc.js";const ee="modulepreload",te=function(n){return"/"+n},N={},_=function(e,t,o){let i=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const r=document.querySelector("meta[property=csp-nonce]"),a=(r==null?void 0:r.nonce)||(r==null?void 0:r.getAttribute("nonce"));i=Promise.allSettled(t.map(c=>{if(c=te(c),c in N)return;N[c]=!0;const l=c.endsWith(".css"),h=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${h}`))return;const d=document.createElement("link");if(d.rel=l?"stylesheet":ee,l||(d.as="script"),d.crossOrigin="",d.href=c,a&&d.setAttribute("nonce",a),document.head.appendChild(d),l)return new Promise((u,g)=>{d.addEventListener("load",u),d.addEventListener("error",()=>g(new Error(`Unable to preload CSS for ${c}`)))})}))}function s(r){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=r,window.dispatchEvent(a),!a.defaultPrevented)throw r}return i.then(r=>{for(const a of r||[])a.status==="rejected"&&s(a.reason);return e().catch(s)})};function oe(n){const e=se(n);if(!e||e.length<5)return null;const t=re(n);if(t.length<2)return null;const o=ce(n),i=le(e),s=ie(n);return{id:n.getAttribute("data-qorva-id")||U("q"),text:e,choices:t,allowMultiple:o,meta:{lang:i,source:"auto",hasAudioContext:s.hasAudio,audioUrl:s.audioUrl,hasImageContext:s.hasImage,imageUrl:s.imageUrl}}}function ie(n){const e=n.closest(".question-group-wrapper");if(!e)return{hasAudio:!1};const t={hasAudio:!1},o=[".context-audio audio source",".context-audio source","audio source",".plyr audio source"];for(const s of o){const r=e.querySelector(s);if(r!=null&&r.src){t.hasAudio=!0,t.audioUrl=r.src;break}}if(!t.hasAudio){const s=e.querySelector("audio");s!=null&&s.src&&(t.hasAudio=!0,t.audioUrl=s.src)}const i=[".context-image img",".context-content img","img.lazyel","img[data-src]"];for(const s of i){const r=e.querySelector(s);if(r!=null&&r.src&&!r.src.includes("data:")){t.hasImage=!0,t.imageUrl=r.src;break}}return t}function se(n){for(const o of y.questionText){const i=n.querySelector(o);if(i){const s=V(i.textContent||"");if(s.length>5)return s}}const t=document.createTreeWalker(n,NodeFilter.SHOW_TEXT,{acceptNode:o=>{var r;if((((r=o.textContent)==null?void 0:r.trim())||"").length<10)return NodeFilter.FILTER_SKIP;const s=o.parentElement;return s&&ue(s)?NodeFilter.FILTER_SKIP:NodeFilter.FILTER_ACCEPT}}).nextNode();return t!=null&&t.textContent?V(t.textContent):""}function re(n){const e=[],t=new Set,o=y.choices.join(", "),i=n.querySelectorAll(o);for(const s of i){if(de(s))continue;const r=ae(s),a=A(r);!r||r.length<1||t.has(a)||r.length>500||(t.add(a),e.push(r.trim()))}return e.length<2?ne(n):e}function ne(n){const e=[],t=n.querySelectorAll('input[type="radio"], input[type="checkbox"]');for(const o of t){if(o.classList.contains("sr-only")||o.classList.contains("hidden")||o.hasAttribute("aria-hidden")||o.value==="-1"||o.id.includes("answer-1"))continue;const i=B(o);if(i){const s=F(i.textContent||"");s&&s.length>0&&!e.includes(s)&&e.push(s)}}return e}function B(n){if(n.id){const i=document.querySelector(`label[for="${n.id}"]`);if(i)return i}const e=n.closest("label");if(e)return e;const t=n.nextElementSibling;if((t==null?void 0:t.tagName)==="LABEL")return t;const o=n.parentElement;if(o){const i=o.querySelectorAll("label");for(const s of i)if(!s.hasAttribute("for")||s.getAttribute("for")===n.id)return s}return null}function ae(n){if(n.tagName==="LABEL"){const e=n.cloneNode(!0);return e.querySelectorAll("input").forEach(o=>o.remove()),F(e.textContent||"")}return F(n.textContent||"")}function ce(n){var o;if(n.querySelectorAll('input[type="checkbox"]').length>0)return!0;const t=((o=n.textContent)==null?void 0:o.toLowerCase())||"";return!!(t.includes("chọn nhiều")||t.includes("select all")||t.includes("multiple")||t.includes("all that apply"))}function le(n){return/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(n)?"vi":"en"}function de(n){const e=y.questionText.join(", ");return n.matches(e)}function ue(n){const e=y.choices.join(", ");return n.matches(e)||n.closest(e)!==null}function V(n){return n.replace(/^\s*\d+[.):]?\s*/,"").replace(/\s+/g," ").trim()}function F(n){return n.replace(/^[A-Za-z][.):]?\s*/,"").replace(/^\d+[.):]?\s*/,"").replace(/\s+/g," ").trim()}class he{constructor(){p(this,"observer",null);p(this,"detectedQuestions",new Map);p(this,"processedElements",new WeakSet);p(this,"reportedQuestions",new Set);p(this,"callback",null);p(this,"isActive",!1)}start(e){if(this.isActive)return;this.callback=e,this.isActive=!0,this.scanDOM();let t=null;this.observer=new MutationObserver(o=>{t&&clearTimeout(t),t=setTimeout(()=>{this.handleMutations(o),t=null},X.domScanDebounce)}),this.observer.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","data-question","hidden","style"]}),console.log("[QORVA] Quiz detector started")}stop(){this.observer&&(this.observer.disconnect(),this.observer=null),this.isActive=!1,this.detectedQuestions.clear(),this.processedElements=new WeakSet,console.log("[QORVA] Quiz detector stopped")}getQuestions(){return Array.from(this.detectedQuestions.values())}handleMutations(e){let t=!1;for(const o of e){const i=o.target;if(!(i.closest("#qorva-overlay-container")||i.id==="qorva-overlay-container")){for(const s of o.addedNodes)if(s instanceof HTMLElement){if(s.closest("#qorva-overlay-container"))continue;this.scanElement(s).length>0&&(t=!0)}o.type==="attributes"&&o.target instanceof HTMLElement&&this.scanElement(o.target).length>0&&(t=!0)}}if(t&&this.callback){const o=this.getQuestions().filter(i=>!this.reportedQuestions.has(i.id));o.length>0&&(o.forEach(i=>this.reportedQuestions.add(i.id)),this.callback(o))}}scanDOM(){const e=y.containers.join(", "),t=document.querySelectorAll(e);let o=!1;for(const i of t)this.scanElement(i).length>0&&(o=!0);if(this.detectedQuestions.size===0&&this.scanForQuestions(document.body),o&&this.callback){const i=this.getQuestions().filter(s=>!this.reportedQuestions.has(s.id));i.length>0&&(i.forEach(s=>this.reportedQuestions.add(s.id)),this.callback(i))}}scanElement(e){const t=[];if(this.isQuestionContainer(e)){const s=this.processQuestionContainer(e);s&&t.push(s)}const o=y.containers.join(", "),i=e.querySelectorAll(o);for(const s of i){const r=this.processQuestionContainer(s);r&&t.push(r)}return t}scanForQuestions(e){const t=e.querySelectorAll('form, fieldset, [role="group"], .quiz, .test, .exam');for(const o of t)if(!this.processedElements.has(o)){const i=this.processQuestionContainer(o);i&&this.detectedQuestions.set(i.id,i)}}isQuestionContainer(e){const t=y.containers.join(", ");return e.matches(t)}processQuestionContainer(e){const t=e.closest("[data-qorva-id]");if(t&&t!==e||e.querySelector("[data-qorva-id]"))return null;const i=oe(e);if(!i)return null;const s=`${i.text}|${i.choices.join("|")}`,r=Y(s),a=e.getAttribute("data-qorva-hash"),c=e.getAttribute("data-qorva-id");if(a===r&&c&&this.detectedQuestions.has(c))return this.processedElements.add(e),null;c&&(this.detectedQuestions.delete(c),this.reportedQuestions.delete(c));const l=U("q");e.setAttribute("data-qorva-id",l),e.setAttribute("data-qorva-hash",r);const h={id:l,element:e,question:i};return this.detectedQuestions.set(l,h),this.processedElements.add(e),h}isRunning(){return this.isActive}rescan(){this.processedElements=new WeakSet,this.detectedQuestions.clear(),this.scanDOM()}}const w=new he;async function pe(n,e,t){const o=ge(n);if(o.length===0)return{success:!1,selectedIndices:[],error:"No choice elements found"};let i=Array.isArray(e.answer_index)?e.answer_index:[e.answer_index];i=i.map(a=>typeof a!="number"||isNaN(a)||a<0?0:a>=o.length?o.length-1:a),i=[...new Set(i)];const s=[],r=[];for(const a of i){s.length>0&&await $(Z(t.delayMin,t.delayMax));const c=o[a],l=await fe(c);l.success?s.push(a):r.push(l.error||`Failed to select index ${a}`)}return{success:s.length>0,selectedIndices:s,error:r.length>0?r.join("; "):void 0}}function ge(n){var s,r;const e=[],t=n.querySelectorAll('input[type="radio"], input[type="checkbox"]');if(t.length>0){for(const a of t){if(a.classList.contains("sr-only")||a.classList.contains("hidden")||a.hasAttribute("aria-hidden")||a.value==="-1"||a.id.includes("answer-1"))continue;const c=B(a);e.push({input:a,label:c||void 0,text:((s=c==null?void 0:c.textContent)==null?void 0:s.trim())||""})}return e}const o=y.choices.join(", "),i=n.querySelectorAll(o);for(const a of i){if(ve(a))continue;const c=((r=a.textContent)==null?void 0:r.trim())||"";if(c.length<1||c.length>500)continue;const l=a.querySelector("input")||(a.tagName==="LABEL"&&a.getAttribute("for")?document.getElementById(a.getAttribute("for")):null);e.push({input:l||void 0,label:a.tagName==="LABEL"?a:void 0,element:a,text:c})}return e}async function fe(n){try{if(n.label&&(n.label.click(),n.input&&n.input.checked))return M(n.label),{success:!0};if(n.input){if(n.input.click(),n.input.checked)return M(n.input),{success:!0};if(n.input.checked=!0,me(n.input),n.input.checked)return M(n.input),{success:!0}}if(n.element&&n.element!==n.label){n.element.click(),await $(50);const e=n.element.querySelector("input");if(e!=null&&e.checked)return M(n.element),{success:!0}}return{success:!1,error:"All selection strategies failed"}}catch(e){return{success:!1,error:e instanceof Error?e.message:"Selection error"}}}function me(n){n.dispatchEvent(new Event("input",{bubbles:!0})),n.dispatchEvent(new Event("change",{bubbles:!0})),n.dispatchEvent(new MouseEvent("click",{bubbles:!0}))}function M(n){n.setAttribute("data-qorva-selected","true"),n.style.outline="2px solid #4CAF50",n.style.outlineOffset="2px",setTimeout(()=>{n.style.outline="",n.style.outlineOffset=""},2e3)}function ve(n){const e=y.questionText.join(", ");return n.matches(e)}async function be(n){const e=document.body,t=qe(e);if(!t)return{success:!1,buttonFound:!1,error:"No submit button found"};try{return t.hasAttribute("disabled")||t.classList.contains("disabled")?{success:!1,buttonFound:!0,error:"Submit button is disabled"}:(xe(t),await $(300),t.click(),t.dispatchEvent(new MouseEvent("click",{bubbles:!0})),{success:!0,buttonFound:!0})}catch(o){return{success:!1,buttonFound:!0,error:o instanceof Error?o.message:"Submit failed"}}}function W(n){const e=["back","prev","quay lai","truoc","return"],t=A(n.textContent||""),o=A(n.id||""),i=A(n.className||""),s=A(n.getAttribute("name")||""),r=A(n.getAttribute("aria-label")||""),a=`${t} ${o} ${i} ${s} ${r}`;return e.some(c=>a.includes(c))}function qe(n){var o;for(const i of y.submit){const s=n.querySelectorAll(i);for(const r of s)if(D(r)&&!W(r)){if(i==='[role="button"]'){const a=A(r.textContent||"");if(!["next","submit","tiep","nop","continue","gui","xac nhan","hoan thanh","finish","done"].some(l=>a.includes(l)))continue}return r}}const e=n.querySelectorAll('button, input[type="submit"], [role="button"], a.btn'),t=["submit","nộp","hoàn thành","finish","done","complete","gửi","xác nhận","confirm","next","tiếp tục"];for(const i of e){const s=((o=i.textContent)==null?void 0:o.toLowerCase().trim())||"";if(t.some(r=>s.includes(r))&&D(i)&&!W(i))return i}return null}function D(n){const e=window.getComputedStyle(n);if(e.display==="none"||e.visibility==="hidden"||n.hasAttribute("disabled"))return!1;const t=n.getBoundingClientRect();return!(t.width<10||t.height<10)}function xe(n){const e=n.style.outline,t=n.style.outlineOffset;n.style.outline="3px solid #FF9800",n.style.outlineOffset="2px",setTimeout(()=>{n.style.outline=e,n.style.outlineOffset=t},1e3)}function ye(n){const e=document.body,t=y.containers.join(", "),o=e.querySelectorAll(t);if(o.length===0){const i=e.querySelectorAll('input[type="radio"], input[type="checkbox"]');if(i.length===0)return!0;const s=new Map;for(const r of i){const a=r.name||"default";s.has(a)||s.set(a,[]),s.get(a).push(r)}for(const[,r]of s)if(!r.some(a=>a.checked))return!1;return!0}for(const i of o){const s=i.querySelectorAll('input[type="radio"], input[type="checkbox"]');if(s.length>0&&!Array.from(s).some(a=>a.checked))return!1}return!0}class we{constructor(){p(this,"container",null);p(this,"transcribeContainer",null);p(this,"quizCards",new Map);p(this,"audioCard",null);p(this,"errorState",{lastError:"",count:0,lastTime:0});p(this,"maxErrorsShown",1);p(this,"errorDismissTimeout",5e3);p(this,"controlWidget",null);p(this,"settingsModal",null);p(this,"transcripts",new Map)}init(){this.container||(this.container=document.createElement("div"),this.container.id="qorva-overlay-container",this.container.setAttribute("aria-live","polite"),this.transcribeContainer=document.createElement("div"),this.transcribeContainer.id="qorva-transcribe-container",this.injectStyles(),document.body.appendChild(this.container),document.body.appendChild(this.transcribeContainer),this.createControlWidget(),console.log("[QORVA] Overlay manager initialized"))}showQuizCard(e,t){if(this.init(),t.status==="error"&&!this.shouldShowError(t.errorMessage||""))return;let o=this.quizCards.get(e);o||(o=this.createQuizCard(e),this.quizCards.set(e,o),this.container.appendChild(o)),this.updateQuizCard(o,t),t.status==="error"&&setTimeout(()=>this.removeQuizCard(e),this.errorDismissTimeout)}shouldShowError(e){const t=Date.now();if(e.toLowerCase().includes("api")||e.toLowerCase().includes("key")||e.toLowerCase().includes("model"))if(this.errorState.lastError===e&&t-this.errorState.lastTime<3e4){if(this.errorState.count++,this.errorState.count>this.maxErrorsShown)return!1}else this.errorState={lastError:e,count:1,lastTime:t};return!0}removeQuizCard(e){const t=this.quizCards.get(e);t&&(t.remove(),this.quizCards.delete(e))}showQuotaExhaustedModal(){var t,o,i;if(this.init(),!this.container||document.querySelector(".qorva-quota-modal"))return;const e=document.createElement("div");e.className="qorva-card qorva-quota-modal",e.innerHTML=`
      <div class="qorva-card-header">
        <span class="qorva-icon">⚠️</span>
        <span class="qorva-title" style="color: #f59e0b;">API Quota Exhausted</span>
        <button class="qorva-close" aria-label="Close">✕</button>
      </div>
      <div class="qorva-body" style="text-align: center;">
        <p style="margin: 0 0 12px; font-size: 12px; color: rgba(255,255,255,0.7);">
          All your API keys have reached their daily limit.
        </p>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button class="qorva-quota-settings" style="
            padding: 6px 12px;
            background: #a78bfa;
            border: none;
            border-radius: 6px;
            color: #fff;
            cursor: pointer;
            font-size: 11px;
          ">⚙️ Add More Keys</button>
          <button class="qorva-quota-dismiss" style="
            padding: 6px 12px;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            color: #fff;
            cursor: pointer;
            font-size: 11px;
          ">Wait for Reset</button>
        </div>
        <p style="margin: 12px 0 0; font-size: 10px; color: rgba(255,255,255,0.4);">
          Free tier resets daily at midnight.
        </p>
      </div>
    `,this.container.appendChild(e),requestAnimationFrame(()=>e.classList.add("qorva-visible")),(t=e.querySelector(".qorva-close"))==null||t.addEventListener("click",()=>e.remove()),(o=e.querySelector(".qorva-quota-dismiss"))==null||o.addEventListener("click",()=>e.remove()),(i=e.querySelector(".qorva-quota-settings"))==null||i.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_OPTIONS"}),e.remove()})}showTranscribeResult(e,t){var i;if(this.init(),!this.transcribeContainer)return;const o=document.createElement("div");o.className="qorva-transcribe-card",o.setAttribute("data-question-id",e),o.innerHTML=`
      <div class="qorva-transcribe-header">
        🎤 <span>Transcript</span>
        <button class="qorva-transcribe-close">✕</button>
      </div>
      <div class="qorva-transcribe-text">${t}</div>
    `,(i=o.querySelector(".qorva-transcribe-close"))==null||i.addEventListener("click",()=>{o.remove()}),this.transcribeContainer.appendChild(o),requestAnimationFrame(()=>{o.classList.add("qorva-visible")}),setTimeout(()=>{o.parentElement&&o.remove()},3e4)}showAudioCard(e){this.init(),this.audioCard||(this.audioCard=this.createAudioCard(),this.container.appendChild(this.audioCard)),this.updateAudioCard(e)}hideAudioCard(){this.audioCard&&this.audioCard.classList.remove("qorva-visible")}createQuizCard(e){var s;const t=document.createElement("div");t.className="qorva-card qorva-quiz-card",t.setAttribute("data-card-id",e);const o=e.match(/(\d+)$/),i=o?`Q.${o[1]}`:"Q";return t.innerHTML=`
      <div class="qorva-card-header">
        <span class="qorva-icon">⚡</span>
        <span class="qorva-title">siuuuuu</span>
        <span class="qorva-question-num">${i}</span>
        <button class="qorva-close" aria-label="Close">✕</button>
      </div>
      <div class="qorva-body">
        <div class="qorva-loader"></div>
      </div>
    `,(s=t.querySelector(".qorva-close"))==null||s.addEventListener("click",()=>{this.removeQuizCard(e)}),t}updateQuizCard(e,t){var i,s;const o=e.querySelector(".qorva-body");if(o){if(t.status==="loading")o.innerHTML='<div class="qorva-loader"></div>';else if(t.status==="error"){const r=this.truncateError(t.errorMessage||"Error");o.innerHTML=`<div class="qorva-error-msg">❌ ${r}</div>`}else if(t.status==="success"&&t.answer){const r=t.question.choices.length;let a=Array.isArray(t.answer.answer_index)?t.answer.answer_index:[t.answer.answer_index];a=a.map(q=>typeof q!="number"||isNaN(q)||q<0?0:q>=r?r-1:q),a=[...new Set(a)];const c=a.map(q=>{const m=String.fromCharCode(65+q);let v=t.question.choices[q]||"";return v=v.replace(/^[A-Z]\.\s*/,""),v.length>60&&(v=v.substring(0,60)),`<span class="qorva-badge">${m}. ${v}</span>`}).join(""),l=t.answer.explanation&&t.answer.explanation.length>0,h=(i=t.question.meta)==null?void 0:i.hasAudioContext,d=(s=t.question.meta)==null?void 0:s.audioUrl;let u="";h&&d?u=`
          <div class="qorva-audio-indicator">
            🎧 <small>Listening Question</small>
            <button class="qorva-transcribe-btn" data-audio-url="${d}">
              🎤 Transcribe
            </button>
          </div>
        `:h&&(u='<div class="qorva-audio-indicator">🎧 <small>Listening</small></div>');let g="";l&&(g=`<p class="qorva-explanation">${t.answer.explanation}</p>`),o.innerHTML=`
        ${u}
        <div class="qorva-answers">${c}</div>
        ${g}
      `;const b=o.querySelector(".qorva-transcribe-btn");b&&b.addEventListener("click",q=>{q.preventDefault();const m=b.dataset.audioUrl;m&&this.handleTranscribeClick(m,t.question.id)})}e.classList.add("qorva-visible")}}async handleTranscribeClick(e,t){var a,c;try{const l=await chrome.runtime.sendMessage({type:"CFG_GET"});if(l!=null&&l.ok&&l.data){const h=l.data;if(!((a=h.pro)!=null&&a.isPro)&&!((c=h.pro)!=null&&c.devMode)){this.showToast("🔒 Audio transcription requires PRO"),chrome.runtime.sendMessage({type:"OPEN_OPTIONS"});return}}}catch(l){console.error("[QORVA] Failed to check PRO status:",l)}const{transcribeFromUrl:o,getWhisperStatus:i}=await _(async()=>{const{transcribeFromUrl:l,getWhisperStatus:h}=await import("./whisper-UjthEDOh.js");return{transcribeFromUrl:l,getWhisperStatus:h}},[]);i()==="unloaded"?this.showToast("🔄 Loading Whisper model... (First time: ~40MB download)"):this.showToast("🎤 Transcribing audio..."),console.log("[QORVA] Transcribe requested for:",e,"Question:",t);const r=await o(e,l=>{l.status==="loading"?this.showToast(`📥 ${l.message||"Loading model..."}`):l.status==="transcribing"?this.showToast(`🎤 ${l.message||"Transcribing..."}`):l.status==="error"&&this.showToast(`❌ ${l.message||"Transcription failed"}`)});r&&r.text?(console.log("[QORVA] Transcription result:",r.text),this.showToast("✅ Transcription complete!"),this.storeTranscript(t,r.text),this.showTranscribeResult(t,r.text)):this.showToast("❌ Transcription failed. Check console for details.")}storeTranscript(e,t){this.transcripts.set(e,t),console.log("[QORVA] Transcript stored for question:",e)}getTranscript(e){return this.transcripts.get(e)}truncateError(e){return e.length>60?e.substring(0,57)+"...":e}createAudioCard(){var t;const e=document.createElement("div");return e.className="qorva-card qorva-audio-card",e.innerHTML=`
      <div class="qorva-card-header">
        <span class="qorva-icon">🎤</span>
        <span class="qorva-title">Audio QA</span>
        <button class="qorva-close" aria-label="Close">✕</button>
      </div>
      <div class="qorva-body">
        <div class="qorva-transcript"></div>
        <div class="qorva-answer-section"></div>
      </div>
    `,(t=e.querySelector(".qorva-close"))==null||t.addEventListener("click",()=>{this.hideAudioCard()}),e}updateAudioCard(e){if(!this.audioCard)return;const t=this.audioCard.querySelector(".qorva-transcript"),o=this.audioCard.querySelector(".qorva-answer-section");if(t&&(t.innerHTML=e.transcript?`<p class="qorva-transcript-text">"${e.transcript}"</p>`:""),o)switch(e.status){case"listening":o.innerHTML='<span class="qorva-status">🎙️ Listening...</span>';break;case"processing":o.innerHTML='<div class="qorva-loader"></div>';break;case"ready":e.answer&&(o.innerHTML=`<div class="qorva-answer-text">${e.answer.answer}</div>`);break;case"error":o.innerHTML=`<div class="qorva-error-msg">❌ ${e.errorMessage}</div>`,setTimeout(()=>this.hideAudioCard(),this.errorDismissTimeout);break}this.audioCard.classList.add("qorva-visible")}showToast(e,t=2e3){var i;this.init(),(i=this.container)==null||i.querySelectorAll(".qorva-toast").forEach(s=>s.remove());const o=document.createElement("div");o.className="qorva-toast",o.textContent=e,this.container.appendChild(o),requestAnimationFrame(()=>{o.classList.add("qorva-visible")}),setTimeout(()=>{o.classList.remove("qorva-visible"),setTimeout(()=>o.remove(),300)},t)}injectStyles(){if(document.getElementById("qorva-styles"))return;const e=document.createElement("style");e.id="qorva-styles",e.textContent=`
      #qorva-overlay-container {
        position: fixed;
        top: 12px;
        right: 12px;
        bottom: 12px;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
        pointer-events: none;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        overflow-y: auto;
        max-height: calc(100vh - 24px);
        padding-right: 2px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.2) transparent;
      }
      
      #qorva-overlay-container::-webkit-scrollbar {
        width: 4px;
      }
      
      #qorva-overlay-container::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.2);
        border-radius: 2px;
      }
      
      #qorva-transcribe-container {
        position: fixed;
        top: 12px;
        left: 12px;
        bottom: 12px;
        z-index: 2147483646;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        max-width: 350px;
        overflow-y: auto;
        max-height: calc(100vh - 24px);
      }
      
      .qorva-transcribe-card {
        pointer-events: auto;
        background: rgba(15, 25, 35, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(100, 200, 255, 0.2);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 100, 200, 0.2);
        padding: 12px;
        color: #fff;
        opacity: 0;
        transform: translateX(-12px);
        transition: all 0.25s ease;
      }
      
      .qorva-transcribe-card.qorva-visible {
        opacity: 1;
        transform: translateX(0);
      }
      
      .qorva-transcribe-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-weight: 600;
        font-size: 12px;
        color: #60a5fa;
      }
      
      .qorva-transcribe-text {
        font-size: 12px;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.9);
        max-height: 150px;
        overflow-y: auto;
      }
      
      .qorva-transcribe-close {
        margin-left: auto;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.5);
        cursor: pointer;
        font-size: 14px;
        padding: 2px 6px;
        border-radius: 4px;
      }
      
      .qorva-transcribe-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .qorva-card {
        pointer-events: auto;
        background: rgba(15, 15, 25, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
        min-width: 240px;
        max-width: 320px;
        opacity: 0;
        transform: translateX(12px) scale(0.95);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        color: #fff;
        overflow: visible;
        flex-shrink: 0;
      }
      
      .qorva-card.qorva-visible {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      
      .qorva-card-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.03);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .qorva-icon { font-size: 14px; }
      
      .qorva-title {
        flex: 1;
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #a78bfa;
      }
      
      .qorva-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.4);
        cursor: pointer;
        padding: 2px 6px;
        font-size: 12px;
        border-radius: 4px;
        transition: all 0.15s;
      }
      
      .qorva-close:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }
      
      .qorva-question-num {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        margin-left: auto;
        margin-right: 8px;
        font-weight: 500;
      }
      
      .qorva-body {
        padding: 10px;
        min-height: 32px;
        display: block;
      }
      
      .qorva-loader {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(167, 139, 250, 0.2);
        border-top-color: #a78bfa;
        border-radius: 50%;
        animation: qorva-spin 0.7s linear infinite;
        margin: 4px auto;
      }
      
      @keyframes qorva-spin {
        to { transform: rotate(360deg); }
      }
      
      .qorva-answers {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .qorva-badge {
        display: block;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        padding: 6px 10px;
        border-radius: 6px;
        font-weight: 500;
        font-size: 12px;
        line-height: 1.3;
      }
      
      .qorva-error-msg {
        color: #f87171;
        font-size: 12px;
        text-align: center;
        padding: 4px;
      }
      
      .qorva-status {
        color: #4ade80;
        font-size: 12px;
      }

      .qorva-transcribe-btn  {
        border-radius: 6px;
      }
      
      .qorva-transcript-text {
        font-style: italic;
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
        margin-bottom: 8px;
      }
      
      .qorva-answer-text {
        font-size: 13px;
        line-height: 1.5;
      }
      
      .qorva-explanation-wrapper {
        margin-top: 10px;
      }
      
      .qorva-explanation-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 8px 10px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 11px;
        cursor: pointer;
        transition: all 0.15s;
      }
      
      .qorva-explanation-toggle:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #ffffff;
      }
      
      .qorva-toggle-icon {
        font-size: 10px;
      }
      
      .qorva-explanation-content {
        overflow: hidden;
        transition: max-height 0.25s ease, opacity 0.2s ease;
      }
      
      .qorva-explanation-wrapper[data-collapsed="true"] .qorva-explanation-content {
        max-height: 0;
        opacity: 0;
      }
      
      .qorva-explanation-wrapper[data-collapsed="false"] .qorva-explanation-content {
        max-height: 500px;
        opacity: 1;
      }
      
      .qorva-explanation {
        color: #ffffff;
        font-size: 12px;
        line-height: 1.5;
        margin: 8px 0 0 0;
        padding: 10px 12px;
        background: #1e293b;
        border-radius: 6px;
        border: 1px solid #475569;
      }
      
      .qorva-explanation:empty {
        display: none;
      }
      
      .qorva-toast {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%) translateY(8px);
        background: rgba(15, 15, 25, 0.95);
        backdrop-filter: blur(12px);
        color: #fff;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        opacity: 0;
        transition: all 0.2s ease;
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .qorva-toast.qorva-visible {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      
      /* In-page Floating Control Widget */
      .qorva-control-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
        pointer-events: auto;
      }
      
      .qorva-fab {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        outline: none;
      }
      
      .qorva-fab:hover {
        transform: scale(1.08) rotate(15deg);
        box-shadow: 0 6px 20px rgba(139, 92, 246, 0.6);
      }
      
      .qorva-menu {
        position: absolute;
        bottom: 54px;
        right: 0;
        display: flex;
        flex-direction: column;
        gap: 6px;
        opacity: 0;
        transform: translateY(10px) scale(0.9);
        pointer-events: none;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        background: rgba(15, 15, 25, 0.95);
        backdrop-filter: blur(12px);
        padding: 8px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        min-width: 140px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      }
      
      .qorva-menu-open .qorva-menu {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      
      .qorva-menu-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.85);
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s ease;
        white-space: nowrap;
      }
      
      .qorva-menu-item:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
        transform: translateX(-2px);
      }
      
      .qorva-menu-item.qorva-active {
        background: rgba(139, 92, 246, 0.2);
        border-color: rgba(139, 92, 246, 0.4);
        color: #c084fc;
        font-weight: 500;
      }
      
      /* In-page Settings Modal */
      .qorva-settings-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
        font-family: system-ui, -apple-system, sans-serif;
      }
      
      .qorva-settings-overlay.qorva-settings-open {
        opacity: 1;
        pointer-events: auto;
      }
      
      .qorva-settings-modal {
        background: rgba(20, 20, 30, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        display: flex;
        flex-direction: column;
        transform: translateY(20px) scale(0.95);
        transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        color: #fff;
        max-height: 85vh;
      }
      
      .qorva-settings-overlay.qorva-settings-open .qorva-settings-modal {
        transform: translateY(0) scale(1);
      }
      
      .qorva-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .qorva-settings-header h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #a78bfa;
      }
      
      .qorva-settings-close {
        background: none;
        border: none;
        color: rgba(255,255,255,0.4);
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        transition: color 0.15s;
      }
      
      .qorva-settings-close:hover {
        color: #fff;
      }
      
      .qorva-settings-body {
        padding: 18px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      
      .qorva-form-row {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      
      .qorva-form-row label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: rgba(255, 255, 255, 0.6);
        font-weight: 500;
      }
      
      .qorva-form-row input[type="text"],
      .qorva-form-row input[type="password"],
      .qorva-form-row select {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 8px;
        color: #fff;
        padding: 8px 10px;
        font-size: 13px;
        outline: none;
        transition: border-color 0.15s;
      }
      
      .qorva-form-row input:focus,
      .qorva-form-row select:focus {
        border-color: #a78bfa;
      }
      
      .qorva-checkbox-row label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        text-transform: none;
        color: rgba(255,255,255,0.85);
        cursor: pointer;
      }
      
      .qorva-checkbox-row input[type="checkbox"] {
        accent-color: #a78bfa;
        cursor: pointer;
      }
      
      .qorva-provider-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 10px;
        padding: 10px;
        border: 1px dashed rgba(255, 255, 255, 0.08);
      }
      
      .qorva-hidden {
        display: none !important;
      }
      
      .qorva-settings-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 18px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
      }
      
      .qorva-settings-btn-cancel {
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.15s;
      }
      
      .qorva-settings-btn-cancel:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .qorva-settings-btn-save {
        background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
        border: none;
        color: #fff;
        padding: 8px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        transition: box-shadow 0.15s;
      }
      
      .qorva-settings-btn-save:hover {
        box-shadow: 0 0 12px rgba(139, 92, 246, 0.4);
      }
    `,document.head.appendChild(e)}createControlWidget(){var i,s;if(this.controlWidget)return;this.controlWidget=document.createElement("div"),this.controlWidget.id="qorva-control-widget",this.controlWidget.className="qorva-control-widget",this.controlWidget.innerHTML=`
      <button class="qorva-fab" title="siuuuuu Control Panel">⚡</button>
      <div class="qorva-menu">
        <button class="qorva-menu-item qorva-btn-rescan" title="Rescan Questions">🔍 Rescan</button>
        <button class="qorva-menu-item qorva-btn-toggle-quiz" title="Toggle Auto-Click">📝 Quiz: ON</button>
        <button class="qorva-menu-item qorva-btn-toggle-audio" title="Toggle Voice QA">🎤 Voice: OFF</button>
        <button class="qorva-menu-item qorva-btn-settings" title="In-Page Settings">⚙️ Settings</button>
      </div>
    `,document.body.appendChild(this.controlWidget),this.controlWidget.querySelector(".qorva-fab").addEventListener("click",r=>{r.stopPropagation(),this.controlWidget.classList.toggle("qorva-menu-open")}),document.addEventListener("click",()=>{this.controlWidget&&this.controlWidget.classList.remove("qorva-menu-open")}),(i=this.controlWidget.querySelector(".qorva-btn-rescan"))==null||i.addEventListener("click",r=>{r.stopPropagation(),this.showToast("🔍 Rescanning DOM..."),w.rescan(),this.controlWidget.classList.remove("qorva-menu-open")});const t=this.controlWidget.querySelector(".qorva-btn-toggle-quiz"),o=this.controlWidget.querySelector(".qorva-btn-toggle-audio");this.updateWidgetStates(),t==null||t.addEventListener("click",async r=>{r.stopPropagation();try{const a=await chrome.runtime.sendMessage({type:"CFG_GET"});if(a!=null&&a.ok&&a.data){const c=a.data;c.quiz.auto=!c.quiz.auto,await chrome.runtime.sendMessage({type:"CFG_SET",payload:c}),this.showToast(`Quiz automation ${c.quiz.auto?"ON":"OFF"}`),this.updateWidgetStates()}}catch(a){console.error(a)}}),o==null||o.addEventListener("click",async r=>{var a,c;r.stopPropagation();try{const l=await chrome.runtime.sendMessage({type:"CFG_GET"});if(l!=null&&l.ok&&l.data){const h=l.data;if(!((a=h.pro)!=null&&a.isPro)&&!((c=h.pro)!=null&&c.devMode)&&!h.audio.enabled){this.showToast("🔒 Audio QA requires PRO"),this.showInPageSettings();return}h.audio.enabled=!h.audio.enabled,await chrome.runtime.sendMessage({type:"CFG_SET",payload:h}),this.showToast(`Audio QA ${h.audio.enabled?"ON":"OFF"}`),this.updateWidgetStates()}}catch(l){console.error(l)}}),(s=this.controlWidget.querySelector(".qorva-btn-settings"))==null||s.addEventListener("click",r=>{r.stopPropagation(),this.showInPageSettings(),this.controlWidget.classList.remove("qorva-menu-open")})}async updateWidgetStates(){if(this.controlWidget)try{const e=await chrome.runtime.sendMessage({type:"CFG_GET"});if(e!=null&&e.ok&&e.data){const t=e.data,o=this.controlWidget.querySelector(".qorva-btn-toggle-quiz"),i=this.controlWidget.querySelector(".qorva-btn-toggle-audio");o&&(o.textContent=`📝 Quiz: ${t.quiz.auto?"ON":"OFF"}`,o.classList.toggle("qorva-active",t.quiz.auto)),i&&(i.textContent=`🎤 Voice: ${t.audio.enabled?"ON":"OFF"}`,i.classList.toggle("qorva-active",t.audio.enabled))}}catch(e){console.error("[QORVA] Error updating widget states:",e)}}async showInPageSettings(){var e,t,o,i,s,r,a,c,l,h;this.init(),this.settingsModal&&this.settingsModal.remove();try{const d=await chrome.runtime.sendMessage({type:"CFG_GET"});if(!(d!=null&&d.ok)||!d.data){this.showToast("❌ Failed to load settings");return}const u=d.data;this.settingsModal=document.createElement("div"),this.settingsModal.id="qorva-inpage-settings",this.settingsModal.className="qorva-settings-overlay";const g=((e=u.llm.gemini)==null?void 0:e.apiKey)||"",b=((t=u.llm.gemini)==null?void 0:t.model)||"gemini-2.5-flash",q=((o=u.llm.openai)==null?void 0:o.apiKey)||"",m=((i=u.llm.openai)==null?void 0:i.model)||"gpt-4o-mini",v=((s=u.llm.claude)==null?void 0:s.apiKey)||"",S=((r=u.llm.claude)==null?void 0:r.model)||"claude-3-haiku-20240307",k=((a=u.llm.groq)==null?void 0:a.apiKey)||"",E=((c=u.llm.groq)==null?void 0:c.model)||"llama-3.3-70b-versatile";this.settingsModal.innerHTML=`
        <div class="qorva-settings-modal">
          <div class="qorva-settings-header">
            <h3>🤖 siuuuuu Config Panel</h3>
            <button class="qorva-settings-close">✕</button>
          </div>
          <div class="qorva-settings-body">
            <div class="qorva-form-row">
              <label for="qorva-set-provider">AI Provider</label>
              <select id="qorva-set-provider">
                <option value="gemini" ${u.llm.provider==="gemini"?"selected":""}>Gemini (Free)</option>
                <option value="openai" ${u.llm.provider==="openai"?"selected":""}>OpenAI</option>
                <option value="claude" ${u.llm.provider==="claude"?"selected":""}>Claude</option>
                <option value="groq" ${u.llm.provider==="groq"?"selected":""}>Groq</option>
              </select>
            </div>
            
            <div id="qorva-set-gemini-section" class="qorva-provider-section">
              <div class="qorva-form-row">
                <label for="qorva-set-gemini-key">Gemini API Key</label>
                <input type="password" id="qorva-set-gemini-key" value="${g}" placeholder="AIzaSy...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-gemini-model">Gemini Model</label>
                <select id="qorva-set-gemini-model">
                  <option value="gemini-2.5-flash" ${b==="gemini-2.5-flash"?"selected":""}>2.5 Flash</option>
                  <option value="gemini-2.5-flash-lite" ${b==="gemini-2.5-flash-lite"?"selected":""}>2.5 Flash Lite</option>
                  <option value="gemini-2.0-flash" ${b==="gemini-2.0-flash"?"selected":""}>2.0 Flash</option>
                  <option value="gemini-1.5-flash" ${b==="gemini-1.5-flash"?"selected":""}>1.5 Flash</option>
                </select>
              </div>
            </div>
            
            <div id="qorva-set-openai-section" class="qorva-provider-section qorva-hidden">
              <div class="qorva-form-row">
                <label for="qorva-set-openai-key">OpenAI API Key</label>
                <input type="password" id="qorva-set-openai-key" value="${q}" placeholder="sk-...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-openai-model">OpenAI Model</label>
                <select id="qorva-set-openai-model">
                  <option value="gpt-4o-mini" ${m==="gpt-4o-mini"?"selected":""}>GPT-4o Mini</option>
                  <option value="gpt-4o" ${m==="gpt-4o"?"selected":""}>GPT-4o</option>
                </select>
              </div>
            </div>
            
            <div id="qorva-set-claude-section" class="qorva-provider-section qorva-hidden">
              <div class="qorva-form-row">
                <label for="qorva-set-claude-key">Claude API Key</label>
                <input type="password" id="qorva-set-claude-key" value="${v}" placeholder="sk-ant-...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-claude-model">Claude Model</label>
                <select id="qorva-set-claude-model">
                  <option value="claude-3-haiku-20240307" ${S==="claude-3-haiku-20240307"?"selected":""}>Claude 3 Haiku</option>
                  <option value="claude-3-sonnet-20240229" ${S==="claude-3-sonnet-20240229"?"selected":""}>Claude 3 Sonnet</option>
                </select>
              </div>
            </div>
            
            <div id="qorva-set-groq-section" class="qorva-provider-section qorva-hidden">
              <div class="qorva-form-row">
                <label for="qorva-set-groq-key">Groq API Key</label>
                <input type="password" id="qorva-set-groq-key" value="${k}" placeholder="gsk_...">
              </div>
              <div class="qorva-form-row">
                <label for="qorva-set-groq-model">Groq Model</label>
                <select id="qorva-set-groq-model">
                  <option value="llama-3.3-70b-versatile" ${E==="llama-3.3-70b-versatile"?"selected":""}>Llama 3.3 70B</option>
                  <option value="llama-3.1-8b-instant" ${E==="llama-3.1-8b-instant"?"selected":""}>Llama 3.1 8B</option>
                  <option value="mixtral-8x7b-32768" ${E==="mixtral-8x7b-32768"?"selected":""}>Mixtral 8x7B</option>
                  <option value="gemma2-9b-it" ${E==="gemma2-9b-it"?"selected":""}>Gemma 2 9B</option>
                </select>
              </div>
            </div>
            
            <div class="qorva-form-row qorva-checkbox-row">
              <label>
                <input type="checkbox" id="qorva-set-quiz-auto" ${u.quiz.auto?"checked":""}>
                Auto-detect & answer questions
              </label>
            </div>
            
            <div class="qorva-form-row qorva-checkbox-row">
              <label>
                <input type="checkbox" id="qorva-set-audio-enabled" ${u.audio.enabled?"checked":""}>
                Enable Audio/Voice QA (PRO required)
              </label>
            </div>
            
            <div class="qorva-form-row qorva-checkbox-row">
              <label>
                <input type="checkbox" id="qorva-set-show-exp" ${u.ui.showExplanation?"checked":""}>
                Show explanations
              </label>
            </div>
          </div>
          
          <div class="qorva-settings-footer">
            <button class="qorva-settings-btn-cancel">Cancel</button>
            <button class="qorva-settings-btn-save">💾 Save Settings</button>
          </div>
        </div>
      `,document.body.appendChild(this.settingsModal);const R=this.settingsModal.querySelector("#qorva-set-provider"),K={gemini:this.settingsModal.querySelector("#qorva-set-gemini-section"),openai:this.settingsModal.querySelector("#qorva-set-openai-section"),claude:this.settingsModal.querySelector("#qorva-set-claude-section"),groq:this.settingsModal.querySelector("#qorva-set-groq-section")},P=x=>{Object.entries(K).forEach(([T,z])=>{z&&z.classList.toggle("qorva-hidden",T!==x)})};R.addEventListener("change",()=>{P(R.value)}),P(u.llm.provider),(l=this.settingsModal.querySelector(".qorva-settings-close"))==null||l.addEventListener("click",()=>{var x;(x=this.settingsModal)==null||x.remove()}),(h=this.settingsModal.querySelector(".qorva-settings-btn-cancel"))==null||h.addEventListener("click",()=>{var x;(x=this.settingsModal)==null||x.remove()}),this.settingsModal.querySelector(".qorva-settings-btn-save").addEventListener("click",async()=>{var I;const x=R.value,T={...u,llm:{...u.llm,provider:x,gemini:{...u.llm.gemini,apiKey:this.settingsModal.querySelector("#qorva-set-gemini-key").value.trim(),model:this.settingsModal.querySelector("#qorva-set-gemini-model").value},openai:{...u.llm.openai,apiKey:this.settingsModal.querySelector("#qorva-set-openai-key").value.trim(),model:this.settingsModal.querySelector("#qorva-set-openai-model").value},claude:{...u.llm.claude,apiKey:this.settingsModal.querySelector("#qorva-set-claude-key").value.trim(),model:this.settingsModal.querySelector("#qorva-set-claude-model").value},groq:{...u.llm.groq,apiKey:this.settingsModal.querySelector("#qorva-set-groq-key").value.trim(),model:this.settingsModal.querySelector("#qorva-set-groq-model").value}},quiz:{...u.quiz,auto:this.settingsModal.querySelector("#qorva-set-quiz-auto").checked},audio:{...u.audio,enabled:this.settingsModal.querySelector("#qorva-set-audio-enabled").checked},ui:{...u.ui,showExplanation:this.settingsModal.querySelector("#qorva-set-show-exp").checked}};if(!T.llm[x].apiKey){this.showToast(`❌ Please enter an API key for ${x}`);return}const C=await chrome.runtime.sendMessage({type:"CFG_SET",payload:T});C!=null&&C.ok?(this.showToast("✅ Configuration saved successfully!"),this.updateWidgetStates(),(I=this.settingsModal)==null||I.remove()):this.showToast(`❌ Save failed: ${(C==null?void 0:C.error)||"Unknown error"}`)}),requestAnimationFrame(()=>{var x;(x=this.settingsModal)==null||x.classList.add("qorva-settings-open")})}catch(d){console.error("[QORVA] Error showing in-page settings:",d),this.showToast("❌ Configuration panel error")}}destroy(){var e,t,o,i,s;(e=this.container)==null||e.remove(),this.container=null,(t=this.transcribeContainer)==null||t.remove(),this.transcribeContainer=null,(o=this.controlWidget)==null||o.remove(),this.controlWidget=null,(i=this.settingsModal)==null||i.remove(),this.settingsModal=null,this.quizCards.clear(),this.audioCard=null,(s=document.getElementById("qorva-styles"))==null||s.remove()}resetErrorState(){this.errorState={lastError:"",count:0,lastTime:0}}}const f=new we;class Ae{constructor(){p(this,"stream",null);p(this,"audioContext",null);p(this,"analyser",null);p(this,"mediaRecorder",null);p(this,"isCapturing",!1);p(this,"options",null)}async start(e){var t,o;this.isCapturing&&await this.stop(),this.options=e;try{e.source==="mic"?await this.startMicCapture():await this.requestSystemAudio(),this.isCapturing=!0,console.log(`[QORVA] Audio capture started: ${e.source}`)}catch(i){throw(o=(t=this.options)==null?void 0:t.onError)==null||o.call(t,i instanceof Error?i:new Error("Failed to start capture")),i}}async stop(){var e,t,o;((e=this.mediaRecorder)==null?void 0:e.state)==="recording"&&this.mediaRecorder.stop(),this.stream&&(this.stream.getTracks().forEach(i=>i.stop()),this.stream=null),((t=this.audioContext)==null?void 0:t.state)!=="closed"&&(await((o=this.audioContext)==null?void 0:o.close()),this.audioContext=null),this.analyser=null,this.isCapturing=!1,console.log("[QORVA] Audio capture stopped")}async startMicCapture(){var e;this.stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:!0,noiseSuppression:!0,autoGainControl:!0,sampleRate:((e=this.options)==null?void 0:e.sampleRate)||16e3}}),await this.setupAudioProcessing(this.stream)}async requestSystemAudio(){const e=await chrome.runtime.sendMessage({type:"OFFSCREEN_AUDIO_CAPTURE",payload:{action:"start"}});if(!(e!=null&&e.ok))throw new Error("Failed to capture system audio");console.log("[QORVA] System audio capture requested")}async setupAudioProcessing(e){var i;this.audioContext=new AudioContext({sampleRate:((i=this.options)==null?void 0:i.sampleRate)||16e3});const t=this.audioContext.createMediaStreamSource(e);this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=2048,t.connect(this.analyser),this.mediaRecorder=new MediaRecorder(e,{mimeType:"audio/webm;codecs=opus"});const o=[];this.mediaRecorder.ondataavailable=s=>{s.data.size>0&&o.push(s.data)},this.mediaRecorder.onstop=()=>{var r,a;const s=new Blob(o,{type:"audio/webm"});(a=(r=this.options)==null?void 0:r.onSpeechEnd)==null||a.call(r,s),o.length=0},this.startAudioMonitoring()}startAudioMonitoring(){if(!this.analyser||!this.audioContext)return;const e=new Float32Array(this.analyser.frequencyBinCount);let t=!1;const o=-50;let i=0;const s=30,r=()=>{var h,d,u,g,b,q;if(!this.isCapturing||!this.analyser)return;this.analyser.getFloatTimeDomainData(e);let a=0;for(let m=0;m<e.length;m++)a+=e[m]*e[m];const c=Math.sqrt(a/e.length),l=20*Math.log10(c);(d=(h=this.options)==null?void 0:h.onAudioData)==null||d.call(h,e),l>o?(i=0,t||(t=!0,(g=(u=this.options)==null?void 0:u.onSpeechStart)==null||g.call(u),((b=this.mediaRecorder)==null?void 0:b.state)==="inactive"&&this.mediaRecorder.start())):(i++,t&&i>s&&(t=!1,((q=this.mediaRecorder)==null?void 0:q.state)==="recording"&&this.mediaRecorder.stop())),requestAnimationFrame(r)};r()}startRecording(){var e,t,o;((e=this.mediaRecorder)==null?void 0:e.state)==="inactive"&&(this.mediaRecorder.start(),(o=(t=this.options)==null?void 0:t.onSpeechStart)==null||o.call(t))}stopRecording(){var e;((e=this.mediaRecorder)==null?void 0:e.state)==="recording"&&this.mediaRecorder.stop()}isActive(){return this.isCapturing}getAudioLevel(){if(!this.analyser)return 0;const e=new Float32Array(this.analyser.frequencyBinCount);this.analyser.getFloatTimeDomainData(e);let t=0;for(let o=0;o<e.length;o++)t+=e[o]*e[o];return Math.sqrt(t/e.length)}async recordAndTranscribe(e=1e4){return new Promise(t=>{const o=[];(async()=>{try{await this.start({source:"mic",sampleRate:16e3,onSpeechEnd:async i=>{o.push(i)},onError:i=>{console.error("[QORVA] Recording error:",i),t(null)}}),this.startRecording(),setTimeout(async()=>{try{if(this.stopRecording(),await this.stop(),o.length===0){t(null);return}const i=new Blob(o,{type:"audio/webm"}),s=await this.transcribeBlob(i);t(s)}catch(i){console.error("[QORVA] Stop/transcribe error:",i),t(null)}},e)}catch(i){console.error("[QORVA] Record and transcribe failed:",i),t(null)}})()})}async transcribeBlob(e){try{const t=await e.arrayBuffer(),o=new AudioContext({sampleRate:16e3}),s=(await o.decodeAudioData(t)).getChannelData(0);await o.close();const{transcribeFromBuffer:r}=await _(async()=>{const{transcribeFromBuffer:c}=await import("./whisper-UjthEDOh.js");return{transcribeFromBuffer:c}},[]),a=await r(s);return(a==null?void 0:a.text)||null}catch(t){return console.error("[QORVA] Blob transcription failed:",t),null}}}const O=new Ae;class Se{constructor(){p(this,"recognition",null);p(this,"isListening",!1);p(this,"options",{});!("webkitSpeechRecognition"in window)&&!("SpeechRecognition"in window)&&console.warn("[QORVA] Speech recognition not supported")}start(e={}){var t,o;this.isListening&&this.stop(),this.options=e;try{const i=window.SpeechRecognition||window.webkitSpeechRecognition;if(!i)throw new Error("Speech recognition not supported");this.recognition=new i,this.recognition.continuous=e.continuous??!0,this.recognition.interimResults=e.interimResults??!0,this.recognition.lang=e.language||"vi-VN",this.recognition.onresult=s=>{var h,d;const r=s.results,a=r[r.length-1],c=a[0].transcript,l=a.isFinal;(d=(h=this.options).onResult)==null||d.call(h,c,l)},this.recognition.onerror=s=>{var r,a;console.error("[QORVA] STT error:",s.error),(a=(r=this.options).onError)==null||a.call(r,new Error(s.error))},this.recognition.onend=()=>{var s,r;if(this.isListening=!1,(r=(s=this.options).onEnd)==null||r.call(s),this.options.continuous&&this.recognition)try{this.recognition.start(),this.isListening=!0}catch{}},this.recognition.start(),this.isListening=!0,console.log("[QORVA] STT started")}catch(i){(o=(t=this.options).onError)==null||o.call(t,i instanceof Error?i:new Error("STT failed"))}}stop(){this.recognition&&(this.recognition.abort(),this.recognition=null),this.isListening=!1,console.log("[QORVA] STT stopped")}isActive(){return this.isListening}static isSupported(){return"webkitSpeechRecognition"in window||"SpeechRecognition"in window}}const L=new Se,Ce=[/^(gì|sao|là gì|thế nào|tại sao|bao nhiêu|khi nào|ở đâu|ai|nào)\??$/i,/(là gì|như thế nào|thế nào|tại sao|vì sao|bao nhiêu|khi nào|ở đâu|cho ai|của ai)\??/i,/^(hãy|cho biết|giải thích|định nghĩa|mô tả|liệt kê)/i,/(câu hỏi|trả lời|đáp án)/i,/\?$/],ke=[/^(what|how|why|when|where|who|which|whose|whom)\s/i,/\?$/,/^(can|could|would|should|is|are|was|were|do|does|did|have|has|had)\s.*\?/i,/^(explain|describe|define|list|name|give)\s/i,/(tell me|let me know|inform me)/i];function G(n){const e=n.trim();if(e.length<5)return{isQuestion:!1,confidence:0,language:"vi",text:e};const t=Ee(e),o=t==="vi"?Ce:ke;let i=0;for(const a of o)a.test(e)&&i++;const s=Math.min(i/o.length*2,1);return{isQuestion:s>.2||e.endsWith("?"),confidence:s,language:t,text:e}}function Ee(n){return/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i.test(n)?"vi":"en"}function Te(n){const e=n.split(/[.!?]+/).map(o=>o.trim()).filter(o=>o.length>0),t=[];for(const o of e){const i=G(o);i.isQuestion&&t.push({text:o,confidence:i.confidence})}return t.length>0?(t.sort((o,i)=>i.confidence-o.confidence),t[0].text):n.endsWith("?")||n.length<100?n:e[e.length-1]||null}if(window.__QORVA_INITIALIZED__)console.log("[QORVA] Already initialized, skipping");else{window.__QORVA_INITIALIZED__=!0;class n{constructor(){p(this,"config",null);p(this,"processedQuestions",new Set);p(this,"processingQuestions",new Set);p(this,"audioEnabled",!1)}async init(){var o,i,s,r;if(console.log("[QORVA] Content script initializing..."),await this.loadConfig(),this.config&&J(window.location.href,this.config.blacklistDomains)){console.log("[QORVA] Domain is blacklisted, skipping");return}f.init(),(o=this.config)!=null&&o.quiz.auto&&this.startQuizDetection(),(i=this.config)!=null&&i.audio.enabled&&((s=this.config.pro)!=null&&s.isPro||(r=this.config.pro)!=null&&r.devMode?this.startAudioQA():console.log("[QORVA] Audio QA requires PRO tier")),this.setupMessageListener(),console.log("[QORVA] Content script initialized")}async loadConfig(){try{const o=await chrome.runtime.sendMessage({type:Q.CFG_GET});o!=null&&o.ok&&(this.config=o.data)}catch(o){console.error("[QORVA] Failed to load config:",o)}}setupMessageListener(){chrome.runtime.onMessage.addListener((o,i,s)=>{switch(o.type){case"PUSH_TO_TALK":this.handlePushToTalk(),s({ok:!0});break;case"CONFIG_UPDATED":this.loadConfig().then(()=>{this.handleConfigUpdate()}),s({ok:!0});break;case"TOGGLE_QUIZ":this.toggleQuizDetection(),s({ok:!0});break;case"TOGGLE_AUDIO":this.toggleAudioQA(),s({ok:!0});break;case"RESCAN":w.rescan(),s({ok:!0});break}return!0})}startQuizDetection(){w.start(this.handleQuestionsDetected.bind(this))}async handleQuestionsDetected(o){var i,s,r,a,c,l,h;for(const{id:d,element:u,question:g}of o)if(!(this.processedQuestions.has(d)||this.processingQuestions.has(d))){this.processingQuestions.add(d),console.log(`[QORVA] Processing question: ${d}`),f.showQuizCard(d,{question:g,answer:{answer_index:0,explanation:""},status:"loading"});try{const b=[];if((i=g.meta)!=null&&i.hasAudioContext&&((s=g.meta)!=null&&s.audioUrl)){console.log(`[QORVA] Auto-transcribing audio for question: ${d}`),f.showToast("🎤 Transcribing audio...");const v=await this.transcribeAudio(g.meta.audioUrl);v&&(b.push(`[Audio Transcript]: ${v}`),f.showTranscribeResult(d,v),console.log(`[QORVA] Transcript added to question: ${d}`))}if((r=g.meta)!=null&&r.hasImageContext&&((a=g.meta)!=null&&a.imageUrl)){console.log(`[QORVA] Analyzing image for question: ${d}`),f.showToast("🖼️ Analyzing image...");const v=await chrome.runtime.sendMessage({type:Q.LLM_ANALYZE_IMAGE,payload:{imageUrl:g.meta.imageUrl}});v!=null&&v.ok&&v.data&&(b.push(`[Image Content]: ${v.data}`),console.log(`[QORVA] Image analysis added to question: ${d}`))}let q={...g};b.length>0&&(q={...g,text:`${b.join(`

`)}

[Question]: ${g.text}`});const m=await chrome.runtime.sendMessage({type:Q.LLM_ANSWER_QUIZ,payload:q});if(this.processedQuestions.add(d),m!=null&&m.ok&&m.data){const v=m.data;f.showQuizCard(d,{question:g,answer:v,status:"success"});const S=!0;if((c=this.config)!=null&&c.quiz.auto&&S){const k=await pe(u,v,this.config.quiz);k.success||console.warn("[QORVA] Auto-select failed:",k.error)}else(l=this.config)!=null&&l.quiz.auto;(h=this.config)!=null&&h.quiz.autoSubmit&&S&&ye()&&(await be()).success&&f.showToast("Quiz submitted!")}else f.showQuizCard(d,{question:g,answer:{answer_index:0,explanation:""},status:"error",errorMessage:(m==null?void 0:m.error)||"Failed to get answer"})}catch(b){this.processedQuestions.add(d),f.showQuizCard(d,{question:g,answer:{answer_index:0,explanation:""},status:"error",errorMessage:b instanceof Error?b.message:"Unknown error"})}finally{this.processingQuestions.delete(d)}}}async startAudioQA(){var o;if(!(!((o=this.config)!=null&&o.audio.enabled)||this.audioEnabled))try{L.start({language:"vi-VN",continuous:!0,interimResults:!0,onResult:(i,s)=>{s&&this.handleTranscript(i)},onError:i=>{console.error("[QORVA] STT error:",i)}}),this.audioEnabled=!0,console.log("[QORVA] Audio QA started")}catch(i){console.error("[QORVA] Failed to start audio QA:",i)}}async handleTranscript(o){var i,s;if(G(o)){f.showAudioCard({transcript:o,status:"processing"});try{const r=Te(o),a=await chrome.runtime.sendMessage({type:Q.LLM_ANSWER_AUDIO,payload:{transcript:r}});if(a!=null&&a.ok&&a.data){const c=a.data;if(f.showAudioCard({transcript:o,answer:c,status:"ready"}),(i=this.config)!=null&&i.audio.tts){const l=new SpeechSynthesisUtterance(c.answer);l.lang="vi-VN",l.volume=this.config.audio.volume,speechSynthesis.speak(l)}(s=this.config)!=null&&s.audio.autoCopy&&navigator.clipboard.writeText(c.answer).catch(()=>{})}else f.showAudioCard({transcript:o,status:"error",errorMessage:(a==null?void 0:a.error)||"Failed to get answer"})}catch(r){f.showAudioCard({transcript:o,status:"error",errorMessage:r instanceof Error?r.message:"Unknown error"})}}}toggleQuizDetection(){w.isRunning()?(w.stop(),f.showToast("Quiz automation OFF")):(this.startQuizDetection(),f.showToast("Quiz automation ON"))}toggleAudioQA(){this.audioEnabled?(L.stop(),O.stop(),this.audioEnabled=!1,f.showToast("Audio QA OFF")):(this.startAudioQA(),f.showToast("Audio QA ON"))}handlePushToTalk(){this.audioEnabled||this.startAudioQA(),f.showAudioCard({transcript:"",status:"listening"})}handleConfigUpdate(){var o,i,s,r;(o=this.config)!=null&&o.quiz.auto&&!w.isRunning()?this.startQuizDetection():!((i=this.config)!=null&&i.quiz.auto)&&w.isRunning()&&w.stop(),(s=this.config)!=null&&s.audio.enabled&&!this.audioEnabled?this.startAudioQA():!((r=this.config)!=null&&r.audio.enabled)&&this.audioEnabled&&(L.stop(),O.stop(),this.audioEnabled=!1),f.updateWidgetStates()}async transcribeAudio(o){try{const{transcribeFromUrl:i}=await _(async()=>{const{transcribeFromUrl:r}=await import("./whisper-UjthEDOh.js");return{transcribeFromUrl:r}},[]),s=await i(o,r=>{r.status==="loading"?f.showToast(`📥 ${r.message||"Loading Whisper..."}`):r.status==="transcribing"&&f.showToast(`🎤 ${r.message||"Transcribing..."}`)});return s!=null&&s.text?(console.log("[QORVA] Audio transcribed:",s.text.substring(0,100)+"..."),s.text):null}catch(i){return console.error("[QORVA] Transcription failed:",i),null}}destroy(){w.stop(),L.stop(),O.stop(),f.destroy()}}const e=new n;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>e.init()):e.init(),window.addEventListener("beforeunload",()=>e.destroy())}
