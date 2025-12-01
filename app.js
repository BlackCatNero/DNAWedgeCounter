// WedgeCounter - app.js (updated)

const addBtn = document.getElementById('addBtn');
const modal = document.getElementById('modal');
const modalAdd = document.getElementById('modalAdd');
const modalCancel = document.getElementById('modalCancel');
const wedgeNameInput = document.getElementById('wedgeName');
const wedgeTableBody = document.querySelector('#wedgeTable tbody');
const clearBtn = document.getElementById('clearBtn');
const warnModal = document.getElementById('warnModal');
const warnMsg = document.getElementById('warnMsg');
const warnNoConsume = document.getElementById('warnNoConsume');
const warnForce = document.getElementById('warnForce');
const warnCancel = document.getElementById('warnCancel');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');

let wedges = []; // {id, name, owned, blueprints, subs, subReq}
let pendingProduceId = null; // wedge id awaiting user choice in warn modal

function save(){
  localStorage.setItem('wedgeData', JSON.stringify(wedges));
}
function load(){
  const raw = localStorage.getItem('wedgeData');
  if(raw) wedges = JSON.parse(raw);
}

function enhancementFor(count){
  if(count>=10) return '+10';
  if(count>=7) return '+9';
  if(count>=5) return '+8';
  if(count>=3) return '+7';
  if(count>=2) return '+6';
  if(count>=1) return '+5';
  return '-';
}

function hideWarn(){ warnModal.classList.add('hidden'); pendingProduceId = null; }
function showWarn(message, wedgeId){
  warnMsg.style.whiteSpace = 'pre-line';
  warnMsg.textContent = message;
  pendingProduceId = wedgeId;
  warnModal.classList.remove('hidden');
}

function render(){
  wedgeTableBody.innerHTML = '';
  wedges.forEach(w => {
    const tr = document.createElement('tr');

    // name (editable)
    const tdName = document.createElement('td');
    const nameInput = document.createElement('input');
    nameInput.type = 'text'; nameInput.value = w.name; nameInput.maxLength = 40; nameInput.className = 'name-input';
    nameInput.addEventListener('change', ()=>{ w.name = nameInput.value.trim() || w.name; save(); render(); });
    tdName.appendChild(nameInput); tr.appendChild(tdName);

    // owned (editable only) + 제작 버튼 to the right
    const tdOwned = document.createElement('td');
    const ownedInput = document.createElement('input'); ownedInput.type='number'; ownedInput.className='small-input';
    ownedInput.min = 0; ownedInput.max = 10; ownedInput.value = w.owned;
    ownedInput.addEventListener('change', ()=>{
      let val = parseInt(ownedInput.value||0,10); if(isNaN(val)) val=0; val = Math.max(0, Math.min(10, val)); w.owned = val; save(); render();
    });
    const produceInline = document.createElement('button'); produceInline.textContent='제작'; produceInline.className='icon plus';
    // append input then inline produce button
    tdOwned.appendChild(ownedInput);
    tdOwned.appendChild(produceInline);
    tr.appendChild(tdOwned);

    // blueprints
    const tdBP = document.createElement('td');
    const bpInput = document.createElement('input'); bpInput.type='number'; bpInput.min=0; bpInput.value = w.blueprints;
    bpInput.addEventListener('change', ()=>{ let val = parseInt(bpInput.value||0,10); if(isNaN(val)) val=0; w.blueprints = val; save(); render(); });
    tdBP.appendChild(bpInput); tr.appendChild(tdBP);

    // subs
    const tdSubs = document.createElement('td');
    const subInput = document.createElement('input'); subInput.type='number'; subInput.min=0; subInput.value = w.subs;
    subInput.addEventListener('change', ()=>{ let val = parseInt(subInput.value||0,10); if(isNaN(val)) val=0; w.subs = val; save(); render(); });
    tdSubs.appendChild(subInput); tr.appendChild(tdSubs);

    // 설계도 필요 (remaining to reach 10): max(0, (10 - owned) - blueprints)
    const tdBPNeed = document.createElement('td');
    const needToMax = Math.max(0, 10 - (Number.isFinite(w.owned) ? w.owned : 0));
    const bpNeeded = Math.max(0, needToMax - (Number.isFinite(w.blueprints) ? w.blueprints : 0));
    tdBPNeed.textContent = bpNeeded;
    tr.appendChild(tdBPNeed);

    // 하위 필요 (remaining to reach 10): max(0, (10 - owned) * subReq - subs)
    const tdSubNeed = document.createElement('td');
    const subNeeded = Math.max(0, needToMax * (w.subReq || 5) - (Number.isFinite(w.subs) ? w.subs : 0));
    tdSubNeed.textContent = subNeeded;
    tr.appendChild(tdSubNeed);

    // enhancement
    const tdEnh = document.createElement('td'); tdEnh.textContent = enhancementFor(w.owned); tr.appendChild(tdEnh);

    // controls (삭제 only)
    const tdCtrl = document.createElement('td');
    const del = document.createElement('button'); del.textContent='삭제'; del.className='icon';
    tdCtrl.appendChild(del); tr.appendChild(tdCtrl);

    // produce handler (inline button)
    produceInline.addEventListener('click', ()=>{
      if(w.owned >= 10){ alert('보유 수는 최대 10입니다.'); return; }
      const needBP = 1;
      const needSubs = w.subReq;
      const lackBP = w.blueprints < needBP;
      const lackSubs = w.subs < needSubs;
      if(!lackBP && !lackSubs){
        // enough resources: consume normally
        w.owned = Math.min(10, w.owned + 1);
        w.blueprints = Math.max(0, w.blueprints - needBP);
        w.subs = Math.max(0, w.subs - needSubs);
        save(); render();
        return;
      }
      // Show warning modal with options
      let msgLines = '';
      if(lackBP && lackSubs){
        msgLines = '설계도와 보라 쐐기가 부족합니다.\n';
      } else if(lackBP){
        msgLines = '설계도가 부족합니다.\n';
      } else if(lackSubs){
        msgLines = '보라 쐐기가 부족합니다.\n';
      }
      msgLines += '진행 시 아래 옵션 중 선택하세요.';
      showWarn(msgLines, w.id);
    });

    del.addEventListener('click', ()=>{
      if(!confirm(`${w.name} 항목을 삭제하시겠습니까?`)) return;
      wedges = wedges.filter(x=>x.id!==w.id); save(); render();
    });

    wedgeTableBody.appendChild(tr);
  });
}

