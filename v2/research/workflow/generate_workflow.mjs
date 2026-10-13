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
let V=[`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Typical protein and antibody screening workflow"><rect width="${W}" height="${H}" fill="white"/>`];
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
async function icon(name,x,y,size=40,tint=C.teal){await asset('icons/'+name+'.svg',x,y,size,size,'Lucide '+name,tint);}

rect(100,60,10,105,C.teal,'none',0);
text(141,59,2159,76,'Typical protein / antibody screening workflow',56,C.ink,true);
text(141,136,2159,40,'From DNA constructs to functional evidence: the life science tools behind each step',29,C.muted);
text(141,184,2159,28,'Example: sequence-defined antibody candidates screened against a protein target',22,C.muted);
line(100,229,2300,229);

rect(1245,245,795,907,'#EEF6FC','#7399C6',18,1.5);
text(100,255,735,31,'BUILD  ·  Make physical samples',23,C.blue,true);
text(872,255,365,31,'TEST  ·  Find binders',23,C.teal,true);
text(1274,258,738,30,'AI learning needs depth per molecule',24,C.teal,true);
text(1274,293,738,26,'Potential constraint: comparable, reproducible assay data',19,C.muted);
text(2050,255,250,31,'LEARN  ·  Iterate',23,C.green,true);

const stages=[
 {x:100,w:365,n:'01',icon:'dna',title:'Construct design /\nDNA synthesis',objective:'Encode antibody candidates\nas DNA constructs',output:'Sequence + construct',reagents:'Oligos / gene fragments\nPCR enzymes, vectors\nCloning reagents',instruments:'Thermocycler\nSpectrophotometer\nLiquid handling workstation',consumables:'PCR / deep-well plates\nTubes, pipette tips',suppliers:'Tsingke · Vazyme\nThermo Fisher',logos:[['twist-trim.png',126,43],['genscript-trim.png',153,43]]},
 {x:486,w:365,n:'02',icon:'flask-conical',title:'Protein expression\n& purification',objective:'Produce candidate antibodies\nand target-protein samples',output:'Purified samples + yield',reagents:'Cells, media, transfection\nAffinity resin, buffers',instruments:'Shaker / bioreactor*\nÄKTA / FPLC system\nCentrifuge',consumables:'Flasks / culture bags*\nColumns, filters, tubes',suppliers:'GenScript · ACROBiosystems\nSino Biological · Gibco\nOPM · Duoning',logos:[['cytiva-trim.png',151,43]]},
 {x:872,w:365,n:'03',icon:'test-tubes',title:'Primary binding\nscreen',objective:'Identify binders and\nrank initial binding signals',output:'Hit / binding signal',reagents:'Recombinant target proteins\nAntibody candidates\nDetection reagents, buffers',instruments:'ELISA / plate reader\nBLI or SPR platform',consumables:'96 / 384-well plates\nBLI sensors / SPR chips\nSealing films, sample tubes',suppliers:'Sino Biological · Bioss\nSartorius · Cytiva · Tecan\nJET Biofil',logos:[['acro-trim.png',156,47]]},
 {x:1258,w:385,n:'04',icon:'microscope',title:'Multi-property\ncharacterization',objective:'Evaluate binding, specificity\nand developability risks',output:'KD · kon · koff · expression†\nTm · aggregation\npolyreactivity · epitope binning',reagents:'Reference proteins, dyes\nAssay panels, buffers\nAnalytical reagents',instruments:'SPR / BLI; SEC-HPLC\nLC / LC-MS\nnanoDSF / DLS',consumables:'Columns, capillaries\nVials, filters, assay plates\nSensors / chips',suppliers:'Waters · Agilent · Thermo Fisher\nNanoTemper · Sepax\nSPR / BLI: Cytiva · Sartorius',logos:[]},
 {x:1664,w:365,n:'05',icon:'pipette',title:'Cell-function\nvalidation',objective:'Test activity in a relevant\ncellular model',output:'Cell potency',reagents:'Cell models, media, cytokines\nStaining antibodies\nReporter-assay reagents',instruments:'Flow cytometer\nHigh-content imaging\nPlate reader',consumables:'Cell-culture plates / flasks\nPipette tips, filters',suppliers:'Gibco · OPM · Vazyme · Bio-Techne\nMolecular Devices · Corning\nWaters Biosciences (ex-BD)',logos:[['jet-english.png',192,49]]},
 {x:2050,w:250,n:'06',icon:'database',title:'Data integration\n& feedback',objective:'Link assay results\nto the next AI design',output:'Traceable training data',reagents:'No direct\nassay reagents',instruments:'LIMS / ELN\nLinked data platform\nLab orchestration',consumables:'No direct\nassay consumables',suppliers:'Hamilton\nBenchling · Genedata',logos:[['tecan-trim.png',177,40]]}
];

