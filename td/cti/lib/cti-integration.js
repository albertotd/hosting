!(function(global) {
  var CTI_ID = "talkdesk-cti";
  var HEIGHT_MAX = "480px";
  var HEIGHT_MIN_CALLBAR = "40px";
  var HEIGHT_MIN_CONVERSATIONS = "29px";  
  var CTI_URL = document.currentScript.src + "/../../component/cti.html";
  var RETRIES = 5;

  var readyState = false;

  var messageHandler = function(eventHandler, iframe) {
    return function(event) {
      if (event.source === iframe.contentWindow && event && event.data) {
        readyState = event.data.action === 'ready' || (event.data.action === 'prompt' ? false : readyState);
        eventHandler(event.data.action, event.data.data);
      }
    };
  };

  var clickToCallHandler = function(ctiIframe, eventHandler) {
    return function(to, from, contactId) {
      !readyState ? eventHandler('prompt') : to && ctiIframe.contentWindow.postMessage(
        {action: 'clickToCall', number: '+' + to.replace(/\D/g,''), externalId: contactId, outbound_caller_id: from}, '*');
    };
  }

  var getEventHandler = function(eventHandler) {
    eventHandler = eventHandler || function() {};
    if (typeof eventHandler === 'string') {
      var functionPath = eventHandler.split('.');      
      eventHandler = window;
      for(var i = 0; i < functionPath.length; i++) {
        if (eventHandler[functionPath[i]]) {
          eventHandler = eventHandler[functionPath[i]];
        } else {
          return false;
        }
      }
    }
    return eventHandler;
  }

  global.CTI = global.CTI || {
    id: CTI_ID,
    maxHeight: HEIGHT_MAX,
    minHeight: HEIGHT_MIN_CALLBAR,
    start: function(eventHandler, containerSelector, env, agentId, integration, account) {
      var container = document.querySelector(containerSelector);      
      eventHandler = getEventHandler(eventHandler);       
      if (container && eventHandler !== false) {
        var iframe = document.createElement('iframe');
        iframe.src = CTI_URL + 
                     "?aid=" + (encodeURIComponent(agentId) || "") + 
                     "&env=" + (encodeURIComponent(env) || "") + 
                     "&int=" + (encodeURIComponent(integration) || "") + 
                     "&acc=" + (encodeURIComponent(account) || "");
        iframe.id = CTI_ID;
        iframe.allow = "microphone";
        Object.assign(iframe.style, {border: "0px", overflow: "hidden", height: "100%", width: "100%"});
        container.appendChild(iframe);        

        window.addEventListener('message', messageHandler(eventHandler, iframe));        
        this.clickToCall = clickToCallHandler(iframe, eventHandler);
        this.start = function() { return true; };
        this.minHeight = account ? HEIGHT_MIN_CONVERSATIONS : HEIGHT_MIN_CALLBAR;
        console.log("[cti-integration.js] CTI started with:", eventHandler.name, "event handler,", containerSelector, "container,", env, "env,", agentId, "agent ID,", integration, "integration,", account, "account");
        return true;
      }
      return false;
    },
    clickToCall: function() {}
  };

  var startWithRetries = function(retry, handler, container, env, aid, int, acc) {
    return function() {
      if (retry === 0) {
        console.error("[cti-integration.js] container", container, "or event handler", handler, "not found");            
      } else if (!CTI.start(handler, container, env, aid, int)) {
        setTimeout(startWithRetries(--retry, handler, container, env, aid, int, acc), 1000);
      }
    }
  };

  var init = function() {
    var container = document.currentScript.getAttribute('container');
    if (!container) { return; }
    var handler = document.currentScript.getAttribute('handler');
    var env = document.currentScript.getAttribute('env');
    var aid = document.currentScript.getAttribute('aid');
    var acc = document.currentScript.getAttribute('acc');
    var int = document.currentScript.getAttribute('int');
    setTimeout(startWithRetries(RETRIES, handler, container, env, aid, int, acc), 0);    
  };

  init();  
}(this));