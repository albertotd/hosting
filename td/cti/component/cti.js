!(function(global) {

  var ERROR_TIMEOUT = 10000;

  var config = {
    "stg": {
      "cti": "https://cti-client.talkdeskstg.com?use_generic=true&integration=",
      "callbar": "https://callbar.meza.talkdeskstg.com/",
      "conversations": "https://{account}.gettalkdesk.com/atlas/apps/conversation"
    },
    "qa": {
      "cti": "https://cti-client.talkdeskqa.com?use_generic=true&integration=",
      "callbar": "https://callbar.meza.talkdeskqa.com/",
      "conversations": "https://{account}.trytalkdesk.com/atlas/apps/conversation"
    },
    "prd": {
      "cti": "https://cti-client.talkdeskapp.com?use_generic=true&integration=",
      "callbar": "https://callbar.talkdeskapp.com/",
      "conversations": "https://{account}.mytalkdesk.com/atlas/apps/conversation"
    }
  };

  var redirect = function(url) {
    return "<!DOCTYPE html><html><head><meta http-equiv='refresh' content='0; url=" + url + "'></head><body></body></html>";
  };

  var sendEventToCti = function(cti, eventData) {
    console.log("[cti.js] >>> event sent to CTI:", eventData && eventData.action, eventData);        
    cti.contentWindow.postMessage(eventData, '*');
  }

  var sendEventToUI = function(eventData) {
    console.log("[cti.js] >>> event sent to UI:", eventData && eventData.action, eventData);        
    parent.postMessage(eventData, '*');
  }
  
  var setError = function(elements) {
    return setTimeout(function() {
      elements.error.style.display = "block";
      sendEventToUI({action: "prompt"});
    }, ERROR_TIMEOUT);
  };

  var clearError = function(elements, errorTimeout) {
    clearTimeout(errorTimeout);
    elements.error.style.display = "none";
  }

  var messageHandler = function(env, elements) {
    var errorTimeout = setError(elements);
    return function(event) {
      if (env.cti.startsWith(event.origin)) {
        clearError(elements, errorTimeout);
        console.log("[cti.js] <<< event received from CTI:", event && event.data && event.data.action, event);        
        switch (event.data.action) {
          case "getExternalId":
            elements.phone.srcdoc = redirect(elements.phoneSrc);
            sendEventToCti(elements.cti, {action: 'getExternalId_response', response: elements.input.innerHTML});
            break;
          case "openContact":
            sendEventToUI({action: "contact", data: event.data.data});
            break;            
          case "sendData":
            sendEventToUI({action: "data", data: event.data.data});
            break;
          case "show":
            elements.agent.style.display = input.innerHTML ? "none" : "block";
            elements.cti.style.display = input.innerHTML ? "block" : "none";
            sendEventToUI({action: "prompt"});
            break;
          case "hide":
            elements.agent.style.display = "none";
            elements.cti.style.display = "none";
            sendEventToUI({action: "ready"});
            break;
        }
      } else if (event.source === parent.window && event.data.action === "clickToCall") {
        sendEventToCti(elements.cti, event.data);
        sendEventToUI({action: "contact", data: event.data});
      }
    };
  };

  var setAgentButtonHandler = function(elements) {
    return function() {
      if (elements.input.innerHTML) {
        elements.agent.style.display = "none";
        elements.cti.style.display = "block";
      }
    }
  };

  var setAgentEnterKey = function(handler) {
    return function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        handler();
        return false;
      }    
    }
  };

  var minimizeHandler = function() {
    sendEventToUI({action: "toggle"});
  }

  var init = function(config) {
    var urlSearchParams = new URLSearchParams(window.location.search);
    var params = Object.fromEntries(urlSearchParams.entries());
    var env = config[params.env] || config.prd;

    var elements = {
      cti: document.getElementById("cti"),
      minimize: document.getElementById("minimize-button"),
      phone: document.getElementById("phone"),
      agent: document.getElementById("agent"),
      input: document.getElementById("input"),
      error: document.getElementById("error"),
      phoneSrc: params.acc ? env.conversations.replace("{account}", params.acc) : env.callbar
    };
    
    var setAgentButton = document.getElementById("button");
    setAgentButton.onclick = setAgentButtonHandler(elements);
    elements.input.onkeydown = setAgentEnterKey(setAgentButton.onclick);
    if (params.aid) {
      elements.input.innerHTML = params.aid;
    }

    elements.phone.className = params.acc ? "conversations" : "callbar";
    elements.minimize.className = params.acc ? "minimize-button-conversations" : "minimize-button-callbar"
    elements.minimize.onclick = minimizeHandler;

    window.addEventListener("message", messageHandler(env, elements));    
    elements.cti.srcdoc = redirect(env.cti + params.int);
    
    document.featurePolicy && 
    document.featurePolicy.allowedFeatures().indexOf("microphone") === -1 && 
    console.warn("[cti.js] no access to microphone from parent window");

    !params.int && console.warn("[cti.js] no integration name provided: contact and data events will not be available");
  };

  init(config);
}(this));