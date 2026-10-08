import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('../output/bizmasi-crawl');
const exported=path.resolve('public/data/bizmasi.json');
if(!fs.existsSync(root)){
 if(!fs.existsSync(exported))throw new Error('Missing public/data/bizmasi.json and crawl archive.');
 console.log('Crawl archive is not present; using committed public/data/bizmasi.json.');
 process.exit(0);
}
const read=n=>JSON.parse(fs.readFileSync(path.join(root,'data',n+'.json'),'utf8').replace(/^\uFEFF/,''));
const pages=read('rendered-pages');
const articles=pages.filter(p=>p.metadata?.some(m=>m.property==='og:type'&&m.content==='article')).map(p=>{
 const title=p.headings.find(h=>h.level===1)?.text||p.title.split(' | ')[0];
 const excerpt=p.metadata.find(m=>m.name==='description')?.content||'';
 let content=p.main_text.split(/\d+ phút đọc\n/)[1]||p.main_text;
 content=content.split('CỐ VẤN QUẢN TRỊ THỰC CHIẾN')[0].trim();
 return {slug:new URL(p.url).pathname.slice(1),title,excerpt,content,category:p.main_text.split('\n')[2],source:p.url};
});
const data={tree:read('tree'),documents:read('documents-catalog'),courses:read('courses'),articles,
 pages:pages.filter(p=>['/chinh-sach-bao-mat','/dieu-khoan-su-dung','/consulting','/'].includes(new URL(p.url).pathname)).map(p=>({slug:new URL(p.url).pathname,title:p.headings.find(h=>h.level===1)?.text||p.title,content:p.main_text||p.text})),
 assessment:read('assessment-questions'),planOptions:read('plan-options'),contact:read('company-contact'),capturedAt:'2026-10-08'};
fs.mkdirSync('public/data',{recursive:true});
fs.writeFileSync('public/data/bizmasi.json',JSON.stringify(data));
fs.cpSync(path.join(root,'assets'),'public/assets',{recursive:true});
console.log('Prepared',data.tree.length,'departments,',data.documents.length,'documents,',articles.length,'articles,',data.courses.length,'courses');
