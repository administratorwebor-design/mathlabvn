import {richMath} from './math.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const size=n=>n<1048576?`${Math.ceil(n/1024)} KB`:`${(n/1048576).toFixed(1)} MB`;
export function uploadFormHTML(){return `<section class="card upload-card" id="upload-lesson"><div class="section-head"><div><span class="badge">BÀI HỌC CỦA GIÁO VIÊN</span><h2>Tải bài lên</h2></div><span class="badge gray">PDF / Word · Tối đa 10 MB</span></div><p>Chọn tài liệu, lớp và hướng dẫn học. Sau khi đăng, học sinh được bạn phụ trách sẽ thấy bài trong mục Học tập của đúng lớp.</p><form id="lesson-upload-form"><div class="split"><div><label class="field" for="upload-title">Tên bài học</label><input class="input" id="upload-title" required maxlength="120" placeholder="Ví dụ: Ôn tập căn bậc hai"><label class="field" for="upload-grade">Dành cho lớp</label><select id="upload-grade">${[6,7,8,9].map(n=>`<option value="${n}">Lớp ${n}</option>`).join('')}</select></div><div><label class="field" for="upload-file">Tài liệu bài học</label><input class="input" id="upload-file" type="file" accept=".pdf,.docx" required aria-describedby="upload-file-hint"><p class="hint" id="upload-file-hint">Nhận PDF hoặc Word .docx, tối đa 10 MB. File Word .doc cũ cần lưu lại thành .docx hoặc PDF.</p></div></div><label class="field" for="upload-description">Hướng dẫn cho học sinh (không bắt buộc)</label><textarea id="upload-description" maxlength="8000" placeholder="Mục tiêu bài học, phần cần đọc và yêu cầu cần làm…"></textarea><p class="hint">Tài liệu giữ nguyên định dạng để tải về. Chưa tự chuyển câu hỏi trong file thành bài chấm điểm.</p><button class="btn" type="submit">Xem lại trước khi đăng →</button></form><section id="upload-review" hidden aria-label="Xem lại bài học"></section><p id="upload-message" role="status"></p></section>`;}
export function uploadedLessonsHTML(lessons,teacher=false){return `<section class="card uploaded-lessons"><h2>${teacher?'Bài bạn đã tải lên':'Tài liệu từ giáo viên'}</h2>${lessons.length?lessons.map(l=>`<article class="uploaded-lesson" data-uploaded-lesson="${l.id}"><span class="badge">Lớp ${l.grade} · ${l.format.toUpperCase()}</span><h3>${escape(l.title)}</h3>${l.description?`<div class="uploaded-description">${richMath(l.description)}</div>`:''}<p class="hint">${escape(l.teacherName)} · ${new Date(l.publishedAt).toLocaleDateString('vi-VN')} · ${escape(l.filename)} · ${size(l.size)}</p><a class="btn secondary" href="/api/lessons/${l.id}/file" download>Tải tài liệu ↓</a></article>`).join(''):`<p class="hint">${teacher?'Chưa có bài riêng. Dùng biểu mẫu phía trên để tải bài đầu tiên.':'Chưa có tài liệu riêng của giáo viên cho lớp này.'}</p>`}</section>`;}
export function bindLessonUpload(root,{request,onPublished}){
 const form=root.querySelector('#lesson-upload-form');if(!form)return;
 const review=root.querySelector('#upload-review'),message=root.querySelector('#upload-message');let draft=null;
 form.addEventListener('input',()=>form.dataset.uploadDirty='true');
 form.addEventListener('change',()=>form.dataset.uploadDirty='true');
 form.addEventListener('submit',e=>{
  e.preventDefault();message.textContent='';if(!form.reportValidity())return;
  const file=root.querySelector('#upload-file').files[0],title=root.querySelector('#upload-title').value.trim();
  if(!title){message.textContent='Vui lòng nhập tên bài học.';return;}
  if(!file||!file.size||file.size>10*1024*1024||!(/\.(pdf|docx)$/i.test(file.name))){message.textContent='Chọn PDF hoặc Word .docx có dung lượng từ 1 byte đến 10 MB.';return;}
  draft={title,grade:Number(root.querySelector('#upload-grade').value),description:root.querySelector('#upload-description').value.trim(),filename:file.name,file};
  form.hidden=true;review.hidden=false;
  review.innerHTML=`<h3>Xem lại thông tin bài học</h3><span class="badge">Lớp ${draft.grade}</span><h2>${escape(draft.title)}</h2><p>${escape(file.name)} · ${size(file.size)}</p><div class="uploaded-description">${richMath(draft.description)}</div><p class="hint">Đăng cho học sinh lớp ${draft.grade} được bạn phụ trách. Nội dung file chưa được tự động đọc hoặc chấm điểm.</p><div class="button-row"><button type="button" class="btn" id="publish-upload">Đăng bài cho học sinh</button><button type="button" class="btn secondary" id="edit-upload">Quay lại chỉnh sửa</button></div>`;
  review.querySelector('#edit-upload').onclick=()=>{review.hidden=true;form.hidden=false;};
  review.querySelector('#publish-upload').onclick=async()=>{
   const button=review.querySelector('#publish-upload'),edit=review.querySelector('#edit-upload');button.disabled=true;edit.disabled=true;button.textContent='Đang tải và đăng bài…';message.textContent='';
   try{
    const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Không đọc được file. Vui lòng chọn lại.'));reader.readAsDataURL(draft.file);});
    const {file:ignored,...metadata}=draft,result=await request('/api/teacher/lessons/upload','POST',{...metadata,base64},60000);
    form.reset();delete form.dataset.uploadDirty;await onPublished(result);
   }catch(error){if(message.isConnected)message.textContent=error.message;button.disabled=false;edit.disabled=false;button.textContent='Đăng bài cho học sinh';}
  };
 });
}
