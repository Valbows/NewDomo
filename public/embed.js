(function() {
  'use strict';

  // Domo Embed SDK
  var Domo = window.Domo || {};

  // Configuration
  var BASE_URL = window.DOMO_BASE_URL || 'https://domo.ai';
  var MIXPANEL_TOKEN = 'b6bca0aef2fc049b7376d9168e202cc6';
  var modal = null;
  var iframe = null;
  var isOpen = false;
  var currentToken = null;

  // Simple Mixpanel tracking (lightweight, no full SDK needed)
  function trackEvent(event, properties) {
    try {
      var data = {
        event: event,
        properties: Object.assign({
          token: MIXPANEL_TOKEN,
          distinct_id: getDistinctId(),
          time: Math.floor(Date.now() / 1000),
          $insert_id: generateId(),
          referrer: document.referrer || '',
          current_url: window.location.href,
        }, properties || {})
      };

      // Use sendBeacon for reliability, fallback to image pixel
      var payload = btoa(JSON.stringify(data));
      var url = 'https://api.mixpanel.com/track/?data=' + payload;

      if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
      } else {
        var img = new Image();
        img.src = url;
      }
    } catch (e) {
      // Silent fail - don't break the embed
    }
  }

  // Get or create a distinct ID for the user
  function getDistinctId() {
    var key = 'domo_distinct_id';
    var id = localStorage.getItem(key);
    if (!id) {
      id = 'anon_' + generateId();
      try {
        localStorage.setItem(key, id);
      } catch (e) {}
    }
    return id;
  }

  // Generate a random ID
  function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Styles for the modal
  var styles = {
    overlay: {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: '0',
      transition: 'opacity 0.3s ease',
    },
    modal: {
      position: 'relative',
      width: '90%',
      maxWidth: '900px',
      height: '85%',
      maxHeight: '700px',
      backgroundColor: '#1a1a2e',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      transform: 'scale(0.9)',
      transition: 'transform 0.3s ease',
    },
    closeButton: {
      position: 'absolute',
      top: '12px',
      right: '12px',
      width: '36px',
      height: '36px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: 'none',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '10',
      transition: 'background-color 0.2s ease',
    },
    closeIcon: {
      width: '20px',
      height: '20px',
      stroke: 'white',
      strokeWidth: '2',
    },
    iframe: {
      width: '100%',
      height: '100%',
      border: 'none',
    },
    loading: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: 'white',
      fontSize: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }
  };

  // Apply styles to an element
  function applyStyles(element, styleObj) {
    for (var key in styleObj) {
      if (styleObj.hasOwnProperty(key)) {
        element.style[key] = styleObj[key];
      }
    }
  }

  // Create the modal
  function createModal() {
    if (modal) return;

    // Create overlay
    modal = document.createElement('div');
    modal.id = 'domo-modal-overlay';
    applyStyles(modal, styles.overlay);

    // Create modal container
    var modalContent = document.createElement('div');
    modalContent.id = 'domo-modal-content';
    applyStyles(modalContent, styles.modal);

    // Create close button
    var closeButton = document.createElement('button');
    closeButton.id = 'domo-modal-close';
    closeButton.setAttribute('aria-label', 'Close demo');
    applyStyles(closeButton, styles.closeButton);
    closeButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" style="width:20px;height:20px;"><path d="M6 18L18 6M6 6l12 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    closeButton.onmouseover = function() {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    };
    closeButton.onmouseout = function() {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    };
    closeButton.onclick = function(e) {
      e.stopPropagation();
      Domo.close();
    };

    // Create loading indicator
    var loading = document.createElement('div');
    loading.id = 'domo-modal-loading';
    applyStyles(loading, styles.loading);
    loading.textContent = 'Loading demo...';

    // Create iframe
    iframe = document.createElement('iframe');
    iframe.id = 'domo-modal-iframe';
    applyStyles(iframe, styles.iframe);
    iframe.setAttribute('allow', 'camera; microphone; autoplay');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.onload = function() {
      loading.style.display = 'none';
    };

    // Assemble modal
    modalContent.appendChild(closeButton);
    modalContent.appendChild(loading);
    modalContent.appendChild(iframe);
    modal.appendChild(modalContent);

    // Close on overlay click
    modal.onclick = function(e) {
      if (e.target === modal) {
        Domo.close();
      }
    };

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        Domo.close();
      }
    });

    document.body.appendChild(modal);
  }

  // Open the demo modal
  Domo.open = function(token, options) {
    options = options || {};

    if (!token) {
      console.error('[Domo] Token is required. Usage: Domo.open("your-embed-token")');
      return;
    }

    currentToken = token;
    createModal();

    // Build URL
    var url = (options.baseUrl || BASE_URL) + '/embed/' + token;

    // Set iframe source
    iframe.src = url;
    document.getElementById('domo-modal-loading').style.display = 'block';

    // Show modal with animation
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Trigger animation
    requestAnimationFrame(function() {
      modal.style.opacity = '1';
      document.getElementById('domo-modal-content').style.transform = 'scale(1)';
    });

    isOpen = true;

    // Track popup opened
    trackEvent('Embed Popup Opened', {
      embedToken: token,
    });

    // Callback
    if (typeof options.onOpen === 'function') {
      options.onOpen();
    }
  };

  // Close the demo modal
  Domo.close = function(options) {
    options = options || {};

    if (!modal || !isOpen) return;

    // Track popup closed
    trackEvent('Embed Popup Closed', {
      embedToken: currentToken,
    });

    // Animate out
    modal.style.opacity = '0';
    document.getElementById('domo-modal-content').style.transform = 'scale(0.9)';

    setTimeout(function() {
      modal.style.display = 'none';
      iframe.src = 'about:blank';
      document.body.style.overflow = '';
      isOpen = false;
      currentToken = null;

      // Callback
      if (typeof options.onClose === 'function') {
        options.onClose();
      }
    }, 300);
  };

  // Check if modal is open
  Domo.isOpen = function() {
    return isOpen;
  };

  // Set base URL (for self-hosted deployments)
  Domo.setBaseUrl = function(url) {
    BASE_URL = url;
  };

  // Auto-initialize from script tag data attributes
  (function autoInit() {
    var scripts = document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var script = scripts[i];
      if (script.src && script.src.indexOf('embed.js') !== -1) {
        // Check for data-base-url attribute
        var baseUrl = script.getAttribute('data-base-url');
        if (baseUrl) {
          BASE_URL = baseUrl;
        }

        // Check for data-token attribute (auto-open)
        var token = script.getAttribute('data-token');
        var autoOpen = script.getAttribute('data-auto-open');
        if (token && autoOpen === 'true') {
          // Wait for DOM ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
              Domo.open(token);
            });
          } else {
            Domo.open(token);
          }
        }
        break;
      }
    }
  })();

  // Expose to window
  window.Domo = Domo;
})();
