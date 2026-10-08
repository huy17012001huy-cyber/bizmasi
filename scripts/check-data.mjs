import assert from 'node:assert/strict';
import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('public/data/bizmasi.json'));
const flat=nodes=>nodes.flatMap(n=>[n,...flat(n.children||[])]);
const nodes=flat(d.tree);
assert.equal(d.tree.length,6);assert.equal(d.documents.length,25);assert.equal(d.courses.length,4);assert.equal(d.articles.length,6);
assert.equal(nodes.filter(n=>n.kind==='function').length,17);
assert.equal(nodes.filter(n=>n.kind==='group').length,5);
assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);
for(const doc of d.documents)assert(nodes.some(n=>n.id===doc.nodeId),'Unknown document node');
for(const a of d.articles){assert(a.content.length>100);assert(!a.content.includes('CỐ VẤN QUẢN TRỊ THỰC CHIẾN'));assert(a.content.includes(a.excerpt));}
assert.equal(d.courses.reduce((s,c)=>s+c.modules.reduce((a,m)=>a+m.lessons.length,0),0),27);
console.log('PASS: hierarchy, 25 document associations, 6 full articles, 4 courses / 27 lessons.');