for(let i=0;i<stages.length;i++){
 const d=stages[i],x=d.x,w=d.w,inner=w-44,highlight=i===3||i===4;
 // A pale offset gives a restrained shadow in both SVG and native PowerPoint.
 rect(x+3,343,w,802,'#EEF6FC','none',14);
 rect(x,338,w,802,C.white,highlight?'#7399C6':C.line,14,highlight?1.7:1.1);
 rect(x+1,339,w-2,11,highlight?C.teal:i<2?C.blue:C.green,'none',0);
 text(x+22,365,inner-48,39,d.n+'  /  '+(i<2?'BUILD':i<5?'TEST':'LEARN'),20,highlight?C.teal:C.muted,true);
 await icon(d.icon,x+w-63,362,39);
 text(x+22,418,inner,84,d.title,i===5?28:31,C.ink,true);
 text(x+22,508,inner,57,d.objective,i===5?20:21,C.muted);
 rect(x+17,578,w-34,75,highlight?C.aqua:C.grey,'none',7);
 if(i===3)text(x+28,588,w-56,59,d.output,18.5,C.teal,true);
 else {text(x+28,589,w-56,23,i===4?'LABEL':'OUTPUT',14.5,C.muted,true);text(x+28,619,w-56,28,d.output,i===5?18:20,C.teal,true);}
 const rows=[['REAGENTS',d.reagents],[i===5?'SYSTEMS / SOFTWARE':'INSTRUMENTS',d.instruments],['CONSUMABLES',d.consumables]];
 for(let r=0;r<3;r++){const y=660+r*100;text(x+22,y,inner,22,rows[r][0],16.5,C.muted,true);text(x+22,y+29,inner,64,rows[r][1],i===5?18:19.5,C.ink);}
 line(x+22,970,x+w-22,970);
 text(x+22,984,inner,23,'REPRESENTATIVE SUPPLIERS',i===5?14:15.5,C.muted,true);
 if(i===3){await asset('logos/nanomicro-emblem.svg',x+22,1013,37,37,'Original NanoMicro emblem');text(x+69,1021,inner-47,29,'NanoMicro',25,C.teal,true);}
 else {let lx=x+22;for(const [file,lw,lh] of d.logos){await asset('logos/'+file,lx,1013,lw,lh,'Original '+file.split('-')[0]+' company logo');lx+=lw+16;}}
 text(x+22,1072,inner,69,d.suppliers,i===3||i===4?16.5:17,C.muted);
}
for(let i=0;i<stages.length-1;i++){const a=stages[i],b=stages[i+1];arrow(a.x+a.w+3,477,b.x-4,477,C.teal,2.2);}

// Curved return path remains a native editable freeform shape.
const loopX=282,loopY=1140,loopW=1893,loopH=35;
S.shapes.add({geometry:'custom',name:'Assay feedback to next design cycle',position:{left:loopX,top:loopY,width:loopW,height:loopH},fill:'none',line:{fill:C.teal,width:2},customPaths:[{width:loopW,height:loopH,commands:[{moveTo:{x:loopW,y:0}},{cubicBezTo:{x1:loopW,y1:30,x2:loopW-10,y2:35,x:loopW-40,y:35}},{lineTo:{x:40,y:35}},{cubicBezTo:{x1:10,y1:35,x2:0,y2:30,x:0,y:0}}]}]});
V.push(`<path d="M2175 1140 C2175 1170 2165 1175 2135 1175 L322 1175 C292 1175 282 1170 282 1140" fill="none" stroke="${C.teal}" stroke-width="2"/>`);
poly([[282,1138],[277,1148],[287,1148]],C.teal);
rect(825,1157,798,34,C.white,'none',0);text(825,1161,798,28,'Sequence + assay context + results → next design cycle',22,C.teal,false,'center');

rect(100,1200,2200,55,C.ink,'none',9);await icon('bot',122,1209,37,'#ACD4F1');
text(180,1208,2056,39,'Automation + data orchestration span every step',30,C.white,true);
text(100,1269,2200,31,'Wet lab = build + test. AI may test fewer molecules while increasing characterization depth per molecule.',23,C.ink,true);
text(100,1303,2200,27,'LST demand depends on molecule count × assay depth × net inputs per assay; instrument investment is separate.',20,C.muted);
text(100,1327,2200,20,'Illustrative workflow; assays may run in parallel. * Scale-dependent. † Expression comes from stage 2. Supplier examples and primary sources: SOURCES.md.',14,C.muted);

S.speakerNotes.text='The diagram maps an example antibody screening program to representative tools and suppliers. Stages 4–5 are potential data-generation constraints, not universally established bottlenecks. Net LST spending depends on funded workflow volume, assay depth, input use and price; shared preparation and readouts should not be double counted. Automation may reduce consumption per measurement. All figures are English, and all text, card frames and arrows are native editable objects. Logos and original Lucide icons are images.\n\n'+await fs.readFile(OUT+'/SOURCES.md','utf8');
V.push('</svg>');const stem='15_protein_antibody_screening_workflow';await fs.writeFile(OUT+'/svg/'+stem+'.svg',V.join('\n'));
const png=await P.export({slide:S,format:'png',scale:1});await fs.writeFile(BUILD+'/native-preview.png',new Uint8Array(await png.arrayBuffer()));
const candidate=BUILD+'/candidate.pptx';await(await PresentationFile.exportPptx(P)).save(candidate);
const final=process.env.WORKFLOW_PPTX_OUTPUT||OUT+'/Protein_antibody_workflow_palette_v2.pptx';
const result=await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath:final,pythonExecutable:process.env.RUNTIME_PYTHON,integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','22860000,12858750','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],explicitTotalSlideCount:1,fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:BUILD+'/validation-'+Date.now()+'.json'});
console.log(JSON.stringify({pptx:final,slides:1,validation:result}));
