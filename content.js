window.WA_BRIDGE = {
  /**
   * Find chat input editor - with multiple selector fallbacks
   */
  findEditor: function() {
    const selectors = [
      'div[contenteditable="true"][data-tab="10"]',
      'div[contenteditable="true"][data-tab="1"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]'
    ];
    
    for (const selector of selectors) {
      const editor = document.querySelector(selector);
      if (editor) {
        console.log(`[WA_BRIDGE] ✅ Editor found: ${selector}`);
        return editor;
      }
    }
    
    console.error('[WA_BRIDGE] ❌ Editor tidak ditemukan!');
    return null;
  },

  /**
   * Try to open chat using WhatsApp internal routing (TRUE ZERO RELOAD)
   */
  openChatInternal: async function(phone) {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
    console.log(`[WA_BRIDGE] 🚀 Trying TRUE ZERO RELOAD method for ${clean}`);
    
    try {
      // Try to use WhatsApp's internal Store/Router
      if (window.Store && window.Store.Chat) {
        console.log('[WA_BRIDGE] 📱 Using WhatsApp Store API');
        const chat = await window.Store.Chat.find(clean + '@c.us');
        if (chat) {
          await window.Store.Cmd.openChatAt(chat);
          console.log('[WA_BRIDGE] ✅ Chat opened via Store API');
          return true;
        }
      }
      
      // Fallback: Search in existing chat list
      const chatLink = document.querySelector(`a[href*="${clean}"]`);
      if (chatLink) {
        console.log('[WA_BRIDGE] ✅ Chat found in list, clicking...');
        chatLink.click();
        return true;
      }
      
      console.log('[WA_BRIDGE] ⚠️ Chat not in list, will use navigation');
      return false;
      
    } catch (error) {
      console.log('[WA_BRIDGE] ⚠️ Internal method failed:', error.message);
      return false;
    }
  },

  /**
   * Open chat and paste direct message (TANPA RELOAD!)
   */
  openChatAndPaste: async function (phone, text) {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
    console.log(`[WA_BRIDGE] 🔍 Membuka chat ${clean} (ZERO RELOAD)`);

    try {
      // METODE 1: Coba cari chat yang sudah ada di list
      const chatLink = document.querySelector(`a[href*="${clean}"]`);
      
      if (chatLink) {
        console.log('[WA_BRIDGE] ✅ Chat ditemukan di list, klik langsung!');
        chatLink.click();
        await new Promise(r => setTimeout(r, 800)); // Wait for chat to open
      } else {
        console.log('[WA_BRIDGE] ⚠️ Chat tidak ada di list, gunakan navigation');
        
        // METODE 2: Gunakan internal navigation (minimal reload)
        const link = document.createElement("a");
        link.href = `https://web.whatsapp.com/send?phone=${clean}`;
        link.target = "_self";
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        await new Promise(r => setTimeout(r, 1500)); // Wait longer for new chat
      }

      // Paste message
      const editor = this.findEditor();
      if (!editor) {
        alert("❌ Editor tidak ditemukan!");
        return;
      }

      editor.focus();
      document.execCommand("insertText", false, text);
      console.log("[WA_BRIDGE] ✅ Pesan ditempel. Silakan klik Send.");
      
    } catch (error) {
      console.error('[WA_BRIDGE] Error:', error);
      alert("❌ Gagal membuka chat: " + error.message);
    }
  },

  /**
   * Open chat and paste template with smart variable replacement (TANPA RELOAD!)
   * @param {string} phone - Phone number
   * @param {string} template - Template string with {{VARIABLES}}
   * @param {object} variables - Object with variable values
   */
  openChatAndPasteTemplate: async function (phone, template, variables) {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "62");
    console.log(`[WA_BRIDGE] 📝 Membuka chat ${clean} dengan template (ZERO RELOAD)`);
    console.log(`[WA_BRIDGE] Template:`, template);
    console.log(`[WA_BRIDGE] Variables:`, variables);

    try {
      // METODE 1: Coba cari chat yang sudah ada di list
      const chatLink = document.querySelector(`a[href*="${clean}"]`);
      
      if (chatLink) {
        console.log('[WA_BRIDGE] ✅ Chat ditemukan di list, klik langsung!');
        chatLink.click();
        await new Promise(r => setTimeout(r, 800)); // Wait for chat to open
      } else {
        console.log('[WA_BRIDGE] ⚠️ Chat tidak ada di list, gunakan navigation');
        
        // METODE 2: Gunakan internal navigation (minimal reload)
        const link = document.createElement("a");
        link.href = `https://web.whatsapp.com/send?phone=${clean}`;
        link.target = "_self";
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        await new Promise(r => setTimeout(r, 1500)); // Wait longer for new chat
      }

      // Replace variables in template with enhanced matching
      let processedMessage = template;
      if (variables && typeof variables === 'object') {
        // Create a normalized lookup for variables (case-insensitive)
        const normalizedVars = {};
        Object.keys(variables).forEach(key => {
          const normalizedKey = key.toUpperCase().replace(/\s+/g, '_').replace(/\n/g, '_');
          normalizedVars[normalizedKey] = variables[key];
          // Also store original key
          normalizedVars[key.toUpperCase()] = variables[key];
        });
        
        console.log('[WA_BRIDGE] Normalized variables:', normalizedVars);
        
        // Find all {{VARIABLE}} patterns in template
        const variablePattern = /{{([^}]+)}}/g;
        let match;
        const foundVars = [];
        
        while ((match = variablePattern.exec(template)) !== null) {
          foundVars.push(match[1]);
        }
        
        console.log('[WA_BRIDGE] Variables found in template:', foundVars);
        
        // Replace each variable
        foundVars.forEach(varName => {
          const normalizedVarName = varName.toUpperCase().replace(/\s+/g, '_').replace(/\n/g, '_');
          const regex = new RegExp(`{{${varName}}}`, 'gi');
          
          // Try multiple lookup strategies
          let value = variables[varName] // Exact match
            || variables[varName.toUpperCase()] // Uppercase match
            || normalizedVars[normalizedVarName] // Normalized match
            || normalizedVars[varName.toUpperCase()] // Uppercase normalized match
            || '-'; // Default fallback
          
          console.log(`[WA_BRIDGE] Replacing {{${varName}}} -> normalized: ${normalizedVarName} -> value: "${value}"`);
          processedMessage = processedMessage.replace(regex, value);
        });
      }

      console.log(`[WA_BRIDGE] Processed message:`, processedMessage);

      // Find editor and paste
      const editor = this.findEditor();
      if (!editor) {
        alert("❌ Editor tidak ditemukan!");
        return;
      }

      editor.focus();

      // Helper to insert text with line breaks (WhatsApp Web needs manual BR)
      const insertWithLineBreaks = (text) => {
        const escapeHtml = (str) => str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');

        // Convert newline to <br> while preserving original spacing
        const htmlMessage = escapeHtml(text).replace(/\r?\n/g, '<br>');

        // Directly set innerHTML so WhatsApp keeps <br> as line breaks
        editor.innerHTML = htmlMessage || '<br>';

        // Move caret to end
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        // Trigger input event so WhatsApp enables send button
        editor.dispatchEvent(new InputEvent('input', {
          bubbles: true,
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));
      };

      insertWithLineBreaks(processedMessage);
      
      console.log("[WA_BRIDGE] ✅ Template berhasil ditempel dengan variables!");
      
    } catch (error) {
      console.error('[WA_BRIDGE] Error:', error);
      alert("❌ Gagal membuka chat: " + error.message);
    }
  },
};
