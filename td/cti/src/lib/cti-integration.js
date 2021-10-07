!(function(global) {
  var CTI_ID = "talkdesk-cti";
  var CTI_URL = document.currentScript.src + "/../../component/cti.html";

  var readyState = false;

  var messageHandler = function(eventHandler, iframe) {
    return function(event) {
      console.log("CTI integration - event received:", event && event.data && event.data.action, event);
      if (event.source === iframe.contentWindow && event && event.data) {
        readyState = event.data.action === 'ready' || (event.data.action === 'show' ? false : readyState);
        eventHandler(event.data.action, event.data.data);
      }
    };
  };

  var clickToCallHandler = function(ctiIframe, eventHandler) {
    return function(to, from, contactId) {
      !readyState ? eventHandler('show') :
        ctiIframe.contentWindow.postMessage({action: 'clickToCall', number: to, externalId: contactId, outbound_caller_id: from}, '*');
    };
  }

  global.CTI = global.CTI || {
    ID: CTI_ID,
    start: function(eventHandler, containerSelector, env, agentId, ctiUrl) {
      var container = document.querySelector(containerSelector);
      var iframe = document.createElement('iframe');
      iframe.src = (ctiUrl || CTI_URL) + "?aid=" + (agentId || "") + "&env=" + (env || "");
      iframe.id = CTI_ID;
      iframe.allow = "microphone";
      Object.assign(iframe.style, {border: "0px", overflow: "hidden", height: "100%", width: "100%"});
      if (container && !document.getElementById(CTI_ID)) {
        window.addEventListener('message', messageHandler(eventHandler, iframe));      
        container.appendChild(iframe);
      }
      this.clickToCall = clickToCallHandler(iframe, eventHandler);
    },
    clickToCall: function(to, from, contactId) {}
  };
}(this));