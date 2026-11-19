// Đọc file .xlsx ngay trong trình duyệt, không thư viện: giải nén zip bằng DecompressionStream('deflate-raw'),
// đọc sharedStrings, workbook + rels, styles (cellXfs, numFmts) để biết ô nào là NGÀY.
// readXlsx(file) -> [{ name, rows: [[ô | null]] }], ô = { v, t: 's' | 'n' | 'd', y, m, d }
//   - t 's': chuỗi, giữ nguyên chữ; 'n': số (v là số); 'd': ngày (v = 'yyyy-mm-dd', kèm y, m, d đúng như ô ghi).
//   - rows[i] là dòng Excel thứ i+1 (dòng trống là mảng rỗng); ô trống là null.
const dec = new TextDecoder('utf-8');
const u16 = (b, o) => b[o] | (b[o + 1] << 8), u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

async function inflate(bytes) {
  if (typeof DecompressionStream === 'undefined') throw new Error('Trình duyệt này chưa hỗ trợ đọc file .xlsx. Hãy dùng Chrome bản mới.');
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
/* Danh sách mục trong zip (đọc thư mục trung tâm), trả về hàm lấy nội dung chữ của một mục */
function openZip(buf) {
  const b = new Uint8Array(buf);
  let e = -1; for (let i = b.length - 22; i >= Math.max(0, b.length - 65600); i--) if (u32(b, i) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('Không phải file .xlsx (không đọc được cấu trúc zip).');
  const n = u16(b, e + 10); let p = u32(b, e + 16); const ents = new Map();
  for (let i = 0; i < n && u32(b, p) === 0x02014b50; i++) {
    const nl = u16(b, p + 28), xl = u16(b, p + 30), cl = u16(b, p + 32);
    ents.set(dec.decode(b.subarray(p + 46, p + 46 + nl)), { m: u16(b, p + 10), cs: u32(b, p + 20), off: u32(b, p + 42) });
    p += 46 + nl + xl + cl;
  }
  return {
    has: name => ents.has(name),
    text: async name => {
      const en = ents.get(name); if (!en) return null;
      const o = en.off, ds = o + 30 + u16(b, o + 26) + u16(b, o + 28), raw = b.subarray(ds, ds + en.cs);
      return dec.decode(en.m === 0 ? raw : await inflate(raw));
    }
  };
}

const ent = s => s.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi, (m, g) => g[0] === '#' ? String.fromCodePoint(g[1].toLowerCase() === 'x' ? parseInt(g.slice(2), 16) : +g.slice(1)) : ({ lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" })[g.toLowerCase()]);
const attr = (tag, name) => { const m = tag.match(new RegExp('\\b' + name + '="([^"]*)"')); return m ? ent(m[1]) : ''; };
/* nối các <t> của một khối, bỏ phần phiên âm <rPh> */
const tText = x => [...x.replace(/<rPh[\s\S]*?<\/rPh>/g, '').matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m => ent(m[1])).join('');

/* Kiểu ô nào là ngày: numFmtId dựng sẵn của Excel (14-22, 27-36, 45-47, 50-58) hoặc định dạng riêng có d/m/y ngoài dấu nháy, ngoặc */
const BUILTIN_DATE = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);
const isDateFmt = code => /[dy]/i.test(code.replace(/"[^"]*"/g, '').replace(/\[[^\]]*\]/g, '').replace(/\\./g, ''));
const dateStyles = styles => {
  const fm = new Map([...styles.matchAll(/<numFmt\b[^>]*>/g)].map(m => [+attr(m[0], 'numFmtId'), attr(m[0], 'formatCode')]));
  const cx = (styles.match(/<cellXfs\b[\s\S]*?<\/cellXfs>/) || [''])[0];
  return [...cx.matchAll(/<xf\b[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)].map(m => { const id = +attr(m[0], 'numFmtId'); return BUILTIN_DATE.has(id) || (fm.has(id) && isDateFmt(fm.get(id))); });
};

const colNo = ref => { const l = ref.match(/^[A-Z]+/)[0]; let n = 0; for (const ch of l) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
const pad = n => String(n).padStart(2, '0');
const fromSerial = v => { const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 864e5); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; };
const isoCell = (y, m, d) => ({ t: 'd', v: y + '-' + pad(m) + '-' + pad(d), y, m, d });

function parseSheet(xml, sst, dstyle) {
  const rows = [];
  for (const rm of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rn = +attr(rm[1], 'r'), row = [];
    if (rm[2]) for (const cm of rm[2].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(cm[1], 'r'), t = attr(cm[1], 't'), body = cm[2] || '', vm = body.match(/<v>([\s\S]*?)<\/v>/), v = vm ? ent(vm[1]) : '';
      let cell = null;
      if (t === 'inlineStr') { const s = tText(body); if (s !== '') cell = { t: 's', v: s }; }
      else if (v === '' || !vm) cell = null;
      else if (t === 's') cell = { t: 's', v: sst[+v] == null ? '' : sst[+v] };
      else if (t === 'str' || t === 'e') cell = { t: 's', v };
      else if (t === 'b') cell = { t: 'n', v: +v };
      else if (t === 'd') { const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/); cell = m ? isoCell(+m[1], +m[2], +m[3]) : { t: 's', v }; }
      else { const x = parseFloat(v); if (isNaN(x)) cell = { t: 's', v }; else if (dstyle[+attr(cm[1], 's')] && x >= 1) cell = isoCell(...Object.values(fromSerial(x))); else cell = { t: 'n', v: x }; }
      if (ref) row[colNo(ref)] = cell;
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = null;
    while (rows.length < rn - 1) rows.push([]);
    rows[rn - 1] = row;
  }
  return rows;
}

export async function readXlsx(file) {
  const z = openZip(await file.arrayBuffer());
  const wb = await z.text('xl/workbook.xml'); if (!wb) throw new Error('Không phải file .xlsx của Excel (thiếu xl/workbook.xml).');
  const rels = new Map([...(await z.text('xl/_rels/workbook.xml.rels') || '').matchAll(/<Relationship\b[^>]*>/g)].map(m => [attr(m[0], 'Id'), attr(m[0], 'Target')]));
  const ss = await z.text('xl/sharedStrings.xml'), sst = ss ? [...ss.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)].map(m => m[1] ? tText(m[1]) : '') : [];
  const st = await z.text('xl/styles.xml'), dstyle = st ? dateStyles(st) : [];
  const out = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const tg = rels.get(attr(m[0], 'r:id')); if (!tg) continue;
    const p = tg.startsWith('/') ? tg.slice(1) : 'xl/' + tg.replace(/^\.\//, '');
    const xml = await z.text(p); if (xml == null) continue;
    out.push({ name: attr(m[0], 'name'), rows: parseSheet(xml, sst, dstyle) });
  }
  return out;
}
