// Xuất file Excel .xlsx thật (không dùng thư viện): dòng tiêu đề đậm, cố định tiêu đề khi cuộn,
// cột tự rộng theo nội dung, chữ dài tự xuống dòng (không mất chữ), số để dạng số.
// sheets: [{ name, rows: [[ô]], head: số dòng tiêu đề, freezeCols, merges: ['A1:C1'], totals: [chỉ số dòng tổng] }]

const enc = new TextEncoder();
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

/* Nen ZIP kieu "luu nguyen" (store) - du cho Excel doc */
const zip = files => {
  const parts = [], cen = []; let off = 0;
  const u16 = v => [v & 255, (v >>> 8) & 255], u32 = v => [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255];
  files.forEach(([name, text]) => {
    const nm = enc.encode(name), data = enc.encode(text), c = crc32(data);
    const head = [0x50, 0x4b, 3, 4, ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0)];
    parts.push(new Uint8Array(head), nm, data);
    cen.push([0x50, 0x4b, 1, 2, ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(0), ...u16(0x21), ...u32(c), ...u32(data.length), ...u32(data.length), ...u16(nm.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(off)], nm);
    off += head.length + nm.length + data.length;
  });
  let size = 0; const cparts = [];
  for (let i = 0; i < cen.length; i += 2) { const h = new Uint8Array(cen[i]); cparts.push(h, cen[i + 1]); size += h.length + cen[i + 1].length; }
  const end = new Uint8Array([0x50, 0x4b, 5, 6, ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(size), ...u32(off), ...u16(0)]);
  return new Blob([...parts, ...cparts, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const x = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
const col = i => { let s = ''; i++; while (i) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - 1 - m) / 26; } return s; };
/* do rong hien thi: chu co dau tinh nhu chu thuong */
const vlen = v => { if (v == null) return 0; if (typeof v === 'number') return v.toLocaleString('vi-VN', { maximumFractionDigits: 2 }).length; return Math.max(...String(v).split('\n').map(l => l.length)); };

/* kieu o: 0 thuong, 1 tieu de, 7 tieu de nhom (dong tieu de tren, canh trai de khong bi khuat khi gop nhieu cot), 2 so nguyen, 3 so le, 4 dong tong (chu), 5 dong tong so nguyen, 6 dong tong so le */
const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.###"/></numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDBE6FE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEFF4FF"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>' +
  '<xf numFmtId="3" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="1" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>' +
  '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  '<xf numFmtId="3" fontId="1" fillId="3" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
  '<xf numFmtId="164" fontId="1" fillId="3" borderId="1" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
  '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

const sheetXml = sh => {
  const rows = sh.rows || [], head = sh.head == null ? 1 : sh.head, tot = new Set(sh.totals || []);
  const nc = Math.max(1, ...rows.map(r => r.length));
  /* do rong cot: theo noi dung dai nhat (khong tinh dong tieu de gop), toi da 60 ky tu, chu dai hon thi xuong dong */
  const w = Array.from({ length: nc }, (_, c) => { let m = 6; rows.forEach((r, i) => { const v = r[c]; if (v == null || v === '') return; const L = vlen(v); if (i < head && L > 18 && sh.merges && sh.merges.some(mg => mg.startsWith(col(c) + (i + 1) + ':'))) return; m = Math.max(m, i < head ? Math.min(L, 24) : L); }); return Math.min(60, m + 2); });
  let s = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">';
  const fc = sh.freezeCols || 0;
  if (head || fc) s += '<sheetViews><sheetView workbookViewId="0"><pane' + (fc ? ' xSplit="' + fc + '"' : '') + (head ? ' ySplit="' + head + '"' : '') + ' topLeftCell="' + col(fc) + (head + 1) + '" activePane="' + (head && fc ? 'bottomRight' : head ? 'bottomLeft' : 'topRight') + '" state="frozen"/></sheetView></sheetViews>';
  s += '<cols>' + w.map((v, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + v + '" customWidth="1"/>').join('') + '</cols><sheetData>';
  rows.forEach((r, i) => {
    s += '<row r="' + (i + 1) + '">';
    r.forEach((v, c) => {
      const hs = i < head - 1 && c >= fc ? 7 : 1;
      if (v == null || v === '') { if (i < head) s += '<c r="' + col(c) + (i + 1) + '" s="' + hs + '"/>'; return; }
      const ref = col(c) + (i + 1), T = tot.has(i);
      if (typeof v === 'number' && isFinite(v)) { const int = Number.isInteger(v); s += '<c r="' + ref + '" s="' + (i < head ? hs : T ? (int ? 5 : 6) : (int ? 2 : 3)) + '"><v>' + v + '</v></c>'; }
      else s += '<c r="' + ref + '" s="' + (i < head ? hs : T ? 4 : 0) + '" t="inlineStr"><is><t xml:space="preserve">' + x(v) + '</t></is></c>';
    });
    s += '</row>';
  });
  s += '</sheetData>';
  if (sh.merges && sh.merges.length) s += '<mergeCells count="' + sh.merges.length + '">' + sh.merges.map(m => '<mergeCell ref="' + m + '"/>').join('') + '</mergeCells>';
  if (head && rows.length > head) s += '<autoFilter ref="A' + head + ':' + col(nc - 1) + rows.length + '"/>';
  return s + '<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/></worksheet>';
};

const defs = (sheets, names) => {
  const d = sheets.map((s, i) => { const h = s.head == null ? 1 : s.head, rows = s.rows || []; return h && rows.length > h ? '<definedName name="_xlnm._FilterDatabase" localSheetId="' + i + '" hidden="1">\'' + x(names[i]).replace(/'/g, "''") + '\'!$A$' + h + ':$' + col(Math.max(1, ...rows.map(r => r.length)) - 1) + '$' + rows.length + '</definedName>' : ''; }).join('');
  return d ? '<definedNames>' + d + '</definedNames>' : '';
};
export const xlsxBlob = sheets => {
  const used = new Set();
  const nm = s => { let n = String(s || 'Bảng').replace(/[\[\]:*?/\\]/g, ' ').slice(0, 31).trim() || 'Bảng', k = 2; while (used.has(n.toLowerCase())) n = n.slice(0, 28) + ' ' + k++; used.add(n.toLowerCase()); return n; };
  const names = sheets.map(s => nm(s.name));
  return zip([
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map((s, i) => '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('') + '</Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + names.map((n, i) => '<sheet name="' + x(n) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>').join('') + '</sheets>' + defs(sheets, names) + '</workbook>'],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map((s, i) => '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>').join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml', STYLES]
  ].concat(sheets.map((s, i) => ['xl/worksheets/sheet' + (i + 1) + '.xml', sheetXml(s)])));
};

/* Tai file: ten file tieng Viet, kem ngay */
export const downloadXlsx = (name, sheets) => {
  if (!Array.isArray(sheets)) sheets = [sheets];
  const a = document.createElement('a'); a.href = URL.createObjectURL(xlsxBlob(sheets));
  a.download = String(name).replace(/[\\/:*?"<>|_]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ' + new Date().toISOString().slice(0, 10) + '.xlsx';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
