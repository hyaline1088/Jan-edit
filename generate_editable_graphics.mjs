import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const cwd=path.dirname(fileURLToPath(import.meta.url)), OUT=cwd, TMP=path.join(cwd,'.build');
await fs.mkdir(TMP,{recursive:true});
const SKILL=process.env.PRESENTATIONS_SKILL_DIR;
if(!SKILL)throw new Error('Set PRESENTATIONS_SKILL_DIR to the installed Presentations skill directory.');
const {resolvePresentationFont,finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
const FONT=resolvePresentationFont({fontFamily:'Arial'});
const P=Presentation.create({slideSize:{width:1920,height:1080}});
const C={ink:'#152C3A',muted:'#647887',teal:'#007D80',aqua:'#EAF6F4',blue:'#2B62B1',pale:'#EAF0FA',gold:'#BB8D37',sand:'#FAF5EB',line:'#D7E3E8',white:'#FFFFFF',red:'#BB5360'};
await fs.mkdir(OUT+'/editable',{recursive:true});await fs.mkdir(OUT+'/svg',{recursive:true});await fs.mkdir(OUT+'/png',{recursive:true});
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let S,svg=[];
function start(){S=P.slides.add();S.background.fill=C.white;svg=['<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="white"/>'];return S;}
function rect(x,y,w,h,fill,stroke='none',r=0,lw=1){let sh=S.shapes.add({geometry:r?'roundRect':'rect',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:lw},borderRadius:r||0});svg.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${lw}"/>`);return sh;}
function text(x,y,w,h,t,size=24,color=C.ink,bold=false,align='left'){
 const sh=S.shapes.add({geometry:'textbox',name:t.split('\n')[0],position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});sh.text=t;sh.text.style={fontFamily:FONT,typeface:FONT,fontSize:size,color,bold,alignment:align,verticalAlignment:'top',wrap:'none',insets:0};
 const lines=t.split('\n'),anchor=align==='center'?'middle':align==='right'?'end':'start',tx=align==='center'?x+w/2:align==='right'?x+w:x;
 svg.push(`<text x="${tx}" y="${y+size*.84}" fill="${color}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" font-weight="${bold?700:400}" text-anchor="${anchor}">${lines.map((l,i)=>`<tspan x="${tx}" dy="${i?size*1.25:0}">${esc(l)}</tspan>`).join('')}</text>`);return sh;
}
function poly(points,fill,stroke='none',lw=1){const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;
 const commands=[{moveTo:{x:points[0][0]-x,y:points[0][1]-y}},...points.slice(1).map(([a,b])=>({lineTo:{x:a-x,y:b-y}})),{close:{}}];
 const sh=S.shapes.add({geometry:'custom',position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:lw},customPaths:[{width:w,height:h,commands}]});svg.push(`<polygon points="${points.map(p=>p.join(',')).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${lw}"/>`);return sh;}
