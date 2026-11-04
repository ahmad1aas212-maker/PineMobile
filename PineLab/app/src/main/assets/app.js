(() => {
'use strict';
const $=id=>document.getElementById(id);
let bars=[],cursor=300,timer=null,seed=73421,activePlots=[],activeViz=null,savedScripts=[],enabledScripts=[];
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
 if(activeViz&&activeViz.bgcolors)activeViz.bgcolors.forEach(bg=>{for(let i=start;i<cursor;i++){const col=(bg.colors&&bg.colors[i])||bg.color;if(!col)continue;c.globalAlpha=.12;c.fillStyle=col;c.fillRect((i-start)*cw,0,cw,h)}c.globalAlpha=1});
 visible.forEach((b,i)=>{const x=i*cw+cw/2,up=b.c>=b.o;let col=up?'#22c59a':'#f06470';if(activeViz&&activeViz.barcolors){for(const bc of activeViz.barcolors){const q=(bc.colors&&bc.colors[start+i])||bc.color;if(q)col=q}}c.strokeStyle=col;c.fillStyle=col;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();let top=y(Math.max(b.o,b.c)),bottom=y(Math.min(b.o,b.c));c.fillRect(x-Math.max(1,cw*.28),top,Math.max(2,cw*.56),Math.max(1,bottom-top))});
 if(activeViz&&activeViz.fills)activeViz.fills.forEach(f=>{if(!f.a||!f.b)return;const series=(ref)=>ref.kind==='plot'?(activePlots[ref.index]&&activePlots[ref.index].values):(activeViz.hlines[ref.index]?[...Array(cursor)].map(()=>activeViz.hlines[ref.index].price):null);const a=series(f.a),b=series(f.b);if(!a||!b)return;c.beginPath();let started=false;for(let i=start;i<cursor;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))continue;const x=(i-start+.5)*cw;if(!started){c.moveTo(x,y(a[i]));started=true}else c.lineTo(x,y(a[i]))}for(let i=cursor-1;i>=start;i--){if(Number.isFinite(b[i]))c.lineTo((i-start+.5)*cw,y(b[i]))}if(started){c.closePath();c.globalAlpha=.16;c.fillStyle=(f.colors&&f.colors[cursor-1])||f.color||'#8294aa';c.fill();c.globalAlpha=1}});
 activeViz&&activeViz.hlines&&activeViz.hlines.forEach(line=>{if(!Number.isFinite(line.price))return;c.strokeStyle=line.color||'#a5b3c7';c.lineWidth=line.linewidth||1;c.setLineDash(line.linestyle==='dashed'?[6,4]:line.linestyle==='dotted'?[2,3]:[]);c.beginPath();c.moveTo(0,y(line.price));c.lineTo(w,y(line.price));c.stroke();c.setLineDash([])});
 activePlots.forEach((p,pi)=>{const meta=activeViz&&activeViz.plots?activeViz.plots[pi]:null;c.beginPath();let begun=false;c.lineWidth=meta?Math.max(1,meta.linewidth||2):2;c.strokeStyle=(meta&&meta.color)||['#f5a742','#48c9ee','#d48aff','#f078a6'][pi%4];for(let i=start;i<cursor;i++){const v=p.values[i];if(!Number.isFinite(v)){begun=false;continue}const x=(i-start+.5)*cw,yy=y(v);if(!begun){c.moveTo(x,yy);begun=true}else c.lineTo(x,yy)}c.stroke()});
 if(activeViz&&activeViz.shapes)activeViz.shapes.forEach(s=>{for(let i=start;i<cursor;i++){if(!s.condition[i])continue;const b=bars[i],x=(i-start+.5)*cw,yy=s.location==='belowbar'?y(b.l)-8:s.location==='abovebar'?y(b.h)+8:y(b.c);c.fillStyle=(s.colors&&s.colors[i])||s.color||'#f2c14e';c.beginPath();c.arc(x,yy,3.5,0,Math.PI*2);c.fill();if(s.text){c.font='11px Arial';c.fillText(s.text,x+5,yy-5)}}});
 const xCoord=v=>{if(!Number.isFinite(v))return NaN;let idx=Math.round(v);if(activeViz&&activeViz.drawings&&activeViz.drawings.some(d=>d.state&&d.state.xloc==='bar_time')&&v>1e11){let best=0,dist=Infinity;bars.forEach((b,i)=>{const d=Math.abs(b.t-v);if(d<dist){dist=d;best=i}});idx=best}return (idx-start+.5)*cw};
 if(activeViz&&activeViz.drawings)activeViz.drawings.forEach(d=>{const s=d.state||{};c.save();if(d.kind==='line'){const x1=xCoord(s.x1),x2=xCoord(s.x2);if(Number.isFinite(x1)&&Number.isFinite(x2)&&Number.isFinite(s.y1)&&Number.isFinite(s.y2)){c.strokeStyle=s.color||'#f4c95d';c.lineWidth=s.width||1.5;c.beginPath();c.moveTo(x1,y(s.y1));c.lineTo(x2,y(s.y2));c.stroke()}}else if(d.kind==='box'){const x1=xCoord(s.left),x2=xCoord(s.right);if(Number.isFinite(x1)&&Number.isFinite(x2)&&Number.isFinite(s.top)&&Number.isFinite(s.bottom)){const left=Math.min(x1,x2),top=y(Math.max(s.top,s.bottom)),ww=Math.abs(x2-x1),hh=Math.abs(y(s.top)-y(s.bottom));c.globalAlpha=.14;c.fillStyle=s.bgcolor||'#5c91c9';c.fillRect(left,top,ww,hh);c.globalAlpha=1;c.strokeStyle=s.border_color||'#5c91c9';c.lineWidth=s.border_width||1;c.strokeRect(left,top,ww,hh)}}else if(d.kind==='label'){const x=xCoord(s.x);if(Number.isFinite(x)&&Number.isFinite(s.y)){c.font='12px Arial';c.fillStyle=s.textcolor||'#ffffff';c.fillText(s.text||'',x,y(s.y))}}c.restore()});
 const last=visible[visible.length-1];$('price').textContent=last.c.toFixed(last.c>100?2:5);$('chartTitle').textContent=$('symbol').value+' · '+$('timeframe').selectedOptions[0].text;$('barsLabel').textContent=cursor+' / '+bars.length+' شمعة';$('cursorLabel').textContent='الشمعة '+cursor;
}
function stop(){if(timer){clearInterval(timer);timer=null}$('play').textContent='▶ تشغيل'}
function advance(){if(cursor<bars.length){cursor++;$('replayRange').value=cursor;draw()}else stop()}
$('regen').onclick=generate;$('symbol').onchange=generate;$('timeframe').onchange=generate;
$('step').onclick=()=>{stop();advance()};$('play').onclick=()=>{if(timer){stop();return}$('play').textContent='إيقاف';timer=setInterval(advance,350)};
$('reset').onclick=()=>{stop();cursor=20;$('replayRange').value=cursor;draw()};
$('replayRange').oninput=e=>{stop();cursor=Number(e.target.value);draw()};
function persistScripts(){
 localStorage.setItem('pinelab:scripts',JSON.stringify(savedScripts));\n localStorage.setItem('pinelab:enabled',JSON.stringify(enabledScripts));
 try{if(window.PineLab)savedScripts.forEach(s=>PineLab.saveScript(s.name,s.source))}catch(e){}
}
function refreshSaved(){
 const select=$('savedScripts'),selected=select.value;
 select.innerHTML='<option value="">المؤشرات المحفوظة</option>';
 savedScripts.forEach(s=>{const o=document.createElement('option');o.value=s.name;o.textContent=(enabledScripts.includes(s.name)?'● ':'○ ')+s.name;select.appendChild(o)});
 if(savedScripts.some(s=>s.name===selected))select.value=selected;
 $('toggleIndicator').textContent=enabledScripts.includes($('scriptName').value.trim())?'إيقاف':'تفعيل';
}
function loadSaved(){
 try{savedScripts=JSON.parse(localStorage.getItem('pinelab:scripts')||'[]')}catch(e){savedScripts=[]}\n try{enabledScripts=JSON.parse(localStorage.getItem('pinelab:enabled')||'[]')}catch(e){enabledScripts=[]}
 try{const native=window.PineLab?JSON.parse(PineLab.loadScripts()):[];native.forEach(s=>{if(!savedScripts.some(x=>x.name===s.name))savedScripts.push(s)})}catch(e){}
 refreshSaved();
}
$('save').onclick=()=>{
 const n=$('scriptName').value.trim()||'My Indicator',source=$('source').value;
 const i=savedScripts.findIndex(s=>s.name===n);
 if(i>=0)savedScripts[i].source=source;else savedScripts.push({name:n,source});
 if(!enabledScripts.includes(n))enabledScripts.push(n);
 persistScripts();refreshSaved();
 $('diagnostics').textContent='تم حفظ المؤشر وتفعيله: '+n;
};
$('loadScript').onclick=()=>{
 const n=$('savedScripts').value,s=savedScripts.find(x=>x.name===n);
 if(!s)return;
 $('scriptName').value=s.name;$('source').value=s.source;refreshSaved();
 $('diagnostics').textContent='تم فتح المؤشر: '+n;
};
$('toggleIndicator').onclick=()=>{
 const n=$('scriptName').value.trim()||'My Indicator';
 if(!savedScripts.some(s=>s.name===n)){$('diagnostics').textContent='احفظ المؤشر أولاً ثم فعّله.';return}
 if(enabledScripts.includes(n))enabledScripts=enabledScripts.filter(x=>x!==n);else enabledScripts.push(n);
 refreshSaved();$('diagnostics').textContent=(enabledScripts.includes(n)?'تم تفعيل ':'تم إيقاف ')+n;
};
$('run').onclick=()=>{
 const engine=window.PineLabEngine;
 if(!engine){$('diagnostics').textContent='محرك Pine غير موجود في هذه النسخة.';return}
 const active=savedScripts.filter(s=>enabledScripts.includes(s.name));
 if(!active.length){$('diagnostics').textContent='لا توجد مؤشرات مفعّلة. احفظ مؤشراً وفعّله أولاً.';return}
 const data={open:bars.slice(0,cursor).map(b=>b.o),high:bars.slice(0,cursor).map(b=>b.h),low:bars.slice(0,cursor).map(b=>b.l),close:bars.slice(0,cursor).map(b=>b.c),volume:bars.slice(0,cursor).map(b=>b.v),time:bars.slice(0,cursor).map(b=>b.t)};
 const outputs=[];
 for(const s of active){
  const out=engine.execute(s.source,data,tfString());
  if(!out.ok){$('diagnostics').textContent='خطأ في '+s.name+':\\n'+(out.errors||['تعذر التشغيل']).join('\\n');return}
  outputs.push(out);
 }
 activePlots=outputs.flatMap(o=>o.plots||[]);
 const keys=['shapes','hlines','fills','drawings','bgcolors','barcolors','plots'];
 activeViz={};
 keys.forEach(k=>activeViz[k]=outputs.flatMap(o=>o.viz&&o.viz[k]?(Array.isArray(o.viz[k])?o.viz[k]:[o.viz[k]]):[]));
 draw();
 $('diagnostics').textContent='نجح تشغيل '+active.length+' مؤشر/مؤشرات — '+activePlots.length+' سلسلة رسم. المحرك Resin '+outputs[0].version+'.';
};
function restore(){
 loadSaved();
 if(savedScripts.length){const first=savedScripts[0];$('scriptName').value=first.name;$('source').value=first.source;if(!enabledScripts.length)enabledScripts.push(first.name);refreshSaved()}
}
window.addEventListener('resize',draw);generate();restore();
})();