// modal logic for add
addBtn.addEventListener('click', ()=>{ wedgeNameInput.value = ''; modal.classList.remove('hidden'); wedgeNameInput.focus(); });
modalCancel.addEventListener('click', ()=> modal.classList.add('hidden'));
modalAdd.addEventListener('click', ()=>{
  const name = wedgeNameInput.value.trim(); if(!name){ alert('이름을 입력하세요.'); return; }
  const radios = document.querySelectorAll('input[name=subReq]'); let subReq = 5; radios.forEach(r=>{ if(r.checked) subReq = parseInt(r.value,10); });
  const item = { id: Date.now() + Math.floor(Math.random()*1000), name, owned:0, blueprints:0, subs:0, subReq };
  wedges.push(item); save(); render(); modal.classList.add('hidden');
});

clearBtn.addEventListener('click', ()=>{ if(!confirm('모든 항목을 삭제하시겠습니까?')) return; wedges = []; save(); render(); });

// warn modal buttons
warnCancel.addEventListener('click', ()=>{ hideWarn(); });
warnNoConsume.addEventListener('click', ()=>{
  if(pendingProduceId == null) return hideWarn();
  const w = wedges.find(x=>x.id===pendingProduceId); if(!w) return hideWarn();
  w.owned = Math.min(10, w.owned + 1);
  save(); hideWarn(); render();
});
warnForce.addEventListener('click', ()=>{
  if(pendingProduceId == null) return hideWarn();
  const w = wedges.find(x=>x.id===pendingProduceId); if(!w) return hideWarn();
  w.owned = Math.min(10, w.owned + 1);
  // allow negative values when forcing
  w.blueprints = (w.blueprints || 0) - 1;
  w.subs = (w.subs || 0) - w.subReq;
  save(); hideWarn(); render();
});

// Export/Import
exportBtn.addEventListener('click', ()=>{
  const dataStr = JSON.stringify(wedges, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'wedges.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', ()=>{ importFile.value = ''; importFile.click(); });
importFile.addEventListener('change', (e)=>{
  const f = e.target.files && e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      if(!Array.isArray(parsed)) throw new Error('Invalid format');
      // Basic validation and normalization
      const sanitized = parsed.map(item => ({
        id: item.id || (Date.now()+Math.floor(Math.random()*1000)),
        name: item.name || '무명',
        owned: Number.isFinite(item.owned) ? item.owned : 0,
        blueprints: Number.isFinite(item.blueprints) ? item.blueprints : 0,
        subs: Number.isFinite(item.subs) ? item.subs : 0,
        subReq: item.subReq === 3 ? 3 : 5
      }));
      if(confirm('가져온 데이터로 현재 항목을 덮어쓰시겠습니까? (확인=덮어쓰기, 취소=중단)')){
        wedges = sanitized; save(); render();
      }
    }catch(err){ alert('JSON을 읽을 수 없습니다: ' + err.message); }
  };
  reader.readAsText(f);
});

// init
load(); render();
