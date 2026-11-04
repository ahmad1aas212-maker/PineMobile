(() => {
'use strict';
const $=id=>document.getElementById(id);
let bars=[],cursor=300,timer=null,seed=73421,activePlots=[],activeViz=null,savedScripts=[],enabledScripts=[];let executeFrame=0,drawFrame=0;
let viewStart=null,followLatest=true,priceZoom=1,priceShift=0,replayStart=20,dragState=null,visibleBars=100;const activePointers=new Map();let pinchState=null;
const DAY=86400000, BASE=Date.UTC(2025,0,1), HISTORY_DAYS=10;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function tfMinutes(){const v=$('timeframe').value;return v==='D'?1440:Number(v)}
function tfString(){return $('timeframe').value==='D'?'D':$('timeframe').value}
function generate(){
 seed=73421;bars=[];$('engineStatus').textContent='بيانات اصطناعية للاختبار · دون اتصال';let p=$('symbol').value==='XAUUSD'?2350:$('symbol').value==='BTCUSD'?65000:$('symbol').value==='US100'?18000:1.08;
 const step=tfMinutes()*60000;
 const count=Math.max(300,Math.min(10000,Math.ceil(HISTORY_DAYS*1440/tfMinutes())));
 for(let i=0;i<count;i++){const o=p,move=(random()-.49)*(p>100?2.2:.008);const c=Math.max(.0001,o+move);const h=Math.max(o,c)+random()*(p>100?1.2:.004);const l=Math.min(o,c)-random()*(p>100?1.2:.004);bars.push({t:BASE+i*step,o,h,l,c,v:100+Math.floor(random()*900)});p=c}
 cursor=bars.length;viewStart=Math.max(0,cursor-visibleBars*.8);followLatest=true;priceZoom=1;priceShift=0;replayStart=1;activePlots=[];activeViz=null;$('replayRange').min=replayStart;$('replayRange').max=bars.length;$('replayRange').value=cursor;executeEnabled(false);draw();
}
function queueDraw(){if(drawFrame)return;drawFrame=requestAnimationFrame(()=>{drawFrame=0;draw()})}
function draw(){
 const canvas=$('chart'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 const pixelW=Math.max(1,Math.floor(rect.width*dpr)),pixelH=Math.max(1,Math.floor(rect.height*dpr));if(canvas.width!==pixelW||canvas.height!==pixelH){canvas.width=pixelW;canvas.height=pixelH;}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;
 c.fillStyle='#101827';c.fillRect(0,0,w,h);
 if(viewStart===null)viewStart=Math.max(0,cursor-visibleBars*.8);viewStart=Math.max(0,Math.min(Math.max(0,cursor-1),viewStart));const start=viewStart,dataStart=Math.max(0,Math.floor(start)),dataEnd=Math.min(cursor,Math.ceil(start+visibleBars)),visible=bars.slice(dataStart,dataEnd);if(!visible.length)return;
 let vals=visible.flatMap(b=>[b.l,b.h]);
 for(const p of activePlots)for(let i=dataStart;i<dataEnd;i++){const v=p.values[i];if(Number.isFinite(v))vals.push(v)}
 if(activeViz){for(const series of [...(activeViz.candles||[]),...(activeViz.plotbars||[])])for(let i=dataStart;i<dataEnd;i++)for(const key of ['open','high','low','close']){const v=series[key]&&series[key][i];if(Number.isFinite(v))vals.push(v)}}
 if(activeViz&&activeViz.hlines)activeViz.hlines.forEach(q=>{if(Number.isFinite(q.price))vals.push(q.price)});
 if(activeViz&&activeViz.drawings)activeViz.drawings.forEach(d=>{const s=d.state||{};['y','y1','y2','top','bottom'].forEach(k=>{if(Number.isFinite(s[k]))vals.push(s[k])})});
 let lo=Infinity,hi=-Infinity;for(let i=0;i<vals.length;i++){const v=vals[i];if(!Number.isFinite(v))continue;if(v<lo)lo=v;if(v>hi)hi=v}if(!Number.isFinite(lo)||!Number.isFinite(hi)){lo=0;hi=1}const pad=(hi-lo)*.08||Math.max(Math.abs(hi)*.0005,1);lo-=pad;hi+=pad;
 const y=v=>h-18-(((v-lo)/(hi-lo)-0.5)*priceZoom+0.5+priceShift)*(h-36),cw=w/visibleBars;
 c.strokeStyle='#263449';c.lineWidth=1;for(let i=1;i<5;i++){let yy=h*i/5;c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke()}
 if(activeViz&&activeViz.bgcolors)activeViz.bgcolors.forEach(bg=>{for(let i=dataStart;i<dataEnd;i++){const col=(bg.colors&&bg.colors[i])||bg.color;if(!col)continue;c.globalAlpha=.12;c.fillStyle=col;c.fillRect((i-start)*cw,0,cw,h)}c.globalAlpha=1});
 visible.forEach((b,i)=>{const abs=dataStart+i,x=(abs-start+.5)*cw,up=b.c>=b.o;let col=up?'#22c59a':'#f06470';if(activeViz&&activeViz.barcolors){for(const bc of activeViz.barcolors){const q=(bc.colors&&bc.colors[abs])||bc.color;if(q)col=q}}c.strokeStyle=col;c.fillStyle=col;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();let top=y(Math.max(b.o,b.c)),bottom=y(Math.min(b.o,b.c));c.fillRect(x-Math.max(1,cw*.28),top,Math.max(2,cw*.56),Math.max(1,bottom-top))});
 if(activeViz&&activeViz.fills)activeViz.fills.forEach(f=>{if(!f.a||!f.b)return;const series=(ref)=>ref.kind==='plot'?(activePlots[ref.index]&&activePlots[ref.index].values):(activeViz.hlines[ref.index]?[...Array(cursor)].map(()=>activeViz.hlines[ref.index].price):null);const a=series(f.a),b=series(f.b);if(!a||!b)return;c.beginPath();let started=false;for(let i=dataStart;i<dataEnd;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))continue;const x=(i-start+.5)*cw;if(!started){c.moveTo(x,y(a[i]));started=true}else c.lineTo(x,y(a[i]))}for(let i=dataEnd-1;i>=dataStart;i--){if(Number.isFinite(b[i]))c.lineTo((i-start+.5)*cw,y(b[i]))}if(started){c.closePath();c.globalAlpha=.16;c.fillStyle=(f.colors&&f.colors[cursor-1])||f.color||'#8294aa';c.fill();c.globalAlpha=1}});
 activeViz&&activeViz.hlines&&activeViz.hlines.forEach(line=>{if(!Number.isFinite(line.price))return;c.strokeStyle=line.color||'#a5b3c7';c.lineWidth=line.linewidth||1;c.setLineDash(line.linestyle==='dashed'?[6,4]:line.linestyle==='dotted'?[2,3]:[]);c.beginPath();c.moveTo(0,y(line.price));c.lineTo(w,y(line.price));c.stroke();c.setLineDash([])});
 activePlots.forEach((p,pi)=>{const meta=activeViz&&activeViz.plots?activeViz.plots[pi]:null,style=meta&&meta.style||'line',base=meta&&Number.isFinite(meta.histbase)?meta.histbase:0,baseY=y(base),offset=meta&&Number.isFinite(meta.offset)?meta.offset:0,color=(meta&&meta.color)||['#f5a742','#48c9ee','#d48aff','#f078a6'][pi%4];c.lineWidth=meta?Math.max(1,meta.linewidth||2):2;c.strokeStyle=color;c.fillStyle=color;
 if(style==='histogram'||style==='columns'){for(let i=Math.max(0,dataStart-offset);i<Math.min(p.values.length,dataEnd-offset);i++){const v=p.values[i];if(!Number.isFinite(v))continue;const x=(i+offset-start+.5)*cw,yy=y(v),col=(meta&&meta.colors&&meta.colors[i])||color;c.fillStyle=col;c.fillRect(x-cw*.32,Math.min(yy,baseY),Math.max(1,cw*.64),Math.max(1,Math.abs(baseY-yy)))}return}
 if(style==='circles'||style==='cross'){for(let i=Math.max(0,dataStart-offset);i<Math.min(p.values.length,dataEnd-offset);i++){const v=p.values[i];if(!Number.isFinite(v))continue;const x=(i+offset-start+.5)*cw,yy=y(v),col=(meta&&meta.colors&&meta.colors[i])||color;c.strokeStyle=col;c.fillStyle=col;if(style==='circles'){c.beginPath();c.arc(x,yy,Math.max(2,c.lineWidth+1),0,Math.PI*2);c.fill()}else{c.beginPath();c.moveTo(x-4,yy);c.lineTo(x+4,yy);c.moveTo(x,yy-4);c.lineTo(x,yy+4);c.stroke()}}return}
 c.beginPath();let begun=false,points=[];for(let i=Math.max(0,dataStart-offset);i<Math.min(p.values.length,dataEnd-offset);i++){const v=p.values[i];if(!Number.isFinite(v)){begun=false;continue}const x=(i+offset-start+.5)*cw,yy=y(v);if(!begun){c.moveTo(x,yy);begun=true}else if(style==='stepline'){const prev=p.values[i-1];c.lineTo(x,y(prev));c.lineTo(x,yy)}else c.lineTo(x,yy);points.push([x,yy])}c.stroke();
 if(style==='area'&&points.length){c.beginPath();c.moveTo(points[0][0],baseY);points.forEach(pt=>c.lineTo(pt[0],pt[1]));c.lineTo(points[points.length-1][0],baseY);c.closePath();c.globalAlpha=.18;c.fillStyle=color;c.fill();c.globalAlpha=1}
 });
 if(activeViz&&activeViz.candles)activeViz.candles.concat(activeViz.plotbars||[]).forEach(series=>{for(let i=dataStart;i<dataEnd;i++){const j=i-start,o=series.open[i],hh=series.high[i],ll=series.low[i],cl=series.close[i];if(![o,hh,ll,cl].every(Number.isFinite))continue;const x=(j+.5)*cw,col=(series.colors&&series.colors[i])||series.color||(cl>=o?'#22c59a':'#f06470');c.strokeStyle=series.wickcolor||col;c.fillStyle=col;c.lineWidth=1;c.beginPath();c.moveTo(x,y(hh));c.lineTo(x,y(ll));c.stroke();const top=y(Math.max(o,cl)),bottom=y(Math.min(o,cl)),body=Math.max(1,bottom-top),bw=Math.max(2,cw*.48);c.fillRect(x-bw/2,top,bw,body);if(series.bordercolor){c.strokeStyle=series.bordercolor;c.strokeRect(x-bw/2,top,bw,body)}}});
 if(activeViz&&activeViz.chars)activeViz.chars.forEach(s=>{for(let i=dataStart;i<dataEnd;i++){if(!s.condition[i])continue;const b=bars[i],x=(i-start+.5)*cw,yy=s.location==='belowbar'?y(b.l)-10:s.location==='abovebar'?y(b.h)+10:y(b.c);c.font='12px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=(s.colors&&s.colors[i])||s.color||s.textcolor||'#f2c14e';c.fillText(s.char||s.text||'•',x,yy)}});
 if(activeViz&&activeViz.arrows)activeViz.arrows.forEach(s=>{for(let i=dataStart;i<dataEnd;i++){const v=s.values[i];if(!Number.isFinite(v)||v===0)continue;const x=(i-start+.5)*cw,yy=y(v),up=v>0;c.fillStyle=up?(s.colorup||'#22c59a'):(s.colordown||'#f06470');c.beginPath();c.moveTo(x,yy+(up? -7:7));c.lineTo(x-5,yy+(up?5:-5));c.lineTo(x+5,yy+(up?5:-5));c.closePath();c.fill()}});
 if(activeViz&&activeViz.shapes)activeViz.shapes.forEach(s=>{for(let i=dataStart;i<dataEnd;i++){if(!s.condition[i])continue;const b=bars[i],x=(i-start+.5)*cw,yy=s.location==='belowbar'?y(b.l)-8:s.location==='abovebar'?y(b.h)+8:y(b.c);c.fillStyle=(s.colors&&s.colors[i])||s.color||'#f2c14e';c.beginPath();c.arc(x,yy,3.5,0,Math.PI*2);c.fill();if(s.text){c.font='11px Arial';c.fillText(s.text,x+5,yy-5)}}});
 const xCoord=v=>{if(!Number.isFinite(v))return NaN;let idx=Math.round(v);if(v>1e11){let lo=0,hi=bars.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(bars[mid].t<v)lo=mid+1;else hi=mid}idx=lo;if(idx>0&&Math.abs(bars[idx-1].t-v)<Math.abs(bars[idx].t-v))idx--;}return (idx-start+.5)*cw};
 if(activeViz&&activeViz.drawings)activeViz.drawings.forEach(d=>{const s=d.state||{};c.save();if(d.kind==='line'){const x1=xCoord(s.x1),x2=xCoord(s.x2);if(Number.isFinite(x1)&&Number.isFinite(x2)&&Number.isFinite(s.y1)&&Number.isFinite(s.y2)){c.strokeStyle=s.color||'#f4c95d';c.lineWidth=s.width||1.5;c.setLineDash(s.style==='dashed'?[7,5]:s.style==='dotted'?[2,4]:[]);const ext=s.extend||'none',left=ext==='left'||ext==='both',right=ext==='right'||ext==='both';let ax=x1,bx=x2;if(left||right){const dx=x2-x1,dy=y(s.y2)-y(s.y1);if(dx!==0){if(left)ax=0;if(right)bx=w;const yy1=y(s.y1)+(ax-x1)*(dy/dx),yy2=y(s.y1)+(bx-x1)*(dy/dx);c.beginPath();c.moveTo(ax,yy1);c.lineTo(bx,yy2)}else{c.beginPath();c.moveTo(x1,0);c.lineTo(x1,h)}}else{c.beginPath();c.moveTo(x1,y(s.y1));c.lineTo(x2,y(s.y2))}c.stroke();c.setLineDash([])}}else if(d.kind==='box'){const x1=xCoord(s.left),x2=xCoord(s.right);if(Number.isFinite(x1)&&Number.isFinite(x2)&&Number.isFinite(s.top)&&Number.isFinite(s.bottom)){const left=Math.min(x1,x2),top=y(Math.max(s.top,s.bottom)),ww=Math.abs(x2-x1),hh=Math.abs(y(s.top)-y(s.bottom));c.globalAlpha=.14;c.fillStyle=s.bgcolor||'#5c91c9';c.fillRect(left,top,ww,hh);c.globalAlpha=1;c.strokeStyle=s.border_color||'#5c91c9';c.lineWidth=s.border_width||1;c.strokeRect(left,top,ww,hh);if(s.text){c.font='11px Arial';c.fillStyle=s.text_color||'#ffffff';c.fillText(s.text,left+4,top+14)}}}else if(d.kind==='label'){const x=xCoord(s.x);if(Number.isFinite(x)&&Number.isFinite(s.y)){c.font=(s.size==='large'?'16px':s.size==='small'?'10px':'12px')+' Arial';c.fillStyle=s.textcolor||'#ffffff';c.textAlign='left';c.fillText(s.text||'',x,y(s.y))}}c.restore()});
 const last=visible[visible.length-1];$('price').textContent=last.c.toFixed(last.c>100?2:5);$('chartTitle').textContent=$('symbol').value+' · '+$('timeframe').selectedOptions[0].text;$('barsLabel').textContent=cursor+' / '+bars.length+' شمعة';$('cursorLabel').textContent='الشمعة '+cursor;
}
function stop(){if(timer){clearTimeout(timer);timer=null}$('play').textContent='▶ تشغيل'}
function advance(){if(cursor<bars.length){cursor++;$('replayRange').value=cursor;if(followLatest)viewStart=Math.max(0,cursor-visibleBars*.8);executeEnabled(false);draw();return true}stop();return false}
function scheduleReplay(){if(!timer)return;timer=setTimeout(()=>{timer=null;if(advance())scheduleReplay()},Math.max(16,Number($('replaySpeed').value)||500))}
$('regen').onclick=generate;$('symbol').onchange=generate;$('timeframe').onchange=generate;
$('step').onclick=()=>{stop();advance()};$('play').onclick=()=>{if(timer){stop();return}$('play').textContent='إيقاف';scheduleReplay()};
$('reset').onclick=()=>{stop();cursor=replayStart;$('replayRange').value=cursor;if(followLatest)viewStart=Math.max(0,cursor-visibleBars*.8);executeEnabled(false);draw()};
$('replaySpeed').onchange=()=>{if(timer){stop();$('play').textContent='إيقاف';scheduleReplay()}};
$('setReplayStart').onclick=()=>{replayStart=cursor;$('replayRange').min=replayStart;$('replayRange').value=cursor;$('diagnostics').textContent='تم تحديد بداية إعادة التشغيل عند الشمعة '+replayStart};
$('replayRange').oninput=e=>{stop();cursor=Number(e.target.value);if(followLatest)viewStart=Math.max(0,cursor-visibleBars*.8);queueExecuteAndDraw()};
function persistScripts(){
 localStorage.setItem('pinelab:scripts',JSON.stringify(savedScripts));
 localStorage.setItem('pinelab:enabled',JSON.stringify(enabledScripts));
 try{if(window.PineLab)savedScripts.forEach(s=>PineLab.saveScript(s.name,s.source))}catch(e){}
}
function refreshSaved(){
 const select=$('savedScripts'),selected=select.value,list=$('indicatorList');
 select.innerHTML='<option value="">المؤشرات المحفوظة</option>';
 list.innerHTML='';
 savedScripts.forEach(s=>{
  const enabled=enabledScripts.includes(s.name);
  const o=document.createElement('option');o.value=s.name;o.textContent=(enabled?'● ':'○ ')+s.name;select.appendChild(o);
  const row=document.createElement('div');row.className='indicatorItem';
  const name=document.createElement('span');name.className='indicatorName';name.textContent=s.name;
  const btn=document.createElement('button');btn.type='button';btn.className=enabled?'enabled':'disabled';btn.textContent=enabled?'إيقاف':'تشغيل';btn.dataset.indicator=s.name;
  row.append(name,btn);list.appendChild(row);
 });
 if(savedScripts.some(s=>s.name===selected))select.value=selected;
 $('toggleIndicator').textContent=enabledScripts.includes($('scriptName').value.trim())?'إيقاف':'تفعيل';
}
function toggleSavedIndicator(name){
 if(!savedScripts.some(s=>s.name===name))return;
 if(enabledScripts.includes(name))enabledScripts=enabledScripts.filter(x=>x!==name);else enabledScripts.push(name);
 persistScripts();refreshSaved();executeEnabled(false);draw();
 $('diagnostics').textContent=(enabledScripts.includes(name)?'تم تشغيل ':'تم إيقاف ')+name;
}
$('indicatorList').onclick=e=>{const b=e.target.closest('button[data-indicator]');if(b)toggleSavedIndicator(b.dataset.indicator)};
function loadSaved(){
 try{savedScripts=JSON.parse(localStorage.getItem('pinelab:scripts')||'[]')}catch(e){savedScripts=[]}
 try{enabledScripts=JSON.parse(localStorage.getItem('pinelab:enabled')||'[]')}catch(e){enabledScripts=[]}
 try{const native=window.PineLab?JSON.parse(PineLab.loadScripts()):[];native.forEach(s=>{if(!savedScripts.some(x=>x.name===s.name))savedScripts.push(s)})}catch(e){}
 refreshSaved();
}
$('save').onclick=()=>{
 const n=$('scriptName').value.trim()||'My Indicator',source=$('source').value;
 const i=savedScripts.findIndex(s=>s.name===n);
 if(i>=0)savedScripts[i].source=source;else savedScripts.push({name:n,source});
 if(!enabledScripts.includes(n))enabledScripts.push(n);
 persistScripts();refreshSaved();executeEnabled(false);draw();
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
 toggleSavedIndicator(n);
};
function queueExecuteAndDraw(){if(executeFrame)return;executeFrame=requestAnimationFrame(()=>{executeFrame=0;executeEnabled(false);draw()})}
function executeEnabled(showStatus){
 const engine=window.PineLabEngine;
 if(!engine){if(showStatus)$('diagnostics').textContent='محرك Pine غير موجود في هذه النسخة.';return false}
 const active=savedScripts.filter(s=>enabledScripts.includes(s.name));
 if(!active.length){activePlots=[];activeViz=null;if(showStatus)$('diagnostics').textContent='لا توجد مؤشرات مفعّلة.';return false}
 const visibleBarsData=bars.slice(0,cursor);const data={open:visibleBarsData.map(b=>b.o),high:visibleBarsData.map(b=>b.h),low:visibleBarsData.map(b=>b.l),close:visibleBarsData.map(b=>b.c),volume:visibleBarsData.map(b=>b.v),time:visibleBarsData.map(b=>b.t)};
 const outputs=[],failures=[];
 for(const s of active){
  const out=engine.execute(s.source,data,tfString(),{},$('symbol').value);
  if(!out.ok){failures.push(s.name+': '+(out.errors||['تعذر التشغيل']).join(' / '));continue}
  outputs.push(out);
 }
 if(!outputs.length){activePlots=[];activeViz=null;if(showStatus)$('diagnostics').textContent='فشل تشغيل المؤشرات المفعّلة: '+failures.join(' | ');return false}
 activePlots=outputs.flatMap(o=>o.plots||[]);
 const keys=['shapes','chars','arrows','candles','plotbars','hlines','fills','drawings','bgcolors','barcolors','plots'];
 activeViz={};
 keys.forEach(k=>activeViz[k]=outputs.flatMap(o=>o.viz&&o.viz[k]?(Array.isArray(o.viz[k])?o.viz[k]:[o.viz[k]]):[]));
 if(showStatus)$('diagnostics').textContent='نجح '+outputs.length+' من '+active.length+' مؤشر — '+activePlots.length+' سلسلة رسم. المحرك Resin '+outputs[0].version+'.'+(failures.length?' أخطاء: '+failures.join(' | '):'');
 return true;
}
$('run').onclick=()=>{executeEnabled(true);draw()};
function restore(){
 loadSaved();
 if(savedScripts.length){const first=savedScripts[0];$('scriptName').value=first.name;$('source').value=first.source;if(!enabledScripts.length)enabledScripts.push(first.name);refreshSaved();executeEnabled(false);draw()}
}
const chartCanvas=$('chart');
$('fitChart').onclick=()=>{followLatest=true;visibleBars=Math.min(100,Math.max(20,cursor));viewStart=Math.max(0,cursor-visibleBars*.8);priceZoom=1;priceShift=0;draw()};
$('expandChart').onclick=()=>{const card=chartCanvas.closest('.chartCard');card.classList.toggle('fullscreen');$('expandChart').textContent=card.classList.contains('fullscreen')?'تصغير':'تكبير';setTimeout(draw,80)};
function pointerDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function pointerMidpoint(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
chartCanvas.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'&&e.button!==0)return;
 chartCanvas.setPointerCapture(e.pointerId);activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});followLatest=false;chartCanvas.classList.add('dragging');
 if(activePointers.size===1)dragState={x:e.clientX,y:e.clientY,start:viewStart===null?Math.max(0,cursor-visibleBars*.8):viewStart,shift:priceShift};
 else if(activePointers.size===2){const pts=[...activePointers.values()],mid=pointerMidpoint(pts[0],pts[1]),rect=chartCanvas.getBoundingClientRect();pinchState={distance:Math.max(1,pointerDistance(pts[0],pts[1])),visible:visibleBars,priceZoom,priceShift,anchor:viewStart+(mid.x-rect.left)/rect.width*visibleBars,midY:mid.y};dragState=null;}
});
chartCanvas.addEventListener('pointermove',e=>{
 if(!activePointers.has(e.pointerId))return;activePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const rect=chartCanvas.getBoundingClientRect();
 if(activePointers.size>=2&&pinchState){const pts=[...activePointers.values()],mid=pointerMidpoint(pts[0],pts[1]),distance=Math.max(1,pointerDistance(pts[0],pts[1])),ratio=pinchState.distance/distance,mx=(mid.x-rect.left)/rect.width;
 visibleBars=Math.max(8,Math.min(500,pinchState.visible*ratio));viewStart=pinchState.anchor-mx*visibleBars;priceZoom=Math.max(.25,Math.min(12,pinchState.priceZoom/ratio));priceShift=pinchState.priceShift-(mid.y-pinchState.midY)/(rect.height-36)*priceZoom;queueDraw();return;}
 if(dragState&&activePointers.size===1){viewStart=dragState.start-(e.clientX-dragState.x)/(rect.width/visibleBars);priceShift=dragState.shift-(e.clientY-dragState.y)/(rect.height-36)*priceZoom;queueDraw();}
});
function releasePointer(e){activePointers.delete(e.pointerId);if(activePointers.size<2)pinchState=null;if(activePointers.size===1){const p=[...activePointers.values()][0];dragState={x:p.x,y:p.y,start:viewStart,shift:priceShift};}else dragState=null;if(activePointers.size===0)chartCanvas.classList.remove('dragging');}
chartCanvas.addEventListener('pointerup',releasePointer);chartCanvas.addEventListener('pointercancel',releasePointer);chartCanvas.addEventListener('lostpointercapture',releasePointer);
chartCanvas.addEventListener('wheel',e=>{e.preventDefault();const rect=chartCanvas.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width;if(e.shiftKey){const old=priceZoom;priceZoom=Math.max(.25,Math.min(12,priceZoom*(e.deltaY<0?1.12:.89)));priceShift+=(priceZoom-old)*(0.5-priceShift);}else{const old=visibleBars;visibleBars=Math.max(8,Math.min(500,visibleBars*(e.deltaY<0?.88:1.136)));viewStart=viewStart+x*old-x*visibleBars;}followLatest=false;draw();},{passive:false});
chartCanvas.addEventListener('dblclick',()=>$('fitChart').click());
window.addEventListener('resize',draw);generate();restore();
})();