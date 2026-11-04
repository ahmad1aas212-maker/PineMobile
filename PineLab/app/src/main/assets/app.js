(() => {
'use strict';
const $=id=>document.getElementById(id);
let bars=[],cursor=300,timer=null,seed=73421;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function generate(){
 seed=73421;bars=[];let p=$('symbol').value==='XAUUSD'?2350:1.08;
 const step=Number($('timeframe').value==='D'?1440:$('timeframe').value);
 for(let i=0;i<300;i++){const o=p,move=(random()-.49)*(p>100?2.2:.008);const c=Math.max(.0001,o+move);const h=Math.max(o,c)+random()*(p>100?1.2:.004);const l=Math.min(o,c)-random()*(p>100?1.2:.004);bars.push({t:i*step,o,h,l,c,v:100+Math.floor(random()*900)});p=c}
 cursor=bars.length;$('replayRange').value=cursor;draw();
}
function draw(){
 const canvas=$('chart'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));
 const c=canvas.getContext('2d');c.scale(dpr,dpr);const w=rect.width,h=rect.height;
 c.fillStyle='#101827';c.fillRect(0,0,w,h);
 const visible=bars.slice(Math.max(0,cursor-90),cursor);if(!visible.length)return;
 let lo=Math.min(...visible.map(b=>b.l)),hi=Math.max(...visible.map(b=>b.h));const pad=(hi-lo)*.08||1;lo-=pad;hi+=pad;
 const y=v=>h-18-(v-lo)/(hi-lo)*(h-36),cw=w/visible.length;
 c.strokeStyle='#263449';c.lineWidth=1;for(let i=1;i<5;i++){let yy=h*i/5;c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke()}
 visible.forEach((b,i)=>{const x=i*cw+cw/2,up=b.c>=b.o;c.strokeStyle=up?'#22c59a':'#f06470';c.fillStyle=c.strokeStyle;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();let top=y(Math.max(b.o,b.c)),bottom=y(Math.min(b.o,b.c));c.fillRect(x-Math.max(1,cw*.28),top,Math.max(2,cw*.56),Math.max(1,bottom-top))});
 const last=visible[visible.length-1];$('price').textContent=last.c.toFixed(last.c>100?2:5);$('chartTitle').textContent=$('symbol').value+' · '+$('timeframe').selectedOptions[0].text;$('barsLabel').textContent=cursor+' / '+bars.length+' شمعة';$('cursorLabel').textContent='الشمعة '+cursor;
}
function stop(){if(timer){clearInterval(timer);timer=null}$('play').textContent='▶ تشغيل'}
function advance(){if(cursor<bars.length){cursor++;$('replayRange').value=cursor;draw()}else stop()}
$('regen').onclick=generate;$('symbol').onchange=generate;$('timeframe').onchange=generate;
$('step').onclick=()=>{stop();advance()};$('play').onclick=()=>{if(timer){stop();return}$('play').textContent='إيقاف';timer=setInterval(advance,350)};
$('reset').onclick=()=>{stop();cursor=20;$('replayRange').value=cursor;draw()};
$('replayRange').oninput=e=>{stop();cursor=Number(e.target.value);draw()};
$('save').onclick=()=>{const n=$('scriptName').value.trim()||'My Indicator';localStorage.setItem('pine:'+n,$('source').value);if(window.PineLab)PineLab.saveScript(n,$('source').value);$('diagnostics').textContent='تم حفظ النص محلياً: '+n};
$('run').onclick=()=>{$('diagnostics').textContent='تم استلام النص. فحص Pine الكامل غير مفعّل بعد؛ لن نعرض نتائج مضللة قبل دمج المحرك واختبار توافقه.'};
function restore(){try{const a=window.PineLab?JSON.parse(PineLab.loadScripts()):[];if(a.length){$('scriptName').value=a[0].name;$('source').value=a[0].source}}catch(e){}}
window.addEventListener('resize',draw);generate();restore();
})(); 
