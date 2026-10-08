import './style.css';
import './forest.css';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
const icons=['♧','◉','↗','⚙','▥','◇'];
const detail=$('#detail'), search=$('#search-dialog');
let data,tree,selected=0,filter=null;
const flat=nodes=>nodes.flatMap(n=>[n,...flat(n.children||[])]);
const ids=node=>new Set(flat([node]).map(n=>n.id));
const docsFor=node=>{const set=ids(node);return data.documents.filter(d=>set.has(d.nodeId));};
const ext=(url,label)=>'<a class="button" href="'+esc(url)+'" target="_blank" rel="noopener">'+label+' ↗</a>';
const head=(eyebrow,title,text='')=>'<div class="page-header"><span class="eyebrow">'+esc(eyebrow)+'</span><h1>'+esc(title)+'</h1><p>'+esc(text)+'</p></div>';
const para=text=>text.split(/\n+/).filter(Boolean).map(p=>'<p>'+esc(p)+'</p>').join('');
function modal(dialog){if(!dialog.open)dialog.showModal();document.body.classList.add('modal-open');}
document.querySelectorAll('dialog').forEach(d=>{d.querySelector('.close').onclick=()=>d.close();d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('modal-open');});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
function docCards(docs){return docs.length?docs.map(d=>'<button class="doc-card" data-doc="'+d.id+'"><span class="doc-icon">▤</span><span><strong>'+esc(d.title)+'</strong><small>'+esc(d.node_path.slice(1).join(' / '))+'</small></span><span style="margin-left:auto">↗</span></button>').join(''):'<p class="empty">Nhánh này chưa có tài liệu công khai. Bạn có thể xem các chuyên môn khác trong phòng ban.</p>';}
function showDepartment(index,nodeId=null,focus=true){
 selected=index;filter=nodeId;const dept=data.tree[index],node=flat([dept]).find(n=>n.id===nodeId)||dept,docs=docsFor(node);
 document.querySelectorAll('.department').forEach((b,i)=>{b.classList.toggle('selected',i===index);b.setAttribute('aria-pressed',String(i===index));});
 if(focus)tree?.focus(index);
 $('#detail-content').innerHTML='<span class="eyebrow">NHÁNH 0'+(index+1)+' / CÂY TRI THỨC</span><h2>'+esc(dept.name)+'</h2><p class="muted">'+dept.children.length+' chuyên môn · '+docsFor(dept).length+' tài liệu</p><div class="function-list"><button class="chip '+(!nodeId?'active':'')+'" data-filter="">Tất cả</button>'+flat(dept.children).map(n=>'<button class="chip '+(n.id===nodeId?'active':'')+'" data-filter="'+n.id+'">'+esc(n.name)+'</button>').join('')+'</div><h3>'+esc(nodeId?node.name:'Tài liệu trong phòng ban')+' <span class="muted">('+docs.length+')</span></h3>'+docCards(docs)+'<div class="notice">Tài liệu đầy đủ dành cho thành viên Bizmasi. Chọn tài liệu để xem mô tả và tiếp tục đến thư viện.</div>';
 $('#detail-content').querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>showDepartment(index,b.dataset.filter||null,false));
 bindDocs($('#detail-content'));modal(detail);detail.scrollTop=0;
}
function bindDocs(root){root.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>showDoc(b.dataset.doc));}
function showDoc(id){
 const d=data.documents.find(x=>x.id===id);if(!d)return;
 selected=data.tree.findIndex(n=>ids(n).has(d.nodeId));
 $('#detail-content').innerHTML='<button class="detail-back" id="doc-back">← Về '+esc(data.tree[selected].name)+'</button><p class="eyebrow" style="margin-top:36px">TÀI LIỆU QUẢN TRỊ</p><h2>'+esc(d.title)+'</h2><p class="muted">'+esc(d.node_path.join(' / '))+'</p><p>'+esc(d.description||'Tài liệu thuộc thư viện quản trị Bizmasi.')+'</p><div class="notice">Đăng nhập vào Bizmasi để kiểm tra quyền truy cập và xem tài liệu dành cho thành viên.</div>'+ext('https://bizmasi.vn/signin?callbackUrl=%2Fknowledge','Đăng nhập để xem tài liệu')+'<p class="muted">Bạn sẽ tiếp tục tại hệ thống Bizmasi.</p>';
 $('#doc-back').onclick=()=>showDepartment(selected,null,false);modal(detail);detail.scrollTop=0;
}
function setupHome(){
 $('#departments').innerHTML=data.tree.map((d,i)=>'<button class="department" data-dept="'+i+'" aria-pressed="false"><span class="dept-icon">'+icons[i]+'</span><span><strong>'+esc(d.name)+'</strong><small>'+d.children.length+' chuyên môn · '+docsFor(d).length+' tài liệu</small></span></button>').join('');
 document.querySelectorAll('[data-dept]').forEach(b=>b.onclick=()=>showDepartment(Number(b.dataset.dept)));
 $('#explore').onclick=()=>showDepartment(0);
 $('#list-content').innerHTML=data.tree.map((d,i)=>'<details><summary>'+esc(d.name)+' · '+docsFor(d).length+' tài liệu</summary>'+flat(d.children).map(n=>'<button class="'+(n.kind==='group'?'group':'')+'" data-node="'+n.id+'" data-index="'+i+'">'+esc(n.name)+' <span class="muted">('+docsFor(n).length+')</span> ↗</button>').join('')+'</details>').join('');
 $('#list-content').querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>showDepartment(Number(b.dataset.index),b.dataset.node));
 $('#list-toggle').onclick=()=>{const el=$('#list-view');el.hidden=!el.hidden;$('#list-toggle').innerHTML=el.hidden?'Xem dạng danh sách <span>☷</span>':'Ẩn danh sách <span>−</span>';$('#list-toggle').setAttribute('aria-expanded',String(!el.hidden));if(!el.hidden)el.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
 $('#reset').onclick=()=>{tree?.reset();document.querySelectorAll('.department').forEach(b=>{b.classList.remove('selected');b.setAttribute('aria-pressed','false');});};
 $('#zoom-in').onclick=()=>tree?.zoom(.86);$('#zoom-out').onclick=()=>tree?.zoom(1.16);
 $('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#world').requestFullscreen();}catch{$('#scene-status').textContent='Trình duyệt này chưa hỗ trợ toàn màn hình.';$('#scene-status').hidden=false;}};
}
function art(i,label){return '<div class="card-art tone-'+(i%4)+'"><span>'+esc(label)+'</span><span class="art-symbol">'+['✳','◎','↗','⌘'][i%4]+'</span></div>';}
const lessonCount=c=>c.modules.reduce((s,m)=>s+m.lessons.length,0);
function courseCards(){return '<div class="cards">'+data.courses.map((c,i)=>'<a class="content-card" href="#/khoa-hoc/'+c.slug+'">'+art(i,c.metadata.tag||'QUẢN TRỊ DOANH NGHIỆP')+'<div class="card-body"><span class="card-meta">'+esc(c.category.name)+' · '+lessonCount(c)+' bài trong đề cương</span><h2>'+esc(c.title)+'</h2><p>'+esc(c.excerpt)+'</p><span class="text-link">Xem chương trình ↗</span></div></a>').join('')+'</div>';}
function articleCards(){return '<div class="cards">'+data.articles.map((a,i)=>'<a class="content-card" href="#/kien-thuc/'+a.slug+'">'+art(i,a.category)+'<div class="card-body"><span class="card-meta">'+esc(a.category)+'</span><h2>'+esc(a.title)+'</h2><p>'+esc(a.excerpt)+'</p><span class="text-link">Đọc bài viết ↗</span></div></a>').join('')+'</div>';}
function coursePage(c){
 return '<a class="breadcrumb" href="#/khoa-hoc">← Tất cả khóa học</a>'+head(c.metadata.tag||'KHÓA HỌC',c.title,c.excerpt)+'<div class="course-layout"><div><div class="prose">'+para(c.description)+'</div><h2 style="font-size:30px;margin-top:36px">Lộ trình học tập</h2><p class="muted">'+c.modules.length+' chương · '+lessonCount(c)+' bài trong đề cương hiện có</p><div class="curriculum">'+c.modules.map(m=>'<details open><summary>'+esc(m.title)+'</summary><ol>'+m.lessons.map(l=>'<li>'+esc(l.title)+(l.videoDuration?' <small>· '+Math.round(l.videoDuration/60)+' phút</small>':'')+'</li>').join('')+'</ol></details>').join('')+'</div></div><aside class="course-aside"><span class="eyebrow">HỌC CÙNG BIZMASI</span><h2 style="margin-top:18px">Biến kiến thức<br>thành năng lực.</h2><p>'+esc(c.metadata.instructor||'Đội ngũ Bizmasi')+'</p><p>'+esc(c.level||'')+'</p>'+ext('https://bizmasi.vn/khoa-hoc/'+c.slug,'Vào học tại Bizmasi')+'<p class="muted">Xem video, quyền học và thông tin đăng ký tại hệ thống đào tạo Bizmasi.</p></aside></div>';
}
function consultingDetails(){
 const content=data.pages.find(p=>p.slug==='/consulting')?.content||'';
 const problems=content.split('ĐIỂM NGHẼN PHỔ BIẾN')[1]?.split('LỘ TRÌNH ĐỒNG HÀNH')[0]?.trim()||'';
 const process=content.split('LỘ TRÌNH ĐỒNG HÀNH')[1]?.trim()||'';
 return '<section class="consulting-source curriculum"><details><summary>Các bài toán doanh nghiệp thường gặp</summary><div class="prose">'+para(problems)+'</div></details><details><summary>Quy trình tư vấn & chuyển giao 4 bước</summary><div class="prose">'+para(process)+'</div></details></section>';
}
function consulting(){
 const q=data.assessment.questions||[];
 return head('ĐỒNG HÀNH CÙNG DOANH NGHIỆP','Vững gốc rễ. Sáng hướng đi.','Cùng chuyên gia Bizmasi nhận diện điểm nghẽn và xây dựng giải pháp quản trị phù hợp với doanh nghiệp của bạn.')+
 '<div class="contact-grid"><div class="contact-card"><span class="eyebrow">TƯ VẤN QUẢN TRỊ 1:1</span><h2 style="margin-top:20px">Bắt đầu từ một cuộc trò chuyện.</h2><p>Chuẩn hóa vận hành, cơ cấu nhân sự, lương 3P và quản trị dòng tiền. Chia sẻ bài toán của bạn với đội ngũ Bizmasi.</p>'+ext('https://bizmasi.vn/consulting','Đăng ký tư vấn tại Bizmasi')+'<p class="muted">Biểu mẫu đăng ký được tiếp nhận tại hệ thống Bizmasi.</p></div><div class="contact-card"><span class="eyebrow">KẾT NỐI TRỰC TIẾP</span><h2 style="margin-top:20px">Chúng tôi sẵn sàng lắng nghe.</h2><p>Số L2-7, ngõ 70 Lưu Hữu Phước,<br>phường Từ Liêm, Hà Nội</p><div class="contact-actions"><a class="button outline" href="tel:0813418660">0813 418 660 ↗</a><a class="button outline" href="mailto:contact@bizmasi.vn">Gửi email ↗</a></div></div></div>'+
 '<section class="questions"><span class="eyebrow">CHUẨN BỊ CHO BUỔI TƯ VẤN</span><h2 style="margin-top:16px">Hiểu hệ thống của bạn.</h2><p class="muted">Trả lời 6 câu hỏi để ghi lại hiện trạng. Bạn có thể tải bản ghi và chia sẻ với chuyên gia; câu trả lời chỉ nằm trong phiên này.</p><form id="assessment">'+q.map((q,i)=>'<fieldset><legend>'+(i+1)+'. '+esc(q.questionText)+'</legend>'+q.options.map(o=>'<label><input required type="radio" name="q'+i+'" value="'+esc(o.label)+'">'+esc(o.label)+'</label>').join('')+'</fieldset>').join('')+
 '<div class="contact-grid">'+['roles','stages'].map((key,i)=>'<label class="muted">'+['Vai trò của bạn','Giai đoạn doanh nghiệp'][i]+'<select name="'+key+'" style="display:block;width:100%;padding:12px;margin:10px 0 20px;background:transparent;border:1px solid #c7d0bc">'+data.planOptions[key].map(o=>'<option>'+esc(o.label)+'</option>').join('')+'</select></label>').join('')+'</div><button class="button" type="submit">Tải bản ghi hiện trạng ↓</button><p id="assessment-status" class="muted" role="status"></p></form></section>';
}
function bindAssessment(){const form=$('#assessment');if(!form)return;form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form);const text='BIZMASI — BẢN GHI HIỆN TRẠNG DOANH NGHIỆP\n\nVai trò: '+fd.get('roles')+'\nGiai đoạn: '+fd.get('stages')+'\n\n'+data.assessment.questions.map((q,i)=>(i+1)+'. '+q.questionText+'\n'+fd.get('q'+i)).join('\n\n')+'\n\nBản ghi do người dùng tự khai, phục vụ trao đổi với chuyên gia. Chưa được gửi đến Bizmasi.';const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='bizmasi-hien-trang-doanh-nghiep.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#assessment-status').textContent='Đã tạo bản ghi để tải về. Bạn có thể gửi file cho chuyên gia khi đăng ký tư vấn.';};}
function route(){
 const [section='',slug='']=decodeURIComponent(location.hash.slice(2)).split('/');const home=!section;
 $('#home').hidden=!home;$('#page').hidden=home;document.body.classList.toggle('forest-home',home);
 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===(section||'home')));
 if(detail.open)detail.close();if(search.open)search.close();
 let title='Cây tri thức doanh nghiệp',html='';
 if(home){document.title='Bizmasi — '+title;requestAnimationFrame(()=>tree?.refresh());return;}
 if(section==='khoa-hoc'){const c=data.courses.find(c=>c.slug===slug);title=c?.title||'Khóa học quản trị';html=slug?(c?coursePage(c):notFound()):head('BỒI ĐẮP NĂNG LỰC','Học để doanh nghiệp vươn xa.','Chương trình quản trị thực chiến dành cho nhà lãnh đạo và đội ngũ — từ tư duy chiến lược đến hệ thống vận hành.')+courseCards();}
 else if(section==='kien-thuc'){const a=data.articles.find(a=>a.slug===slug);title=a?.title||'Thư viện kiến thức';html=slug?(a?'<article class="article"><a class="breadcrumb" href="#/kien-thuc">← Thư viện kiến thức</a><span class="eyebrow">'+esc(a.category)+'</span><h1>'+esc(a.title)+'</h1><div class="prose">'+para(a.content)+'</div><p class="muted">Tác giả: Admin · Học viện Bizmasi</p><a class="text-link" href="'+esc(a.source)+'" target="_blank" rel="noopener">Xem bài viết gốc ↗</a><div class="notice">Cần áp dụng vào doanh nghiệp của bạn? <a href="#/tu-van"><u>Kết nối chuyên gia Bizmasi</u></a>.</div></article>':notFound()):head('TRI THỨC THỰC CHIẾN','Những ý tưởng nuôi dưỡng tăng trưởng.','Góc nhìn, phương pháp và kinh nghiệm quản trị để từng bước xây dựng doanh nghiệp bền vững.')+articleCards();}
 else if(section==='tu-van'){title='Tư vấn doanh nghiệp';html=consulting();}
 else if(section==='gioi-thieu'){title='Về Học viện Bizmasi';html=head('HỌC VIỆN BIZMASI','Nuôi dưỡng hệ thống. Kiến tạo thành công.','Giải pháp quản trị toàn diện cho doanh nghiệp.')+'<div class="contact-grid"><div class="prose"><h2>Tri thức là gốc rễ.</h2><p>Học viện Bizmasi đồng hành cùng doanh nghiệp trong đào tạo quản trị, chuẩn hóa hệ thống và phát triển năng lực đội ngũ.</p><p>Cây tri thức kết nối sáu phòng ban — từ hành chính nhân sự, marketing, kinh doanh đến vận hành, tài chính và pháp chế — trong cùng một hệ thống dễ khám phá.</p><p>Tập trung tri thức, tìm đúng tài liệu và xây dựng nền tảng cho sự phát triển bền vững.</p><a class="button" href="#/">Khám phá cây tri thức ↗</a></div><div class="contact-card"><h2>Công ty cổ phần giải pháp quản trị doanh nghiệp BMS</h2><p>MST: 4601669498</p><p>Số L2-7, ngõ 70 Lưu Hữu Phước, phường Từ Liêm, Hà Nội</p><p><a href="tel:0813418660">0813 418 660</a><br><a href="mailto:contact@bizmasi.vn">contact@bizmasi.vn</a></p><div class="contact-actions"><a class="text-link" href="https://www.youtube.com/@Bizmasi" target="_blank" rel="noopener">YouTube ↗</a><a class="text-link" href="https://www.tiktok.com/@bizmasi" target="_blank" rel="noopener">TikTok ↗</a></div></div></div>';}
 else if(['chinh-sach-bao-mat','dieu-khoan-su-dung'].includes(section)){const p=data.pages.find(p=>p.slug==='/'+section);title=section==='chinh-sach-bao-mat'?'Chính sách bảo mật':'Điều khoản sử dụng';html='<article class="article">'+head('THÔNG TIN BIZMASI',title)+'<div class="prose">'+para(p?.content||'')+'</div><a class="text-link" href="https://bizmasi.vn/'+section+'" target="_blank" rel="noopener">Xem phiên bản hiện hành tại Bizmasi ↗</a></article>';}
 else html=notFound();
 if(section==='tu-van')html=html.replace('<section class="questions">',consultingDetails()+'<section class="questions">');
 $('#page').innerHTML=html;document.title=title+' | Bizmasi';bindAssessment();window.scrollTo(0,0);$('#main').focus({preventScroll:true});
}
function notFound(){return head('KHÔNG TÌM THẤY','Nhánh này chưa có nội dung.','Bạn có thể trở về cây tri thức để tiếp tục khám phá.')+'<a class="button" href="#/">Về cây tri thức</a>';}
function setupSearch(){
 const entries=[...data.tree.flatMap((d,i)=>flat([d]).map(n=>({title:n.name,type:n.kind==='department'?'Phòng ban':'Chuyên môn',search:n.name,action:()=>showDepartment(i,n.kind==='department'?null:n.id)}))),...data.documents.map(d=>({title:d.title,type:'Tài liệu · '+d.node_path[0],search:d.title+' '+d.description+' '+d.node_path.join(' '),action:()=>showDoc(d.id)})),...data.courses.map(c=>({title:c.title,type:'Khóa học',search:c.title+' '+c.excerpt,action:()=>location.hash='/khoa-hoc/'+c.slug})),...data.articles.map(a=>({title:a.title,type:'Bài viết · '+a.category,search:a.title+' '+a.content,action:()=>location.hash='/kien-thuc/'+a.slug}))];
 function searchItems(){const query=plain($('#search-input').value.trim());const results=query?entries.filter(e=>plain(e.search).includes(query)):entries.filter(e=>e.type==='Phòng ban');$('#search-count').textContent=query?results.length+' kết quả phù hợp':'Khám phá theo phòng ban';$('#search-results').innerHTML=results.map((e,i)=>'<button class="search-result" data-result="'+i+'"><small>'+esc(e.type)+'</small><strong>'+esc(e.title)+' ↗</strong></button>').join('')||'<p class="empty">Chưa tìm thấy kết quả. Thử từ khóa ngắn hơn như “lương” hoặc “quy trình”.</p>';$('#search-results').querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{search.close();results[Number(b.dataset.result)].action();});}
 $('#search-open').onclick=()=>{modal(search);searchItems();$('#search-input').focus();};$('#search-input').oninput=searchItems;
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();$('#search-open').click();}});
}
async function init(){
 const response=await fetch(import.meta.env.BASE_URL+'data/bizmasi.json');if(!response.ok)throw Error('Data unavailable');data=await response.json();
 setupHome();setupSearch();route();window.addEventListener('hashchange',route);
 try{const {createTree}=await import('./tree.js');tree=createTree($('#world'),data.tree,i=>showDepartment(i));window.__bizmasiScene=tree;}catch(error){console.warn('3D unavailable:',error);$('#scene-status').textContent='Thiết bị chưa hỗ trợ cây 3D. Khám phá đầy đủ nội dung qua các phòng ban bên dưới.';$('#scene-status').hidden=false;$('#list-view').hidden=false;document.querySelectorAll('.scene-controls button').forEach(b=>b.disabled=true);}
}
init().catch(error=>{console.error(error);$('#scene-status').textContent='Không tải được dữ liệu. Hãy tải lại trang hoặc truy cập bizmasi.vn.';$('#scene-status').hidden=false;});