function line(x1,y1,x2,y2,color=C.line,lw=1,dash=false){
 const x=Math.min(x1,x2),y=Math.min(y1,y2),w=Math.max(Math.abs(x2-x1),.01),h=Math.max(Math.abs(y2-y1),.01);
 S.shapes.add({geometry:'custom',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:color,width:lw,style:dash?'dashed':'solid'},customPaths:[{width:w,height:h,commands:[{moveTo:{x:x1-x,y:y1-y}},{lineTo:{x:x2-x,y:y2-y}}]}]});svg.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${lw}" ${dash?'stroke-dasharray="6 6"':''}/>`);
}
async function pic(file,x,y,w,h,icon=false){const b=await fs.readFile(OUT+'/assets/'+file);const type=file.endsWith('.svg')?'image/svg+xml':file.endsWith('.jpg')?'image/jpeg':'image/png';let data=b;if(icon)data=Buffer.from(b.toString().replaceAll('currentColor',C.teal));
 S.images.add({blob:data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength),contentType:type,alt:path.basename(file),fit:'contain',position:{left:x,top:y,width:w,height:h}});
 svg.push(`<image x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" href="data:${type};base64,${data.toString('base64')}"/>`);
}
function header(title,subtitle){rect(72,54,9,85,C.teal);text(105,52,1735,58,title,46,C.ink,true);text(106,120,1700,38,subtitle,23,C.muted);line(72,176,1848,176,C.line,1);}
async function end(stem){svg.push('</svg>');await fs.writeFile(OUT+'/svg/'+stem+'.svg',svg.join('\n'));await fs.writeFile(TMP+'/'+stem+'.layout.json',await (await S.export({format:'layout'})).text());const b=await P.export({slide:S,format:'png',scale:2.5});await fs.writeFile(OUT+'/png/'+stem+'.png',new Uint8Array(await b.arrayBuffer()));}
const defaultRows=[
['Molecules designed\n(virtual)','~10³','10⁵–10⁹','Generative models can expand\ncandidate enumeration at low marginal cost.'],
['Molecules physically made','~10³','10³–10⁴','Automated synthesis and DNA libraries\ncan expand construction capacity.'],
['Fully profiled in wet lab','~50','50 → 500','Illustrative capacity expansion\nthat investors would need to fund.'],
['Clinical entry','1','1','Patients, ethics, capital and time\nremain hard constraints.'],
['Expected approvals','~0.14','Unknown','Clinical success must be demonstrated;\nAI does not establish an approval rate.']
];
const INPUT=JSON.parse(await fs.readFile(OUT+'/ecosystem_data.json','utf8'));
const rows=INPUT.stages??defaultRows;
start();header('Design capacity expands. Validation must keep up.','Illustrative stage comparison, normalized per one clinical entrant. Supplied assumptions, not cohort statistics.');
const table=S.tables.add({rows:6,columns:4,left:72,top:230,width:1776,height:606,columnWidths:[515,190,255,816],values:[['STAGE','PRE-AI','AI ERA','WHAT CHANGES'],...rows]});
table.styleOptions={headerRow:true,bandedRows:false};table.borders.assign({fill:C.white,width:0});
const heights=[70,116,105,105,105,105];
for(let r=0;r<6;r++){table.rows[r].height=heights[r];for(let c=0;c<4;c++){
 const cell=table.getCell(r,c);cell.fill=r===0?C.ink:r===2||r===3?C.aqua:r>=4?C.sand:C.white;
 cell.text.style={fontFamily:FONT,typeface:FONT,fontSize:r===0?20:c===1||c===2?32:25,color:r===0?C.white:r===3?C.teal:C.ink,bold:r===0||r===3,alignment:c===1||c===2?'center':'left',verticalAlignment:'center'};
 table.cells.block({row:r,column:c,rowCount:1,columnCount:1}).assign({margins:{left:22,right:18,top:16,bottom:14},anchor:'center'});
 }}
