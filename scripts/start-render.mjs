import {createStore} from '../auth-store.mjs';
import {seedRender} from './seed-render.mjs';

// Run at start, after Render mounts the persistent disk; never during build.
if(!process.env.MATH_DB_PATH)throw Error('MATH_DB_PATH is required for persistent storage.');
seedRender(process.env.MATH_DB_PATH,process.env.INITIAL_ADMIN_PASSWORD);
const store=createStore();
if(!store.users().length){
  const password=process.env.INITIAL_ADMIN_PASSWORD;
  if(!password||password.length<12)throw Error('Set INITIAL_ADMIN_PASSWORD to at least 12 characters in Render Environment.');
  store.createUser({username:'quantri',name:'Quản trị hệ thống',role:'admin',password});
  console.log('Initial admin created: quantri. Password is supplied through Render Environment.');
}
// Import only after initialization so the server reads the completed database.
const {server}=await import('../server.mjs');
server.listen(Number(process.env.PORT)||3000,process.env.HOST||'0.0.0.0',()=>console.log('Math Lab is ready.'));
process.on('SIGTERM',()=>{server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();});
