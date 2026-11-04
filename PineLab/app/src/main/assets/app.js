(() => {
'use strict';
const $=id=>document.getElementById(id);
let bars=[],cursor=300,timer=null,seed=73421,activePlots=[],activeViz=null,savedScripts=[],enabledScripts=[];
let viewStart=null,followLatest=true,priceZoom=1,priceShift=0,replayStart=20,dragState=null;
const DAY=86400000, BASE=Date.UTC(2025,0,1), HISTORY_DAYS=10;
function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function tfMinutes(){const v=$('timeframe').value;return v==='D'?1440:Number(v)}
function tfString(){return $('timeframe').value==='D'?'D':$('timeframe').value}
function generate(){
 seed=73421;bars=[];let p=$('symbol').value==='XAUUSD'?2350:$('symbol').value==='BTCUSD'?65000:$('symbol').value==='US100'?18000:1.08;
 const step=tfMinutes()*60000;
 const count=Math.max(300,Math.min(10000,Math.ceil(HISTORY_DAYS*1440/tfMinutes())));
 for(let i=0;i<count;i++){const o=p,move=(random()-.49)*(p>100?2.2:.008);const c=Math.max(.0001,o+move);const h=Math.max(o,c)+random()*(p>100?1.2:.004);const l=Math.min(o,c)-random()*(p>100?1.2:.004);bars.push({t:BASE+i*step,o,h,l,c,v:100+Math.floor(random()*900)});p=c}
 cursor=bars.length;viewStart=Math.max(0,cursor-80);followLatest=true;priceZoom=1;priceShift=0;replayStart=20;activePlots=[];activeViz=null;$('replayRange').min=replayStart;$('replayRange').max=bars.length;$('replayRange').value=cursor;executeEnabled(false);draw();
}
function draw(){
 const canvas=$('chart'),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
 canvas.width=Math.max(1,Math.floor(rect.width*dpr));canvas.height=Math.max(1,Math.floor(rect.height*dpr));
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;
 c.fillStyle='#101827';c.fillRect(0,0,w,h);
 const slotCount=100;
 if(viewStart===null)viewStart=Math.max(0,cursor-80);
 const start=Math.max(0,Math.min(Math.max(0,bars.length-slotCount),Math.floor(viewStart)));
 const dataStart=Math.max(0,start),dataEnd=Math.min(cursor,start+slotCount),visible=bars.slice(dataStart,dataEnd);if(!visible.length)return;
 let vals=visible.flatMap(b=>[b.l,b.h]);
 for(const p of activePlots)for(let i=dataStart;i<cursor;i++){const v=p.values[i];if(Number.isFinite(v))vals.push(v)}
 if(activeViz&&activeViz.hlines)activeViz.hlines.forEach(q=>{if(Number.isFinite(q.price))vals.push(q.price)});
 if(activeViz&&activeViz.drawings)activeViz.drawings.forEach(d=>{const s=d.state||{};['y','y1','y2','top','bottom'].forEach(k=>{if(Number.isFinite(s[k]))vals.push(s[k])})});
 let lo=Math.min(...vals),hi=Math.max(...vals);const pad=(hi-lo)*.08||1;lo-=pad;hi+=pad;
 const y=v=>h-18-(((v-lo)/(hi-lo)-0.5)*priceZoom+0.5+priceShift)*(h-36),cw=w/slotCount;
 c.strokeStyle='#263449';c.lineWidth=1;for(let i=1;i<5;i++){let yy=h*i/5;c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke()}
 if(activeViz&&activeViz.bgcolors)activeViz.bgcolors.forEach(bg=>{for(let i=dataStart;i<cursor;i++){const col=(bg.colors&&bg.colors[i])||bg.color;if(!col)continue;c.globalAlpha=.12;c.fillStyle=col;c.fillRect((i-start)*cw,0,cw,h)}c.globalAlpha=1});
 visible.forEach((b,i)=>{const abs=dataStart+i,x=(abs-start+.5)*cw,up=b.c>=b.o;let col=up?'#22c59a':'#f06470';if(activeViz&&activeViz.barcolors){for(const bc of activeViz.barcolors){const q=(bc.colors&&bc.colors[abs])||bc.color;if(q)col=q}}c.strokeStyle=col;c.fillStyle=col;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();let top=y(Math.max(b.o,b.c)),bottom=y(Math.min(b.o,b.c));c.fillRect(x-Math.max(1,cw*.28),top,Math.max(2,cw*.56),Math.max(1,bottom-top))});
 if(activeViz&&activeViz.fills)activeViz.fills.forEach(f=>{if(!f.a||!f.b)return;const series=(ref)=>ref.kind==='plot'?(activePlots[ref.index]&&activePlots[ref.index].values):(activeViz.hlines[ref.index]?[...Array(cursor)].map(()=>activeViz.hlines[ref.index].price):null);const a=series(f.a),b=series(f.b);if(!a||!b)return;c.beginPath();let started=false;for(let i=dataStart;i<dataEnd;i++){if(!Number.isFinite(a[i])||!Number.isFinite(b[i]))continue;const x=(i-start+.5)*cw;if(!started){c.moveTo(x,y(a[i]));started=true}else c.lineTo(x,y(a[i]))}for(let i=dataEnd-1;i>=dataStart;i--){if(Number.isFinite(b[i]))c.lineTo((i-start+.5)*cw,y(b[i]))}if(started){c.closePath();c.globalAlpha=.16;c.fillStyle=(f.colors&&f.colors[cursor-1])||f.color||'#8294aa';c.fill();c.globalAlpha=1}});
 activeViz&&activeViz.hlines&&activeViz.hlines.forEach(line=>{if(!Number.isFinite(line.price))return;c.strokeStyle=line.color||'#a5b3c7';c.lineWidth=line.linewidth||1;c.setLineDash(line.linestyle==='dashed'?[6,4]:line.linestyle==='dotted'?[2,3]:[]);c.beginPath();c.moveTo(0,y(line.price));c.lineTo(w,y(line.price));c.stroke();c.setLineDash([])});
 activePlots.forEach((p,pi)=>{const meta=activeViz&&activeViz.plots?activeViz.plots[pi]:null,style=meta&&meta.style||'line',base=meta&&Number.isFinite(meta.histbase)?meta.histbase:0,baseY=y(base),color=(meta&&meta.color)||['#f5a742','#48c9ee','#d48aff','#f078a6'][pi%4];c.lineWidth=meta?Math.max(1,meta.linewidth||2):2;c.strokeStyle=color;c.fillStyle=color;
 if(style==='histogram'||style==='columns'){for(let i=dataStart;i<dataEnd;i++){const v=p.values[i];if(!Number.isFinite(v))continue;const x=(i-start+.5)*cw,yy=y(v),col=(meta&&meta.colors&&meta.colors[i])||color;c.fillStyle=col;c.fillRect(x-cw*.32,Math.min(yy,baseY),Math.max(1,cw*.64),Math.max(1,Math.abs(baseY-yy)))}return}
 if(style==='circles'||style==='cross'){for(let i=dataStart;i<dataEnd;i++){const v=p.values[i];if(!Number.isFinite(v))continue;const x=(i-start+.5)*cw,yy=y(v),col=(meta&&meta.colors&&meta.colors[i])||color;c.strokeStyle=col;c.fillStyle=col;if(style==='circles'){c.beginPath();c.arc(x,yy,Math.max(2,c.lineWidth+1),0,Math.PI*2);c.fill()}else{c.beginPath();c.moveTo(x-4,yy);c.lineTo(x+4,yy);c.moveTo(x,yy-4);c.lineTo(x,yy+4);c.stroke()}}return}
 c.beginPath();let begun=false,points=[];for(let i=dataStart;i<dataEnd;i++){const v=p.values[i];if(!Number.isFinite(v)){begun=false;continue}const x=(i-start+.5)*cw,yy=y(v);if(!begun){c.moveTo(x,yy);begun=true}else if(style==='stepline'){const prev=p.values[i-1];c.lineTo(x,y(prev));c.lineTo(x,yy)}else c.lineTo(x,yy);points.push([x,yy])}c.stroke();
 if(style==='area'&&points.length){c.beginPath();c.moveTo(points[0][0],baseY);points.forEach(pt=>c.lineTo(pt[0],pt[1]));c.lineTo(points[points.length-1][0],baseY);c.closePath();c.globalAlpha=.18;c.fillStyle=color;c.fill();c.globalAlpha=1}
 });
 if(activeViz&&activeViz.candles)activeViz.candles.concat(activeViz.plotbars||[]).forEach(series=>{for(let i=dataStart;i<cursor;i++){const j=i-start,o=series.open[i],hh=series.high[i],ll=series.low[i],cl=series.close[i];if(![o,hh,ll,cl].every(Number.isFinite))continue;const x=(j+.5)*cw,col=(series.colors&&series.colors[i])||series.color||(cl>=o?'#22c59a':'#f06470');c.strokeStyle=series.wickcolor||col;c.fillStyle=col;c.lineWidth=1;c.beginPath();c.moveTo(x,y(hh));c.lineTo(x,y(ll));c.stroke();const top=y(Math.max(o,cl)),bottom=y(Math.min(o,cl)),body=Math.max(1,bottom-top),bw=Math.max(2,cw*.48);c.fillRect(x-bw/2,top,bw,body);if(series.bordercolor){c.strokeStyle=series.bordercolor;c.strokeRect(x-bw/2,top,bw,body)}}});
 if(activeViz&&activeViz.chars)activeViz.chars.forEach(s=>{for(let i=dataStart;i<cursor;i++){if(!s.condition[i])continue;const b=bars[i],x=(i-start+.5)*cw,yy=s.location==='belowbar'?y(b.l)-10:s.location==='abovebar'?y(b.h)+10:y(b.c);c.font='12px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=(s.colors&&s.colors[i])||s.color||s.textcolor||'#f2c14e';c.fillText(s.char||s.text||'•',x,yy)}});
 if(activeViz&&activeViz.arrows)activeViz.arrows.forEach(s=>{for(let i=dataStart;i<cursor;i++){const v=s.values[i];if(!Number.isFinite(v)||v===0)continue;const x=(i-start+.5)*cw,yy=y(v),up=v>0;c.fillStyle=up?(s.colorup||'#22c59a'):(s.colordown||'#f06470');c.beginPath();c.moveTo(x,yy+(up? -7:7));c.lineTo(x-5,yy+(up?5:-5));c.lineTo(x+5,yy+(up?5:-5));c.closePath();c.fill()}});
 if(activeViz&&activeViz.shapes)activeViz.shapes.forEach(s=>{for(let i=dataStart;i<cursor;i++){if(!s.condition[i])continue;const b=bars[i],x=(i-start+.5)*cw,yy=s.location==='belowbar'?y(b.l)-8:s.location==='abovebar'?y(b.h)+8:y(b.c);c.fillStyle=(s.colors&&s.colors[i])||s.color||'#f2c14e';c.beginPath();c.arc(x,yy,3.5,0,Math.PI*2);c.fill();if(s.text){c.font='11px Arial';c.fillText(s.text,x+5,yy-5)}}});
 const xCoord=v=>{if(!Number.isFinite(v))return NaN;let idx=Math.round(v);if(activeViz&&activeViz.drawings&&activeViz.drawings.some(d=>d.state&&d.state.xloc==='bar_time')&&v>1e11){let best=0,dist=Infinity;bars.forEach((b,i)=>{const d=Math.abs(b.t-v);if(d<dist){dist=d;best=i}});idx=best}return (idx-start+.5)*cw};
 if(activeViz&&activeViz.drawings)activeViz.drawings.forEach(d=>{const s=d.state||{};c.save();if(d.kind==='line'){const x1=xCoord(s.x1),x2=xCoord(s.x2);if(Number.isFinite(x1)&&Number.isFinite(x2)&&Number.isFinite(s.y1)&&Number.isFinite(s.y2)){c.strokeStyle=s.color||'#f4c95d';c.lineWidth=s.width||1.5;c.setLineDash(s.style==='dashed'?[7,5]:s.style==='dotted'?[2,4]:[]);const ext=s.extend||'none',left=ext==='left'||ext==='both',right=ext==='right'||ext==='both';let ax=x1,bx=x2;if(left||right){const dx=x2-x1,dy=y(s.y2)-y(s.y1);if(dx!==0){if(left)ax=0;if(right)bx=w;const yy1=y(s.y1)+(ax-x1)*(dy/dx),yy2=y(s.y1)+(bx-x1)*(dy/dx);c.beginPath();c.moveTo(ax,yy1);c.lineTo(bx,yy2)}else{c.beginPath();c.moveTo(x1,0);c.lineTo(x1,h)}}else{c.beginPath();c.moveTo(x1,y(s.y1));c.lineTo(x2,y(s.y2))}c.stroke();c.setLineDash([])}}else if(d.kind==='box'){const x1=xCoord(s.left),x2=xCoord(s.right);if(Number.isFinite(x1)&&Number.isFinite(x2)&&Number.isFinite(s.top)&&Number.isFinite(s.bottom)){const left=Math.min(x1,x2),top=y(Math.max(s.top,s.bottom)),ww=Math.abs(x2-x1),hh=Math.abs(y(s.top)-y(s.bottom));c.globalAlpha=.14;c.fillStyle=s.bgcolor||'#5c91c9';c.fillRect(left,top,ww,hh);c.globalAlpha=1;c.strokeStyle=s.border_color||'#5c91c9';c.lineWidth=s.border_width||1;c.strokeRect(left,top,ww,hh);if(s.text){c.font='11px Arial';c.fillStyle=s.text_color||'#ffffff';c.fillText(s.text,left+4,top+14)}}}else if(d.kind==='label'){const x=xCoord(s.x);if(Number.isFinite(x)&&Number.isFinite(s.y)){c.font=(s.size==='large'?'16px':s.size==='small'?'10px':'12px')+' Arial';c.fillStyle=s.textcolor||'#ffffff';c.textAlign='left';c.fillText(s.text||'',x,y(s.y))}}c.restore()});
 const last=visible[visible.length-1];$('price').textContent=last.c.toFixed(last.c>100?2:5);$('chartTitle').textContent=$('symbol').value+' · '+$('timeframe').selectedOptions[0].text;$('barsLabel').textContent=cursor+' / '+bars.length+' شمعة';$('cursorLabel').textContent='الشمعة '+cursor;
}
function stop(){if(timer){clearInterval(timer);timer=null}$('play').textContent='▶ تشغيل'}
function advance(){if(cursor<bars.length){cursor++;$('replayRange').value=cursor;if(followLatest)viewStart=Math.max(0,cursor-80);executeEnabled(false);draw()}else stop()}
$('regen').onclick=generate;$('symbol').onchange=generate;$('timeframe').onchange=generate;
$('step').onclick=()=>{stop();advance()};$('play').onclick=()=>{if(timer){stop();return}$('play').textContent='إيقاف';timer=setInterval(advance,Number($('replaySpeed').value)||500)};
$('reset').onclick=()=>{stop();cursor=replayStart;$('replayRange').value=cursor;if(followLatest)viewStart=Math.max(0,cursor-80);executeEnabled(false);draw()};
$('replaySpeed').onchange=()=>{if(timer){stop();$('play').click()}};
$('setReplayStart').onclick=()=>{replayStart=cursor;$('replayRange').min=replayStart;$('replayRange').value=cursor;$('diagnostics').textContent='تم تحديد بداية إعادة التشغيل عند الشمعة '+replayStart};
$('replayRange').oninput=e=>{stop();cursor=Number(e.target.value);if(followLatest)viewStart=Math.max(0,cursor-80);executeEnabled(false);draw()};
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
function executeEnabled(showStatus){
 const engine=window.PineLabEngine;
 if(!engine){if(showStatus)$('diagnostics').textContent='محرك Pine غير موجود في هذه النسخة.';return false}
 const active=savedScripts.filter(s=>enabledScripts.includes(s.name));
 if(!active.length){activePlots=[];activeViz=null;if(showStatus)$('diagnostics').textContent='لا توجد مؤشرات مفعّلة.';return false}
 const data={open:bars.slice(0,cursor).map(b=>b.o),high:bars.slice(0,cursor).map(b=>b.h),low:bars.slice(0,cursor).map(b=>b.l),close:bars.slice(0,cursor).map(b=>b.c),volume:bars.slice(0,cursor).map(b=>b.v),time:bars.slice(0,cursor).map(b=>b.t)};
 const outputs=[];
 for(const s of active){
  const out=engine.execute(s.source,data,tfString(),{},$('symbol').value);
  if(!out.ok){activePlots=[];activeViz=null;if(showStatus)$('diagnostics').textContent='خطأ في '+s.name+':\\n'+(out.errors||['تعذر التشغيل']).join('\\n');return false}
  outputs.push(out);
 }
 activePlots=outputs.flatMap(o=>o.plots||[]);
 const keys=['shapes','chars','arrows','candles','plotbars','hlines','fills','drawings','bgcolors','barcolors','plots'];
 activeViz={};
 keys.forEach(k=>activeViz[k]=outputs.flatMap(o=>o.viz&&o.viz[k]?(Array.isArray(o.viz[k])?o.viz[k]:[o.viz[k]]):[]));
 if(showStatus)$('diagnostics').textContent='نجح تشغيل '+active.length+' مؤشر/مؤشرات — '+activePlots.length+' سلسلة رسم. المحرك Resin '+outputs[0].version+'.';
 return true;
}
$('run').onclick=()=>{executeEnabled(true);draw()};
function restore(){
 loadSaved();
 if(savedScripts.length){const first=savedScripts[0];$('scriptName').value=first.name;$('source').value=first.source;if(!enabledScripts.length)enabledScripts.push(first.name);refreshSaved();executeEnabled(false);draw()}
}
const chartCanvas=$('chart');
$('fitChart').onclick=()=>{followLatest=true;viewStart=Math.max(0,cursor-80);priceZoom=1;priceShift=0;draw()};
$('expandChart').onclick=()=>{const card=chartCanvas.closest('.chartCard');card.classList.toggle('fullscreen');$('expandChart').textContent=card.classList.contains('fullscreen')?'تصغير':'تكبير';setTimeout(draw,80)};
chartCanvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;chartCanvas.setPointerCapture(e.pointerId);chartCanvas.classList.add('dragging');dragState={x:e.clientX,y:e.clientY,start:viewStart===null?Math.max(0,cursor-80):viewStart,shift:priceShift,zoom:priceZoom};followLatest=false});
chartCanvas.addEventListener('pointermove',e=>{if(!dragState)return;const rect=chartCanvas.getBoundingClientRect(),slots=100,cw=rect.width/slots;viewStart=dragState.start-(e.clientX-dragState.x)/cw;priceShift=dragState.shift+(e.clientY-dragState.y)/(rect.height-36)*priceZoom;draw()});
function endChartDrag(){dragState=null;chartCanvas.classList.remove('dragging')}
chartCanvas.addEventListener('pointerup',endChartDrag);chartCanvas.addEventListener('pointercancel',endChartDrag);chartCanvas.addEventListener('lostpointercapture',endChartDrag);
chartCanvas.addEventListener('wheel',e=>{e.preventDefault();const factor=e.deltaY<0?1.12:0.89;priceZoom=Math.max(.35,Math.min(8,priceZoom*factor));draw()},{passive:false});
chartCanvas.addEventListener('dblclick',()=>$('fitChart').click());
window.addEventListener('resize',draw);generate();restore();
})();