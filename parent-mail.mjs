import {randomUUID,createHash} from 'node:crypto';
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const validEmail=value=>typeof value==='string'&&value.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value);
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function createParentMailService({db,persist,learning,mailer}){
  db.parentMail??=[];
  const drafts=new Map();let running=false;
  for(const batch of db.parentMail)for(const r of batch.recipients)if(r.status==='sending'){r.status='unknown';r.error='Máy chủ khởi động lại khi đang gửi. Kiểm tra thư đã gửi trước khi gửi lại.';}
  const guard=user=>{if(user?.role!=='teacher')fail(403,'Chỉ giáo viên được gửi thông báo phụ huynh.');};
  const current=user=>{guard(user);const teacher=db.users.find(u=>u.id===user.id);guard(teacher);return teacher;};
  function selection(user,input){
    const teacher=current(user);let ids;
    if(input.classId){const c=db.classes.find(c=>c.id===input.classId&&c.teacherId===teacher.id);if(!c)fail(404,'Không tìm thấy lớp của bạn.');ids=c.studentIds.filter(id=>teacher.studentIds.includes(id));}
    else if(input.studentId&&teacher.studentIds.includes(input.studentId))ids=[input.studentId];
    else fail(400,'Chọn lớp hoặc học sinh được phân công.');
    const students=ids.map(id=>db.users.find(u=>u.id===id&&u.role==='student')).filter(Boolean),recipients=new Map(),missing=[];
    for(const student of students){
      const parents=db.users.filter(u=>u.role==='parent'&&u.studentIds.includes(student.id));let found=false;
      for(const parent of parents){
        if(!validEmail(parent.email))continue;found=true;
        const email=parent.email.toLowerCase(),r=recipients.get(email)||{email,parentNames:[],links:[],students:[]};
        if(!r.parentNames.includes(parent.name))r.parentNames.push(parent.name);
        r.links.push({parentId:parent.id,studentId:student.id});
        if(!r.students.some(s=>s.id===student.id))r.students.push({id:student.id,name:student.name});
        recipients.set(email,r);
      }
      if(!found)missing.push(student.name);
    }
    return {recipients:[...recipients.values()],missing};
  }
  function allowed(teacher,r){return r.links.every(link=>teacher.studentIds.includes(link.studentId)&&db.users.some(u=>u.id===link.parentId&&u.role==='parent'&&u.email?.toLowerCase()===r.email&&u.studentIds.includes(link.studentId)));}
  function history(user){const teacher=current(user);return db.parentMail.filter(b=>b.teacherId===teacher.id).slice(-30).reverse().map(({fingerprint,...b})=>b);}
  function options(user){const teacher=current(user);return {...mailer.status(),classes:learning.classes(teacher),students:db.users.filter(u=>u.role==='student'&&teacher.studentIds.includes(u.id)).map(u=>({id:u.id,name:u.name})),history:history(teacher)};}
  function preview(user,input){
    const teacher=current(user);
    if(typeof input.subject!=='string'||!input.subject.trim()||input.subject.length>160||/[\r\n\x00]/.test(input.subject)||typeof input.message!=='string'||!input.message.trim()||input.message.length>4000)fail(400,'Nhập tiêu đề tối đa 160 ký tự và lời nhắn tối đa 4.000 ký tự.');
    const resolved=selection(teacher,input);
    if(!resolved.recipients.length)fail(400,'Chưa có email phụ huynh hợp lệ. Kiểm tra danh sách phụ huynh được nhập từ Excel.');
    if(resolved.recipients.length>200)fail(400,'Mỗi lần gửi tối đa 200 phụ huynh.');
    const recipients=resolved.recipients.map(r=>{
      let text=`Kính gửi phụ huynh ${r.parentNames.join(', ')},\n\nHọc sinh: ${r.students.map(s=>s.name).join(', ')}.\n\n${input.message.trim()}`;
      if(input.includeReport===true){
        text+='\n\nKẾT QUẢ HỌC TẬP HIỆN TẠI';
        for(const s of r.students){const report=learning.report(teacher,s.id);text+=`\n\n${s.name} — Khối ${report.grade}\nĐáp án đầu đúng: ${report.correct}/${report.total} lượt đã làm.`;
          if(!report.total)text+=' Chưa có dữ liệu bài làm.';
          for(const a of report.assignments.slice(-5))text+=`\n• ${a.title}: ${a.result.score}/10; đã làm ${a.result.answered}/${a.result.total} câu.`;
        }
        text+='\n\nĐiểm nhiệm vụ dựa trên đáp án đầu; câu chưa làm tạm tính 0. Đây là dữ liệu tại lúc giáo viên soạn thông báo.';
      }
      text+=`\n\nTrân trọng,\n${teacher.name}\nPhòng thí nghiệm Tư duy Toán`;
      return {...r,id:randomUUID(),text,status:'pending'};
    });
    for(const [id,d] of drafts)if(d.expires<Date.now())drafts.delete(id);
    if(drafts.size>=100)fail(429,'Có quá nhiều bản xem trước. Vui lòng thử lại sau.');
    const draft={id:randomUUID(),teacherId:teacher.id,subject:input.subject.trim(),recipients,missing:resolved.missing,expires:Date.now()+15*60*1000};
    draft.fingerprint=digest({teacher:teacher.id,subject:draft.subject,recipients:recipients.map(r=>({email:r.email,text:r.text}))});
    drafts.set(draft.id,draft);return draft;
  }
  function send(user,id){
    const teacher=current(user),previous=db.parentMail.find(b=>b.id===id&&b.teacherId===teacher.id);if(previous)return previous;
    if(!mailer.status().configured)fail(503,'Chưa cấu hình Gmail gửi thư trên máy chủ.');
    const draft=drafts.get(id);if(!draft||draft.teacherId!==teacher.id||draft.expires<Date.now())fail(404,'Bản xem trước hết hạn. Hãy xem lại nội dung.');
    if(draft.recipients.some(r=>!allowed(teacher,r)))fail(409,'Liên kết hoặc email phụ huynh đã thay đổi. Hãy xem trước lại.');
    const duplicate=db.parentMail.find(b=>b.teacherId===teacher.id&&b.fingerprint===draft.fingerprint&&b.created>Date.now()-15*60*1000);if(duplicate)return duplicate;
    const recent=db.parentMail.filter(b=>b.created>Date.now()-24*60*60*1000).reduce((n,b)=>n+b.recipients.length,0);
    if(recent+draft.recipients.length>300)fail(429,'Hệ thống giới hạn 300 email trong 24 giờ. Vui lòng gửi phần còn lại sau.');
    const batch={...structuredClone(draft),created:Date.now()};delete batch.expires;
    db.parentMail.push(batch);try{persist();}catch(error){db.parentMail.pop();throw error;}
    drafts.delete(id);setImmediate(()=>flush());return batch;
  }
  async function flush(){
    if(running||!mailer.status().configured)return;running=true;
    try{
      for(const batch of db.parentMail)for(const r of batch.recipients){
        if(r.status!=='pending')continue;
        const teacher=db.users.find(u=>u.id===batch.teacherId&&u.role==='teacher');
        if(!teacher||!allowed(teacher,r)){r.status='skipped';r.error='Quyền hoặc email phụ huynh đã thay đổi.';persist();continue;}
        r.status='sending';r.updated=Date.now();
        try{persist();}catch(error){r.status='failed';r.error='Không ghi được hàng đợi; chưa gửi thư này.';throw error;}
        try{await mailer.send({email:r.email,subject:batch.subject,text:r.text,id:r.id});r.status='sent';r.error='';}
        catch(error){
          const definitive=['EAUTH','EENVELOPE'].includes(error.code)||Number(error.responseCode)>=400;
          r.status=definitive?'failed':'unknown';r.error=definitive?'Gmail từ chối gửi. Kiểm tra cấu hình Gmail và địa chỉ nhận.':'Chưa xác định Gmail đã nhận thư hay chưa. Kiểm tra thư đã gửi trước khi tạo thông báo mới.';
        }
        r.updated=Date.now();
        try{persist();}catch(error){r.status='unknown';r.error='Không lưu được kết quả gửi. Kiểm tra thư đã gửi trước khi tạo thông báo mới.';throw error;}
      }
    }catch{console.error('Email queue stopped: could not persist delivery state.');}
    finally{running=false;}
  }
  // Only already-confirmed pending messages resume; interrupted sends are never retried automatically.
  if(db.parentMail.some(b=>b.recipients.some(r=>r.status==='pending')))setImmediate(()=>flush());
  return {options,preview,send,history,flush};
}
