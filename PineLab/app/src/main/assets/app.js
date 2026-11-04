(() => {
'use strict';
const $=id=>document.getElementById(id);
let bars=[],cursor=300,timer=null,seed=73421,activePlots=[],activeViz=null;
const DAY=86400000, BASE=Date.UTC(2025,0,1);
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function tfMinutes(){const v=$('timeframe').value;return v==='D'?1440:Number(v)}
function tfString(){return $('timeframe').value==='D'?'D':$('timeframe').value}
function generate(){
 seed=73421;bars=[];let p=$('symbol').value==='XAUUSD'?2350:$('symbol').value==='BTCUSD'?65000:$('symbol').value==='US100'?18000:1.08;
 const step=tfMinutes()*60000;
 for(let i=0;i<300;i++){const o=p,move=(random()-.49)*(p>100?2.2:.008);const c=Math.max(.0001,o+move);const h=Math.max(o,c)+random()*(p>100?1.2:.004);const l=Math.min(o,c)-random()*(p>100?1.2:.004);bars.push({t:BASE+i*step,o,h,l,c,v:100+Math.floor(random()*900)});p=c}
 cursor=bars.length;activePlots=[];activeViz=null;$('replayRange').max=bars.length;$('replayRange').value=cursor;draw();
}
function draw(){
 const canvas=$('chart'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;
 c.fillStyle='#101827';c.fillRect(0,0,w,h);
 const start=Math.max(0,cursor-90),visible=bars.slice(start,cursor);if(!visible.length)return;
 let vals=visible.flatMap(b=>[b.l,b.h]);
 for(const p of activePlots)for(let i=start;i<cursor;i++){const v=p.values[i];if(Number.isFinite(v))vals.push(v)}
 let lo=Math.min(...vals),hi=Math.max(...vals);const pad=(hi-lo)*.08||1;lo-=pad;hi+=pad;
 const y=v=>h-18-(v-lo)/(hi-lo)*(h-36),cw=w/visible.length;
 c.strokeStyle='#263449';c.lineWidth=1;for(let i=1;i<5;i++){let yy=h*i/5;c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke()}
 visible.forEach((b,i)=>{const x=i*cw+cw/2,up=b.c>=b.o;c.strokeStyle=up?'#22c59a':'#f06470';c.fillStyle=c.strokeStyle;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();let top=y(Math.max(b.o,b.c)),bottom=y(Math.min(b.o,b.c));c.fillRect(x-Math.max(1,cw*.28),top,Math.max(2,cw*.56),Math.max(1,bottom-top))});
 activePlots.forEach((p,pi)=>{const meta=activeViz&&activeViz.plots?activeViz.plots[pi]:null;c.beginPath();let begun=false;c.lineWidth=meta?Math.max(1,meta.linewidth||2):2;c.strokeStyle=(meta&&meta.color)||['#f5a742','#48c9ee','#d48aff','#f078a6'][pi%4];for(let i=start;i<cursor;i++){const v=p.values[i];if(!Number.isFinite(v)){begun=false;continue}const x=(i-start+.5)*cw,yy=y(v);if(!begun){c.moveTo(x,yy);begun=true}else c.lineTo(x,yy)}c.stroke()});
 if(activeViz&&activeViz.shapes)activeViz.shapes.forEach(s=>{for(let i=start;i<cursor;i++){if(!s.condition[i])continue;const b=bars[i],x=(i-start+.5)*cw,yy=s.location==='belowbar'?y(b.l)-8:s.location==='abovebar'?y(b.h)+8:y(b.c);c.fillStyle=(s.colors&&s.colors[i])||s.color||'#f2c14e';c.beginPath();c.arc(x,yy,3.5,0,Math.PI*2);c.fill()}});
 const last=visible[visible.length-1];$('price').textContent=last.c.toFixed(last.c>100?2:5);$('chartTitle').textContent=$('symbol').value+' · '+$('timeframe').selectedOptions[0].text;$('barsLabel').textContent=cursor+' / '+bars.length+' شمعة';$('cursorLabel').textContent='الشمعة '+cursor;
}
function stop(){if(timer){clearInterval(timer);timer=null}$('play').textContent='▶ تشغيل'}
function advance(){if(cursor<bars.length){cursor++;$('replayRange').value=cursor;draw()}else stop()}
$('regen').onclick=generate;$('symbol').onchange=generate;$('timeframe').onchange=generate;
$('step').onclick=()=>{stop();advance()};$('play').onclick=()=>{if(timer){stop();return}$('play').textContent='إيقاف';timer=setInterval(advance,350)};
$('reset').onclick=()=>{stop();cursor=20;$('replayRange').value=cursor;draw()};
$('replayRange').oninput=e=>{stop();cursor=Number(e.target.value);draw()};
$('save').onclick=()=>{const n=$('scriptName').value.trim()||'My Indicator';localStorage.setItem('pine:'+n,$('source').value);if(window.PineLab)PineLab.saveScript(n,$('source').value);$('diagnostics').textContent='تم حفظ النص محلياً: '+n};
$('run').onclick=()=>{
 const engine=window.PineLabEngine;
 if(!engine){$('diagnostics').textContent='محرك Pine غير موجود في هذه النسخة. أعد البناء بعد نجاح خطوة تجهيز المحرك.';return}
 const data={open:bars.slice(0,cursor).map(b=>b.o),high:bars.slice(0,cursor).map(b=>b.h),low:bars.slice(0,cursor).map(b=>b.l),close:bars.slice(0,cursor).map(b=>b.c),volume:bars.slice(0,cursor).map(b=>b.v),time:bars.slice(0,cursor).map(b=>b.t)};
 const out=engine.execute($('source').value,data,tfString());
 if(!out.ok){activePlots=[];activeViz=null;draw();$('diagnostics').textContent='خطأ Pine:\n'+(out.errors||['تعذر تشغيل الكود']).join('\n');return}
 activePlots=out.plots||[];activeViz=out.viz||null;draw();
 $('diagnostics').textContent='نجح التنفيذ بواسطة Resin '+out.version+' — '+activePlots.length+' سلسلة رسم. '+(activeViz&&activeViz.shapes?activeViz.shapes.length+' مجموعات علامات.':'');
};
function restore(){try{const a=window.PineLab?JSON.parse(PineLab.loadScripts()):[];if(a.length){$('scriptName').value=a[0].name;$('source').value=a[0].source}}catch(e){}}
window.addEventListener('resize',draw);generate();restore();
})();