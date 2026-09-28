const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const states={pending:'Đang chờ',sending:'Đang gửi',sent:'Gmail đã nhận thư',failed:'Gửi thất bại',unknown:'Chưa rõ kết quả',skipped:'Không gửi: liên kết thay đổi'};
export const parentMailHTML=()=>'<div id="parent-mail"><h1>Thông báo phụ huynh</h1><p>Đang tải thông tin…</p></div>';
export async function mountParentMail(root,{request}){
 const host=root.querySelector('#parent-mail');if(!host)return;
 try{
  const data=await request('/api/parent-mail/options');if(!host.isConnected)return;
  host.innerHTML=`<div class="intro"><div><h1>Thông báo phụ huynh</h1><p>Gửi email riêng cho phụ huynh của lớp hoặc từng học sinh.</p></div></div><section class="card"><p class="notice">${data.configured?`Gửi bằng Gmail hệ thống: ${esc(data.sender)}`:'Chưa cấu hình Gmail. Bạn vẫn có thể soạn và xem trước; quản trị cần cấu hình Gmail trên máy chủ để gửi.'}</p><form id="parent-mail-form"><label class="field">Gửi đến<select name="target" required><option value="">Chọn lớp hoặc học sinh</option><optgroup label="Theo lớp">${data.classes.map(c=>`<option value="class:${esc(c.id)}">${esc(c.name)}</option>`).join('')}</optgroup><optgroup label="Theo học sinh">${data.students.map(s=>`<option value="student:${esc(s.id)}">${esc(s.name)}</option>`).join('')}</optgroup></select></label><label class="field">Tiêu đề<input class="input" name="subject" required maxlength="160" placeholder="Thông báo tình hình học Toán tuần này"></label><label class="field">Lời nhắn cho phụ huynh<textarea name="message" required maxlength="4000" rows="6" placeholder="Kính nhờ gia đình nhắc con hoàn thành bài tập…"></textarea></label><label class="field"><input type="checkbox" name="includeReport"> Kèm kết quả học tập hiện tại của từng con</label><p>Mỗi email chỉ có dữ liệu của con được liên kết với phụ huynh đó. Nội dung email dùng văn bản thuần.</p><button class="btn">Xem trước nội dung và người nhận</button></form><p id="parent-mail-status" role="status"></p><div id="parent-mail-preview"></div></section><section class="card"><div class="button-row"><h2>Lịch sử gửi</h2><button class="btn secondary" id="parent-mail-refresh">Cập nhật trạng thái</button></div><p>“Gmail đã nhận thư” nghĩa là máy chủ Gmail chấp nhận gửi; không xác nhận phụ huynh đã nhận hoặc đọc. Hiển thị tối đa 30 đợt gần nhất.</p><div id="parent-mail-history"></div></section>`;
  const $=q=>host.querySelector(q),form=$('#parent-mail-form'),status=$('#parent-mail-status'),preview=$('#parent-mail-preview');let revision=0,busy=false,historySnapshot='';
  function history(items){const snapshot=JSON.stringify(items);if(snapshot===historySnapshot)return;historySnapshot=snapshot;$('#parent-mail-history').innerHTML=items.length?items.map(b=>`<details><summary>${esc(b.subject)} · ${new Date(b.created).toLocaleString('vi-VN')} · ${b.recipients.filter(r=>r.status==='sent').length}/${b.recipients.length} thư được Gmail chấp nhận</summary>${b.recipients.map(r=>`<details><summary>${esc(r.email)} — ${states[r.status]||esc(r.status)}</summary><p>${esc(r.students.map(s=>s.name).join(', '))}</p>${r.error?`<p>${esc(r.error)}</p>`:''}<pre class="mail-body">${esc(r.text)}</pre></details>`).join('')}</details>`).join(''):'Chưa có thông báo nào được gửi.';}
  history(data.history);
  async function refresh(){try{const items=await request('/api/parent-mail/history');if(host.isConnected)history(items);}catch(error){if(host.isConnected)status.textContent=error.message;}}
  $('#parent-mail-refresh').onclick=refresh;
  form.addEventListener('input',()=>{revision++;host.dataset.uploadDirty='true';preview.replaceChildren();});
  form.addEventListener('submit',async e=>{
   e.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button'),ticket=revision;button.disabled=true;preview.replaceChildren();status.textContent='Đang chuẩn bị bản xem trước…';
   try{
    const values=new FormData(form),[kind,id]=values.get('target').split(':');
    const draft=await request('/api/parent-mail/preview','POST',{[kind==='class'?'classId':'studentId']:id,subject:values.get('subject'),message:values.get('message'),includeReport:values.has('includeReport')});
    if(!host.isConnected||ticket!==revision)return;
    status.textContent=`${draft.recipients.length} email riêng sẽ được gửi. Hãy kiểm tra địa chỉ và nội dung bên dưới.`;
    preview.innerHTML=`<h2>Xem lại trước khi gửi</h2><p><strong>Tiêu đề:</strong> ${esc(draft.subject)}</p>${draft.missing.length?`<p class="notice">Không gửi cho ${draft.missing.length} học sinh chưa có email phụ huynh hợp lệ: ${esc(draft.missing.join(', '))}. Kiểm tra danh sách phụ huynh nhập từ Excel.</p>`:''}${draft.recipients.map(r=>`<details><summary>${esc(r.email)} · ${esc(r.students.map(s=>s.name).join(', '))}</summary><pre class="mail-body">${esc(r.text)}</pre></details>`).join('')}<p>Nhấn xác nhận để gửi email thật đến các địa chỉ trên.</p><button class="btn" id="parent-mail-confirm" ${data.configured?'':'disabled'}>Xác nhận gửi ${draft.recipients.length} email</button>`;
    $('#parent-mail-confirm').onclick=async()=>{
      const confirm=$('#parent-mail-confirm');confirm.disabled=true;button.disabled=true;
      form.querySelectorAll('input,textarea,select').forEach(el=>el.disabled=true);
      try{
        const batch=await request('/api/parent-mail/send','POST',{id:draft.id});
        if(!host.isConnected)return;preview.replaceChildren();delete host.dataset.uploadDirty;
        status.textContent=`Đã ghi nhận đợt gửi ${batch.recipients.length} email. Xem lịch sử bên dưới để theo dõi từng địa chỉ.`;
        await refresh();
      }catch(error){if(host.isConnected){status.textContent=error.message;confirm.disabled=false;}}
      finally{if(host.isConnected){button.disabled=false;form.querySelectorAll('input,textarea,select').forEach(el=>el.disabled=false);}}
    };
   }catch(error){if(host.isConnected)status.textContent=error.message;}finally{busy=false;if(host.isConnected)button.disabled=false;}
  });
  const timer=setInterval(()=>{if(!host.isConnected){clearInterval(timer);return;}refresh();},5000);
 }catch(error){if(host.isConnected)host.innerHTML=`<h1>Thông báo phụ huynh</h1><p role="alert">${esc(error.message)}</p><button class="btn" id="parent-mail-retry">Thử lại</button>`;host.querySelector('#parent-mail-retry')?.addEventListener('click',()=>mountParentMail(root,{request}));}
}
