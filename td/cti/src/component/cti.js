!(function(global) {

  var config = {
    "stg": {
      "cti": "https://cti-client.talkdeskstg.com?integration=genericcti&use_generic=true",
      "callbar": "https://callbar.meza.talkdeskstg.com/"
    },
    "qa": {
      "cti": "https://cti-client.talkdeskqa.com?integration=genericcti&use_generic=true",
      "callbar": "https://callbar.meza.talkdeskqa.com/"
    },
    "prd": {
      "cti": "https://cti-client.talkdeskapp.com?integration=genericcti&use_generic=true",
      "callbar": "https://callbar.talkdeskapp.com/"
    }
  };

  var redirect = function(url) {
    return "<!DOCTYPE html><html><head><meta http-equiv='refresh' content='0; url=" + url + "'></head><body></body></html>";
  };

  var messageHandler = function(env, elements) {
    return function(event) {
      console.log("CTI - event received:", event && event.data && event.data.action, event);
      if (env.cti.startsWith(event.origin)) {
        switch (event.data.action) {
          case "getExternalId":
            elements.cti.contentWindow.postMessage({action: 'getExternalId_response', response: elements.input.innerHTML}, '*');
            break;
          case "openContact":
            parent.postMessage({action: "contact", data: event.data.data}, "*");
            break;            
          case "sendData":
            parent.postMessage({action: "data", data: event.data.data}, "*");
            break;
          case "show":
            elements.agent.style.display = input.innerHTML ? "none" : "block";
            elements.cti.style.display = input.innerHTML ? "block" : "none";
            elements.callbar.style.display = "none";
            elements.minimize.style.display = "none";
            parent.postMessage({action: "show"}, "*");
            break;
          case "hide":
            elements.agent.style.display = "none";
            elements.cti.style.display = "none";
            elements.callbar.style.display = "block";
            elements.minimize.style.display = "block";
            parent.postMessage({action: "ready"}, "*");
            break;
        }
      } else if (event.source === parent.window && event.data.action === "clickToCall") {
        cti.contentWindow.postMessage(event.data, '*');
        parent.postMessage({action: "contact", data: event.data}, "*");
      }
    };
  };

  var buttonHandler = function(elements) {
    return function() {
      if (elements.input.innerHTML) {
        elements.agent.style.display = "none";  
        elements.callbar.style.display = "none";
        elements.minimize.style.display = "none";
        elements.cti.style.display = "block";
      }
    }
  };

  var minimizeHandler = function() {
    this.status = !this.status;
    parent.postMessage({action: "minimize", data: this.status}, "*");
  }

  var init = function(config) {
    document.featurePolicy && 
    document.featurePolicy.allowedFeatures().indexOf("microphone") === -1 && 
    console.warn("CTI - no access to microphone from parent window");

    var urlSearchParams = new URLSearchParams(window.location.search);
    var params = Object.fromEntries(urlSearchParams.entries());
    var env = config[params.env] || config.prd;
    var elements = {
      cti: document.getElementById("cti"),
      minimize: document.getElementById("minimize"),
      callbar: document.getElementById("callbar"),
      agent: document.getElementById("agent"),
      input: document.getElementById("input")
    };
    
    window.addEventListener("message", messageHandler(env, elements));
    document.getElementById("button").onclick = buttonHandler(elements);
    if (params.aid) {
      elements.input.innerHTML = params.aid;
    } else {
      elements.agent.style.display = "block";
    }
    elements.cti.srcdoc = redirect(env.cti);
    elements.callbar.srcdoc = redirect(env.callbar);
    elements.minimize.onclick = minimizeHandler;
  };

  init(config);
}(this));