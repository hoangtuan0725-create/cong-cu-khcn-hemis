// Chạy trên trang công cụ (GitHub Pages): chuyển yêu cầu của trang tới background.js rồi trả kết quả về.
// Trang và tiện ích chỉ nói chuyện qua window.postMessage cùng origin.
window.addEventListener('message', e => {
  if (e.source !== window || !e.data || e.data.t2h !== 'req') return;
  const { id, msg } = e.data;
  const reply = res => window.postMessage({ t2h: 'res', id, res }, location.origin);
  try {
    chrome.runtime.sendMessage(msg, res => {
      const err = chrome.runtime.lastError;
      reply(err ? { ok: false, err: 'Tiện ích không phản hồi: ' + err.message } : res || { ok: false, err: 'Tiện ích không trả kết quả' });
    });
  } catch (err) {
    reply({ ok: false, err: 'Tiện ích vừa được cập nhật. Hãy tải lại trang (F5).' });
  }
});
