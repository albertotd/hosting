!(function(global) {

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

  var messageHandler = function(env, elements) {
    elements.load.style.display = "block";
    var errorTimeout = setTimeout(function() {
      elements.error.style.display = "block";
      elements.load.style.display = "none";
      parent.postMessage({action: "prompt"}, "*");
    }, 10000);
    return function(event) {
      clearTimeout(errorTimeout);
      elements.error.style.display = "none";
      elements.load.style.display = "none";      
      if (env.cti.startsWith(event.origin)) {
        console.log("[cti.js] <<< event received from CTI:", event && event.data && event.data.action, event);        
        switch (event.data.action) {
          case "getExternalId":
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
            elements.minimize.style.display = "none";
            sendEventToUI({action: "prompt"});
            break;
          case "hide":
            elements.agent.style.display = "none";
            elements.cti.style.display = "none";
            elements.minimize.style.display = "block";
            sendEventToUI({action: "ready"});
            break;
        }
      } else if (event.source === parent.window && event.data.action === "clickToCall") {
        sendEventToCti(elements.cti, event.data);
        sendEventToUI({action: "contact", data: event.data});
      }
    };
  };

  var buttonHandler = function(elements) {
    return function() {
      if (elements.input.innerHTML) {
        elements.agent.style.display = "none";
        elements.minimize.style.display = "none";
        elements.cti.style.display = "block";
      }
    }
  };

  var minimizeHandler = function() {
    parent.postMessage({action: "toggle"}, "*");
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
      load: document.getElementById("load"),
      error: document.getElementById("error")
    };
    
    window.addEventListener("message", messageHandler(env, elements));
    document.getElementById("button").onclick = buttonHandler(elements);
    if (params.aid) {
      elements.input.innerHTML = params.aid;
    }

    elements.cti.srcdoc = redirect(env.cti + params.int);
    elements.phone.className = params.acc ? "conversations" : "callbar";
    elements.minimize.className = params.acc ? "minimize-button-conversations" : "minimize-button-callbar"
    elements.phone.srcdoc = redirect(params.acc ? env.conversations.replace("{account}", params.acc) : env.callbar);
    elements.minimize.onclick = minimizeHandler;
    
    document.featurePolicy && 
    document.featurePolicy.allowedFeatures().indexOf("microphone") === -1 && 
    console.warn("[cti.js] no access to microphone from parent window");

    !params.int && console.warn("[cti.js] no integration name provided: contact and data events will not be available");
  };

  init(config);
}(this));