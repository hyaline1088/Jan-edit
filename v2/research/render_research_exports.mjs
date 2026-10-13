import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const OUT=path.dirname(fileURLToPath(import.meta.url)),WORK=path.join(OUT,'.build');
await fs.mkdir(WORK+'/pdf-pages',{recursive:true});
await fs.mkdir(WORK+'/backgrounds',{recursive:true});
const figures=JSON.parse(await fs.readFile(OUT+'/figure-manifest.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2.5});
 const labels=[],report=[];
 for(const figure of figures){
  const file=figure.svg.split('/').pop(),stem=file.replace('.svg','');
  let source=await fs.readFile(OUT+'/svg/'+file,'utf8');
  await page.setContent('<html lang="en"><head><style>@page{size:20in 11.25in;margin:0}html,body{width:1920px;height:1080px;margin:0}svg{display:block;width:1920px;height:1080px}</style></head><body>'+source+'</body></html>');
  await page.evaluate(()=>document.fonts.ready);
  const repaired=figure.figure<=10?await page.evaluate(()=>{
   const nums=c=>{const v=c.match(/[\d.]+/g);return v? v.slice(0,3).map(Number):[255,255,255]};
   const lum=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   const contrast=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
   let fixes=0;
   for(const node of document.querySelectorAll('svg text')){
    if(!node.textContent.trim())continue;
    const r=node.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;
    const behind=document.elementsFromPoint(x,y).find(el=>['path','rect','polygon','circle','ellipse'].includes(el.localName)&&!el.closest('text')&&getComputedStyle(el).fill!=='none');
    const bg=behind?nums(getComputedStyle(behind).fill):[255,255,255],fg=nums(getComputedStyle(node).fill),size=parseFloat(getComputedStyle(node).fontSize);
    const white=[255,255,255],navy=[0,53,95];
    if(contrast(fg,bg)<(size>=24?3:4.5)){
     node.style.fill=contrast(white,bg)>contrast(navy,bg)?'#FFFFFF':'#00355F';fixes++;
    }
   }
   return fixes;
  }):0;
  if(repaired){source=await page.locator('svg').evaluate(el=>new XMLSerializer().serializeToString(el));await fs.writeFile(OUT+'/svg/'+file,source);}
  const bounds=await page.evaluate(()=>[...document.querySelectorAll('svg text')].filter(n=>n.textContent.trim()).map(n=>{const b=n.getBoundingClientRect();return {text:n.textContent,x:b.x,y:b.y,w:b.width,h:b.height}}).filter(b=>b.x<-.5||b.y<-.5||b.x+b.w>1920.5||b.y+b.h>1080.5));
  if(bounds.length)throw Error('Text outside figure '+figure.figure+': '+JSON.stringify(bounds));
  await page.screenshot({path:OUT+'/png/'+stem+'.png'});
  await page.pdf({path:WORK+'/pdf-pages/'+String(figure.figure).padStart(2,'0')+'.pdf',width:'20in',height:'11.25in',printBackground:true,preferCSSPageSize:true});
  const metrics=await page.evaluate(()=>[...document.querySelectorAll('svg text')].filter(n=>n.textContent.trim()).map(node=>{
   const style=getComputedStyle(node),matrix=node.getCTM(),size=parseFloat(style.fontSize);
   const lineNodes=node.children.length?[...node.children]:[node];
   const lines=lineNodes.map(n=>n.textContent);
   const width=Math.max(...lineNodes.map(n=>n.getComputedTextLength()))+size*.65;
   const first=node.getStartPositionOfChar(0),anchor=style.textAnchor,offset=anchor==='middle'?.5:anchor==='end'?1:0;
   const anchorX=first.x+lineNodes[0].getComputedTextLength()*offset;
   const lineStep=lineNodes.length>1?lineNodes[1].getStartPositionOfChar(0).y-first.y:size*1.25;
   const height=size*1.25+(lines.length-1)*lineStep;
   const x=anchorX-width*offset-(offset===0?size*.04:0),y=first.y-size*.84;
   const center=new DOMPoint(x+width/2,y+height/2).matrixTransform(matrix),scale=Math.hypot(matrix.a,matrix.b);
   return {text:lines.join('\n'),fontFamily:style.fontFamily.split(',')[0].replaceAll('"',''),fontSize:size*scale,color:style.fill,bold:Number(style.fontWeight)>=600,alignment:anchor==='middle'?'center':anchor==='end'?'right':'left',rotation:Math.atan2(matrix.b,matrix.a)*180/Math.PI,left:center.x-width*scale/2,top:center.y-height*scale/2,width:width*scale,height:height*scale,lineStep:lineStep*scale};
  }));
  await page.evaluate(()=>document.querySelectorAll('svg text').forEach(n=>n.remove()));
  const background=WORK+'/backgrounds/'+String(figure.figure).padStart(2,'0')+'.png';
  await page.screenshot({path:background});
  labels.push({...figure,background,labels:metrics});
  report.push({figure:figure.figure,labels:metrics.length,contrastFixes:repaired,textOutsideCanvas:bounds.length});
 }
 await fs.writeFile(WORK+'/text-metrics.json',JSON.stringify(labels,null,2));
 await fs.writeFile(WORK+'/render-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({figures:report.length,nativeTextLabels:labels.reduce((s,f)=>s+f.labels.length,0),report}));
}finally{await browser.close();}
