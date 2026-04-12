const fs=require('fs');
const lines=fs.readFileSync('ui/js/dashboard.js','utf8').split('\n');
let balance=0;
let sawPositive=false;
for(let i=0;i<lines.length;i++){
    const line = lines[i];
    for(const c of line){
        if(c=='{') balance++;
        if(c=='}') balance--;
    }
    if(i>=640 && i<=670) console.log('line',i+1,'balance',balance, '>>', line.replace(/\t/g,'    '));
    if(balance>0) sawPositive=true;
    if(sawPositive && balance===0) {
        console.log('balance returned to zero at line', i+1, 'text:', line);
    }
    if(i<20 || i>lines.length-10) console.log(i+1, balance, line);
    if(balance<0){
        console.log('excess closing at line',i+1, 'line content:', line);
        balance=0; // continue scanning
    }
}
console.log('final balance', balance);
