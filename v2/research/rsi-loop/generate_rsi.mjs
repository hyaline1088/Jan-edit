import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const OUT=path.dirname(fileURLToPath(import.meta.url)),ROOT=process.cwd(),BUILD=path.join(OUT,'.build');
const SKILL=process.env.PRESENTATIONS_SKILL_DIR;
if(!SKILL)throw Error('Set PRESENTATIONS_SKILL_DIR.');
const {resolvePresentationFont,finalizePresentation}=await import(pathToFileURL(SKILL+'/container_tools/artifact_tool_utils.mjs').href);
const FONT=resolvePresentationFont({fontFamily:'Arial'}),W=2400,H=1350;
const P=Presentation.create({slideSize:{width:W,height:H}}),S=P.slides.add();S.background.fill='#FFFFFF';
const C={ink:'#00355F',muted:'#00355F',teal:'#00355F',aqua:'#EEF6FC',mint:'#ACD4F1',blue:'#00355F',pale:'#EEF6FC',line:'#A5A5A5',white:'#FFFFFF',grey:'#F4F9FD',green:'#00355F'};
const ASSETS=ROOT+'/sites/ai-life-science-tools/dist/research/assets';
await fs.mkdir(OUT+'/svg',{recursive:true});await fs.mkdir(OUT+'/png',{recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let V=[`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Recursive self-improvement through AI design and biological validation"><rect width="${W}" height="${H}" fill="white"/>`];
function rect(x,y,w,h,fill=C.white,stroke=C.line,r=12,lw=1){S.shapes.add({geometry:r?'roundRect':'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:lw},borderRadius:r});V.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${lw}"/>`);}
function text(x,y,w,h,value,size=24,color=C.ink,bold=false,align='left'){
 const shape=S.shapes.add({geometry:'textbox',name:value.split('\n')[0],position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 shape.text=value;shape.text.style={fontFamily:FONT,typeface:FONT,fontSize:size,color,bold,alignment:align,verticalAlignment:'top',wrap:'none',insets:0,lineSpacing:1};
 const anchor=align==='center'?'middle':align==='right'?'end':'start',tx=align==='center'?x+w/2:align==='right'?x+w:x;
 V.push(`<text x="${tx}" y="${y+size*.9}" font-family="Arial,Arial Unicode MS,sans-serif" font-size="${size}" font-weight="${bold?600:400}" fill="${color}" text-anchor="${anchor}">${value.split('\n').map((line,index)=>`<tspan x="${tx}" dy="${index?size*1.25:0}">${esc(line)}</tspan>`).join('')}</text>`);
}
function line(x1,y1,x2,y2,color=C.line,lw=1){const x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.max(Math.abs(x2-x1),.1),h=Math.max(Math.abs(y2-y1),.1);S.shapes.add({geometry:'custom',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:color,width:lw},customPaths:[{width:w,height:h,commands:[{moveTo:{x:x1-x,y:y1-y}},{lineTo:{x:x2-x,y:y2-y}}]}]});V.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${lw}"/>`);}
function poly(points,fill){const x=Math.min(...points.map(p=>p[0])),y=Math.min(...points.map(p=>p[1])),w=Math.max(...points.map(p=>p[0]))-x,h=Math.max(...points.map(p=>p[1]))-y;S.shapes.add({geometry:'custom',position:{left:x,top:y,width:w,height:h},fill,line:{fill:'none',width:0},customPaths:[{width:w,height:h,commands:[{moveTo:{x:points[0][0]-x,y:points[0][1]-y}},...points.slice(1).map(([a,b])=>({lineTo:{x:a-x,y:b-y}})),{close:{}}]}]});V.push(`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}"/>`);}
function arrow(x1,y1,x2,y2,color=C.teal,lw=2){line(x1,y1,x2,y2,color,lw);const t=Math.atan2(y2-y1,x2-x1),a=10;poly([[x2,y2],[x2-a*Math.cos(t-.5),y2-a*Math.sin(t-.5)],[x2-a*Math.cos(t+.5),y2-a*Math.sin(t+.5)]],color);}
async function asset(file,x,y,w,h,alt,stroke){let bytes=await fs.readFile(ASSETS+'/'+file);const mime=file.endsWith('.svg')?'image/svg+xml':'image/png';if(stroke)bytes=Buffer.from(bytes.toString().replaceAll('currentColor',stroke));S.images.add({blob:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),contentType:mime,alt,position:{left:x,top:y,width:w,height:h},fit:'contain'});V.push(`<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:${mime};base64,${bytes.toString('base64')}" preserveAspectRatio="xMidYMid meet"/>`);}
async function icon(name,x,y,size=40){await asset('icons/'+name+'.svg',x,y,size,size,'Lucide '+name,C.teal);}

rect(100,60,10,105,C.teal,'none',0);
text(141,58,2159,77,'RSI: AI design and biological validation',56,C.ink,true);
text(141,137,2159,42,'How experimental feedback could improve both biological designs and the AI design process',29,C.muted);
text(141,186,2159,28,'RECURSIVE SELF-IMPROVEMENT  ·  CONCEPTUAL MECHANISM',20,C.teal,true);
line(100,229,2300,229);

rect(170,257,540,673,C.pale,'#7399C6',18);
rect(1680,257,540,673,C.aqua,'#7399C6',18);
text(200,276,480,31,'DIGITAL CAPABILITY',22,C.blue,true);
text(955,276,480,31,'EXPERIMENTAL STRATEGY',22,C.muted,true);
text(1710,276,480,31,'PHYSICAL GROUNDING',22,C.teal,true);

const nodes=[
 {x:200,y:315,n:'01',icon:'bot',title:'AI scientist · Model t',body:'Predict properties and uncertainty\nUse the current model / policy',fill:C.white},
 {x:955,y:315,n:'02',icon:'dna',title:'Design & prioritize',body:'Choose candidates and assays\nfor function and information',fill:C.white},
 {x:1710,y:315,n:'03',icon:'flask-conical',title:'Build physical molecules',body:'DNA synthesis, expression, purification\nPrepare samples for actual assays',fill:C.white},
 {x:1710,y:715,n:'04',icon:'microscope',title:'Validate in biology',body:'Binding, stability and cell function\nKeep failures as informative labels',fill:C.white},
 {x:955,y:715,n:'05',icon:'database',title:'Curate experimental data',body:'Link sequence, target and assay context\nRetain replicates, raw data and failures',fill:C.white},
 {x:200,y:715,n:'06',icon:'bot',title:'Improve model + policy',body:'Retrain / adapt models and selection\nBenchmark on held-out experiments',fill:C.white}
];
for(const d of nodes){
 rect(d.x+3,d.y+4,480,195,'#EEF6FC','none',13);
 rect(d.x,d.y,480,195,d.fill,d.x===200?'#7399C6':d.x===1710?'#7399C6':C.line,13,1.3);
 text(d.x+28,d.y+25,375,31,d.n+'  /  '+(d.n==='01'?'MODEL':d.n==='02'?'DESIGN':d.n==='03'?'BUILD':d.n==='04'?'TEST':d.n==='05'?'DATA':'LEARN'),18.5,C.muted,true);
 await icon(d.icon,d.x+411,d.y+22,39);
 text(d.x+28,d.y+75,424,42,d.title,31,C.ink,true);
 text(d.x+28,d.y+129,424,61,d.body,22.5,C.muted);
}

arrow(695,413,940,413,C.teal,3);arrow(1450,413,1695,413,C.teal,3);
text(722,376,180,29,'Proposals',20,C.muted,false,'center');
text(1474,376,195,29,'Protocols',20,C.muted,false,'center');
arrow(1695,813,1450,813,C.teal,3);arrow(940,813,695,813,C.teal,3);
text(1459,775,226,29,'Measurements',20,C.muted,false,'center');
text(705,775,224,29,'Training evidence',20,C.muted,false,'center');
arrow(1950,525,1950,700,C.teal,3);
arrow(440,700,440,525,C.blue,3);
text(211,560,206,100,'Deploy only\nverified\nimprovements',23,C.blue,true);
text(2000,561,184,100,'Throughput\nAssay quality\nMoney + time',23,C.teal,true);

text(755,548,885,98,'Better AI → better experiments\n→ better AI',38,C.ink,true,'center');
text(755,652,885,60,'Potential recursive gains need comparable,\nreproducible evidence from the physical world',22,C.muted,false,'center');

text(100,946,2200,38,'LST supports every return to physical biology',28,C.ink,true);
rect(100,994,2200,121,C.grey,C.line,10);
line(823,1013,823,1096);line(1563,1013,1563,1096);
await icon('dna',125,1016,35);text(176,1017,602,32,'BUILD',23,C.teal,true);
text(125,1062,657,45,'DNA synthesis · expression · purification',21,C.muted);
await icon('microscope',850,1016,35);text(901,1017,615,32,'TEST',23,C.teal,true);
text(850,1061,673,53,'Proteins · biosensors · analytical columns\nCell assays · measurement platforms',21,C.muted);
await icon('database',1590,1016,35);text(1641,1017,614,32,'CONNECT + SCALE',23,C.teal,true);
text(1590,1061,663,53,'Labware · automation · data platforms\nComparable records across batches',21,C.muted);

rect(100,1140,2200,79,C.ink,'none',9);
text(131,1161,2138,47,'The pace of improvement depends on useful experimental evidence per cycle',32,C.white,true,'center');
text(100,1240,2200,41,'Potential LST demand ∝ funded cycles × assay depth × net inputs per assay',29,C.ink,true);
text(100,1285,2200,29,'Automation and miniaturization can reduce inputs per measurement; instrument CAPEX is separate.',20,C.muted);
text(100,1323,2200,20,'Conceptual RSI mechanism. Closed-loop learning does not establish sustained autonomous RSI. Primary sources: SOURCES.md.',16,C.muted);

S.speakerNotes.text='The user confirmed RSI means recursive self-improvement. The diagram is a conceptual mechanism: experimental evidence can improve a model or persistent experimental policy, which then designs later experiments. The promotion gate requires independently validated gains. A fixed AI model generating better answers from new context, or an improved biological candidate, is not by itself evidence of recursive capability growth. The tool-demand expression is a qualitative procurement framework, not a numerical forecast.\n\n'+await fs.readFile(OUT+'/SOURCES.md','utf8');
V.push('</svg>');const stem='16_rsi_ai_design_biology_validation';await fs.writeFile(OUT+'/svg/'+stem+'.svg',V.join('\n'));
const png=await P.export({slide:S,format:'png',scale:1});await fs.writeFile(BUILD+'/native-preview.png',new Uint8Array(await png.arrayBuffer()));
const candidate=BUILD+'/candidate.pptx';await(await PresentationFile.exportPptx(P)).save(candidate);
const final=process.env.RSI_PPTX_OUTPUT||OUT+'/RSI_AI_biology_loop_palette.pptx';
const result=await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:final,pythonExecutable:process.env.RUNTIME_PYTHON,integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','22860000,12858750','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],explicitTotalSlideCount:1,fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:BUILD+'/validation-'+Date.now()+'.json'});
console.log(JSON.stringify({pptx:final,slides:1,validation:result}));