// The parallel SVG is a text-editable export of the same native table values.
let yy=230;const widths=[515,190,255,816];
for(let r=0;r<6;r++){let xx=72;for(let c=0;c<4;c++){svg.push(`<rect x="${xx}" y="${yy}" width="${widths[c]}" height="${heights[r]}" fill="${r===0?C.ink:r===2||r===3?C.aqua:r>=4?C.sand:C.white}"/>`);const t=([['STAGE','PRE-AI','AI ERA','WHAT CHANGES'],...rows])[r][c],sz=r===0?20:c===1||c===2?32:25,ls=t.split('\n'),base=yy+(heights[r]-ls.length*sz*1.25)/2+sz;svg.push(`<text x="${c===1||c===2?xx+widths[c]/2:xx+22}" y="${base}" font-family="Arial,Helvetica,sans-serif" font-size="${sz}" font-weight="${r===0||r===3?700:400}" fill="${r===0?C.white:r===3?C.teal:C.ink}" text-anchor="${c===1||c===2?'middle':'start'}">${ls.map((l,i)=>`<tspan x="${c===1||c===2?xx+widths[c]/2:xx+22}" dy="${i?sz*1.25:0}">${esc(l)}</tspan>`).join('')}</text>`);xx+=widths[c];}yy+=heights[r];svg.push(`<line x1="72" y1="${yy}" x2="1848" y2="${yy}" stroke="${C.line}"/>`);}
rect(72,877,1776,98,C.ink,undefined,10);await pic('icons/flask-conical.svg',95,899,52,52,true);text(171,899,1645,56,'Working thesis: experimental throughput becomes a capacity gate as virtual design scales.',28,C.white,true);
text(72,1008,1776,44,'Source: user-supplied comparison. ~0.14 is an illustrative expected approval count per clinical entrant; the AI-era outcome is unknown.',17,C.muted);
S.speakerNotes.text='Source: user-provided stage comparison screenshot, supplied 12 October 2026. All stage counts are illustrative assumptions, not researched empirical cohort statistics. Denominator: per one clinical entrant. The separate reference funnel uses per approved drug and is used only for its visual form; its numbers are not mixed into this comparison. Virtual design is not literally free. DNA-encoded libraries are not equivalent to fully characterized discrete compounds; construction counts are conceptual. Approved ~0.14 is an expected count, not a measured probability established by this deck. Clinical benefit and approval rates in the AI era are unknown. Icon: Lucide flask-conical, ISC license, https://github.com/lucide-icons/lucide.';
await end('11_editable_stage_comparison');
const defaultEcos=[
{title:'Molecular construction',icon:'dna',products:'DNA / RNA synthesis, enzymes\nChemical building blocks',metric:'RMB 1.33bn',scope:'China • 2025 • DNA synthesis services [1]',companies:'Twist • GenScript • Tsingke • Vazyme',logos:[['twist-trim.png',120],['genscript-trim.png',123]],note:'Oligos + long fragments only'},
{title:'Protein & functional assays',icon:'flask-conical',products:'Recombinant proteins, antibodies\nBinding and activity assays',metric:'US$3.5bn',scope:'Global • 2025 • research proteins [2]',companies:'ACROBiosystems • Bio-Techne • Sino',logos:[['acro-trim.png',145]],note:'China: ~US$0.4bn • RUO scope',focus:true},
{title:'Cells & culture systems',icon:'test-tubes',products:'Cell models, media, feeds\nBioreactors and cell expansion',metric:'US$323.5m*',scope:'China • 2024 • bioprocess media [3]',companies:'Thermo / Gibco • OPM • Duoning',logos:[],note:'Selected media anchor; not all cell tools'},
{title:'Labware & sample handling',icon:'pipette',products:'Tips, plates, tubes, filtration\nAutomation-compatible labware',metric:'~RMB 23bn',scope:'China • 2024 • plastic labware [4]',companies:'JET Biofil • Corning • Changhong',logos:[['jet-english.png',95]],note:'Includes clinical and industrial uses'},
{title:'Measurement & analytics',icon:'microscope',products:'Sequencing, LC / LC-MS, flow\nImaging and quality control',metric:'RMB 4.3bn',scope:'China • 2024 • sequencing tools [5]',companies:'MGI • Illumina • Agilent • Waters',logos:[['mgi-trim.png',78]],note:'Sequencers + consumables; all uses'},
{title:'Purification & scale-up',icon:'factory',products:'Analytical columns, process resins\nFiltration and single-use systems',metric:'US$578.2m*',scope:'China • 2024 • bioprocess resins [3]',companies:'NanoMicro • Cytiva • Sepax',logos:[['nanomicro-emblem.svg',34]],note:'Manufacturing demand has a longer lag',focus:true}
];
const ecos=INPUT.ecosystem??defaultEcos;
start();header('AI-scale design meets finite experimental capacity','Working scenario: candidate generation expands faster than physical construction and biological validation.');
text(72,214,540,32,'AI-ERA DISCOVERY FUNNEL',22,C.ink,true);text(72,251,550,32,'Illustrative counts per one clinical entrant',18,C.muted);
const bands=[
{y:310,h:112,w1:532,w2:400,fill:C.pale,stroke:C.blue,label:'Virtual designs',n:rows[0][2],col:C.blue},
{y:434,h:104,w1:400,w2:310,fill:'#BFE8E1',stroke:C.teal,label:'Physically made',n:rows[1][2],col:C.teal},
{y:550,h:108,w1:310,w2:210,fill:C.teal,stroke:C.teal,label:'Fully profiled',n:rows[2][2],col:C.white},
{y:670,h:85,w1:210,w2:150,fill:C.sand,stroke:C.gold,label:'Clinical entry',n:rows[3][2],col:C.ink},
{y:767,h:86,w1:150,w2:124,fill:'#F8EBEE',stroke:C.red,label:'Approvals',n:rows[4][2],col:C.ink}
];const cx=338;
for(const b of bands){poly([[cx-b.w1/2,b.y],[cx+b.w1/2,b.y],[cx+b.w2/2,b.y+b.h],[cx-b.w2/2,b.y+b.h]],b.fill,b.stroke,2);text(cx-b.w1/2,b.y+17,b.w1,32,b.label,b.w1<220?18:23,b.col,true,'center');text(cx-b.w1/2,b.y+52,b.w1,45,b.n,b.w1<220?23:34,b.col,true,'center');}
// Magnification connector: both physical construction and wet-lab profiling are selected.
line(585,434,620,434,C.teal,3);line(620,434,620,658,C.teal,3);line(620,658,585,658,C.teal,3);
poly([[630,445],[699,270],[699,907],[630,649]],'#F4FAF9');line(620,445,699,270,'#8EBDB7',1.5);line(620,649,699,907,'#8EBDB7',1.5);
rect(72,888,535,71,C.aqua,undefined,8);await pic('icons/flask-conical.svg',91,902,38,38,true);text(145,902,450,42,'WET LAB = BUILD + TEST',23,C.teal,true);
text(72,980,550,55,'Funnel widths are schematic.\nClinical success remains unproven in this scenario.',17,C.muted);
rect(701,209,1147,701,'#F8FBFC',C.line,14);text(727,225,1095,43,'The LST ecosystem behind the capacity gate',29,C.ink,true);
text(727,267,1090,30,'Selected market anchors • different scopes and years • do not add these values',16,C.muted);
const xs=[727,1102,1477],ys=[319,610],cw=345,ch=268;
for(let i=0;i<ecos.length;i++){const d=ecos[i],x=xs[i%3],y=ys[Math.floor(i/3)];rect(x,y,cw,ch,C.white,d.focus?C.gold:C.line,9,d.focus?2:1);await pic('icons/'+d.icon+'.svg',x+17,y+18,32,32,true);text(x+61,y+19,cw-73,38,d.title,21,C.ink,true);text(x+17,y+61,cw-34,59,d.products,17,C.muted);text(x+17,y+130,cw-34,39,d.metric,30,d.focus?C.teal:C.ink,true);text(x+17,y+174,cw-34,27,d.scope,13.7,C.muted);text(x+17,y+199,cw-34,23,d.note,13.5,C.muted);
 let lx=x+17;for(const [f,w]of d.logos){await pic('logos/'+f,lx,y+224,w,34);lx+=w+18;}
 if(i===5){text(x+61,y+231,117,25,'NanoMicro',18,'#0078A0',true);await pic('logos/cytiva-trim.png',x+204,y+228,118,31);}
 if(!d.logos.length)text(x+17,y+230,cw-34,30,'Gibco  |  OPM  |  Duoning',17,C.ink,true);
 // Every representative remains in editable text, independent of the logo asset.
 text(x+17,y+ch+4,cw-34,19,d.companies,12.3,C.muted);
}
rect(701,932,1147,55,C.ink,undefined,8);await pic('icons/bot.svg',716,941,35,35,true);text(767,949,750,26,'Automation + data orchestration span every tool family',20,C.white,true);rect(1617,940,178,40,C.white,undefined,5);await pic('logos/tecan-trim.png',1630,947,151,25,false);
text(701,1005,1135,45,'[1] Tsingke IPO 2026  [2] ACRO HKEX 2026  [3] Duoning HKEX 2026*  [4] JET 2025  [5] MGI 2024\n*Previously checked official-index data; source PDFs currently unavailable. Scope and citations: SOURCES.md.',14,C.muted);
S.speakerNotes.text='Research date: 12 October 2026. This is an investment research hypothesis, not evidence of a realized bottleneck. Candidate design can become abundant, but design quality, synthesis, biological interpretation and clinical translation remain constraints. Funnel is illustrative per one clinical entrant, with unknown AI-era approval outcome. The illustrative 50 to 500 wet-lab count is a scenario, not a forecast. DNA-encoded libraries are not fully profiled discrete candidates. Selected TAM anchors are non-additive and not entire six-category totals.\n[1] Tsingke 30 Jun 2026 IPO prospectus, printed pp. 156-158: China 2025 oligo synthesis 0.53bn RMB plus long-fragment synthesis 0.80bn RMB =1.33bn RMB. https://static.sse.com.cn/stock/disclosure/announcement/c/202606/002233_20260630_Z9LA.pdf\n[2] ACROBiosystems HKEX application 30 Sep 2026, printed p.71 / PDF p.80: global research-use recombinant protein market 2025 $3.5bn; China approximately $0.4bn, rounded to $0.1bn. https://www1.hkexnews.hk/app/sehk/2026/108910/documents/sehk26093002651_c.pdf\n[3] Duoning HKEX application 18 Jan 2026, F&S historical estimates. China 2024 media $323.5m, printed p.126; chromatography resins $578.2m, printed p.132. Footnote excludes COVID impact on vaccine products. Previously verified public official index on 9-10 Oct 2026, original PDF currently unavailable; lower source confidence than directly downloaded documents. https://www.hkexnews.hk/app/sehk/2026/108106/documents/sehk26011800033_c.pdf\n[4] JET Biofil 2025 annual report summary on CNINFO, 30 Apr 2026, PDF p.6, China 2024 disposable plastic biological laboratory consumables approximately RMB23bn, broad clinical and industrial uses. https://static.cninfo.com.cn/finalpage/2026-04-30/1225255989.PDF\n[5] MGI 2024 annual report pp.41-42, China 2024 sequencers plus consumables RMB4.3bn, all uses incl. clinical. https://static.cninfo.com.cn/finalpage/2025-04-30/1223427376.PDF\nRepresentative companies are examples, not ranks, endorsements, market shares or measured AI-revenue exposure. ACRO product pathway: recombinant protein expression and functional validation. NanoMicro product pathway: chromatography/purification and manufacturing scale-up, which has a longer commercial-volume lag. Automation is not independently sized.\nImage sources: '+await fs.readFile(OUT+'/assets/sources.json','utf8')+'\nLucide icons are ISC licensed, https://github.com/lucide-icons/lucide. Logos identify the respective companies; no endorsement. NanoMicro uses only its unchanged circular emblem plus a separate editable English company label.';
await end('12_ai_funnel_lst_ecosystem');
await fs.writeFile(OUT+'/ecosystem_data.json',JSON.stringify({date:'2026-10-12',denominator:'per one clinical entrant',status:'illustrative scenario',stages:rows,ecosystem:ecos},null,2));
const candidate=TMP+'/candidate.pptx';await(await PresentationFile.exportPptx(P)).save(candidate);
const final=process.env.LST_PPTX_OUTPUT??OUT+'/editable/AI_LST_rebuilt_'+new Date().toISOString().replaceAll(':','-')+'.pptx';
const result=await finalizePresentation({workspaceDir:cwd,candidatePath:candidate,finalPath:final,pythonExecutable:process.env.RUNTIME_PYTHON,integrityValidatorPath:SKILL+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:SKILL+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-heading-fit','--require-native-table-slide','1'],requiredNativeTableOwnerSlides:[1],requiredNativeChartOwnerSlides:[],explicitTotalSlideCount:2,fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:TMP+'/validation_'+Date.now()+'.json'});
console.log(JSON.stringify({pptx:final,slides:2,font:FONT,validation:result}));
