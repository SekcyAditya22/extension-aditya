chrome.runtime.onMessageExternal.addListener((msg, sender, sendResponse) => {
  console.log("[WA_BRIDGE] 📥 Pesan eksternal diterima:", msg);
  console.log("[WA_BRIDGE] 📤 Sender origin:", sender.url);
  
  // Expose extension ID for auto-detection
  const extensionId = chrome.runtime.id;
  
  // Handle ping messages for extension discovery
  if (msg.type === 'ping') {
    console.log("[WA_BRIDGE] 🔍 Ping received - responding with extension ID");
    sendResponse({ ok: true, extensionId: extensionId, ping: true });
    return true; // Keep channel open
  }

  chrome.tabs.query({ url: "*://web.whatsapp.com/*" }).then((tabs) => {
      const tab = tabs[0];
      if (!tab) {
        console.log("[WA_BRIDGE] ❌ WhatsApp Web tab tidak ditemukan");
        sendResponse({ ok: false, error: "Tab WhatsApp Web tidak ditemukan. Silakan buka WhatsApp Web di tab baru dan login terlebih dahulu.", extensionId: extensionId });
        return;
      }
    console.log("[WA_BRIDGE] ✅ WhatsApp Web tab found:", tab.id);

    const phoneStr = String(msg.phone || '').trim();
    const messageStr = String(msg.message || msg.template || '').trim();
    const variablesStr = msg.variables ? JSON.stringify(msg.variables) : null;

    console.log('[WA_BRIDGE] 📤 Sending to tab:', { phoneStr, messageStr, variablesStr });

      if (!phoneStr || !messageStr) {
        console.warn('[WA_BRIDGE] 🚫 Data kosong, tidak inject dan tidak memindahkan tab WhatsApp Web!');
        sendResponse({ ok: false, error: 'Data WhatsApp kosong, tidak diproses.', extensionId: extensionId });
        return;
      }

    chrome.tabs.update(tab.id, { active: true }).then(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (phone, messageOrTemplate, variablesJson) => {
          console.log('[WA_BRIDGE INJECT] 🎯 Executing in existing tab');
          console.log('[WA_BRIDGE INJECT] Phone:', phone);
          console.log('[WA_BRIDGE INJECT] Template:', messageOrTemplate);
          console.log('[WA_BRIDGE INJECT] Variables JSON:', variablesJson);
          if (window.WA_BRIDGE) {
            const variables = variablesJson ? JSON.parse(variablesJson) : null;
            console.log('[WA_BRIDGE INJECT] Parsed variables:', variables);
            if (variables) {
              window.WA_BRIDGE.openChatAndPasteTemplate(phone, messageOrTemplate, variables);
            } else {
              window.WA_BRIDGE.openChatAndPaste(phone, messageOrTemplate);
            }
          } else {
            console.error('[WA_BRIDGE] WA_BRIDGE not loaded!');
          }
        },
        args: [phoneStr, messageStr, variablesStr],
      }).then(() => {
        sendResponse({ ok: true, existingTab: true, extensionId: extensionId });
      }).catch((err) => {
        console.error("[WA_BRIDGE] ❌ Error executing script:", err);
        sendResponse({ ok: false, error: err.message, extensionId: extensionId });
      });
    }).catch((err) => {
      console.error("[WA_BRIDGE] ❌ Error updating tab:", err);
      sendResponse({ ok: false, error: err.message, extensionId: extensionId });
    });
  }).catch((err) => {
    console.error("[WA_BRIDGE] ❌ Error querying tabs:", err);
    sendResponse({ ok: false, error: err.message, extensionId: extensionId });
  });
  return true; // Keep async
});