const fs=require('fs');
const code=fs.readFileSync('ui/js/dashboard.js','utf8');
const lines=code.split('\n');
let startLine=-1;
for(let i=0;i<lines.length;i++){
    if(lines[i].includes('DOMContentLoaded')){startLine=i;break;}
}
if(startLine===-1){console.log('not found');process.exit(0);}
console.log('DOMContentLoaded start at line',startLine+1);
let brace=0,inString=false,esc=false;
for(let i=startLine;i<code.length;i++){
    let c=code[i];
    if(c==='"' || c==='\''){
        if(!esc) inString=!inString;
    }
    if(c==='\\') esc=!esc; else esc=false;
    if(inString) continue;
    if(c=='{') brace++;
    if(c==='}'){
        brace--;
        if(brace===0){
            const upto=code.slice(0,i);
            const lineCount=upto.split('\n').length;
            console.log('matching closing brace at char pos',i,'line',lineCount);
            break;
        }
    }
}
