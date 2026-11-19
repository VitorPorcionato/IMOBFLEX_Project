// Run only against an isolated dataset containing 1,000 fictitious properties.
const base=process.env.BENCHMARK_URL||'http://127.0.0.1:8081/api/v1/public/properties';
const initial=await (await fetch(base)).json();
if(initial.total!==1000)throw new Error('Expected an isolated catalog with exactly 1000 properties.');
for(let i=0;i<20;i++)await (await fetch(base)).arrayBuffer();
const timings=[];let next=0;
await Promise.all(Array.from({length:20},async()=>{while(next<400){const i=next++;const start=performance.now();const response=await fetch(`${base}?page=${i%83}`);if(!response.ok)throw new Error(`HTTP ${response.status}`);await response.arrayBuffer();timings.push(performance.now()-start);}}));
timings.sort((a,b)=>a-b);
console.log(JSON.stringify({requests:timings.length,concurrency:20,properties:initial.total,p50_ms:timings[199],p95_ms:timings[379],max_ms:timings.at(-1)},null,2));
if(timings[379]>=500)process.exitCode=1;
