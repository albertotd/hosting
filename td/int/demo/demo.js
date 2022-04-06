!(function(global) {

  var CTI_CONTAINER = "#cticontainer";
  var ANIMATION = "bounce";

  var createContact = function(tel) {
    return isNaN(tel) ? "" : "<div><div>👤 <a href=\"javascript:CTI.clickToCall('+" + tel + "')\" title='Click to call'>+" + tel + "</a><span id='" + tel + "' class='call-status'><span></div></div>";
  };

  var addContact = function(tel) {
    if (!tel) return {};
    if (tel.split(" ").length === 2) tel = tel.split(" ")[0];
    tel = +(tel.replace(/\D/g,''));
    var contact = document.getElementById(tel);
    if (!contact) {
      document.getElementById("contacts").innerHTML += createContact(tel);
    }
    return contact || document.getElementById(tel);
  }

  var animate = function(animation, elem, timeout) {
    elem && elem.classList.add(animation);
    elem && timeout && setTimeout(function() {elem.classList.remove(animation)}, timeout);
  }

  var callingContact = function(tel) {
    clearCalls();
    addContact(tel).innerHTML = ": being called...";
  }

  var contactCalling = function(tel) {
    clearCalls();
    addContact(tel).innerHTML = ": is calling...";
  }

  var contactCallEnd = function(tel) {
    addContact(tel).innerHTML = ": call ended.";
  }

  var clearCalls = function() {
    var callStatuses = document.getElementsByClassName('call-status');
    for (var i=0; i < callStatuses.length; i++) {
        callStatuses[i].innerHTML = "";
    }
  }

  var getTextWidth = function(text) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = 'italic 10px sans-serif';
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width) + 5;
  };

  var getBackgroundImage = function(text) {
    return "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' version='1.1' height='14px' width='" + getTextWidth(text) + "px'><text x='1' y='10' fill='lightgray' font-style='italic' font-size='10' font-family='sans-serif'>" + text + "</text></svg>\")";
  };

  var toggle = function(ctiContainer, minimize) {
    ctiContainer.minimized = minimize === undefined ? !ctiContainer.minimized : minimize;
    ctiContainer.style.height = ctiContainer.minimized ? CTI.minHeight : CTI.maxHeight;
  };

  var isMinimized = function(ctiContainer) { return ctiContainer.minimized; }

  var ctiEventHandler = function(event, data) {
    var ctiContainer = document.querySelector(CTI_CONTAINER);
    switch (event) {
      case "prompt":
        animate(ANIMATION, ctiContainer, 3000);
        toggle(ctiContainer, false);
        break;
      case "toggle":
        toggle(ctiContainer);
        break;        
      case "contact":
        isMinimized(ctiContainer) && animate(ANIMATION, ctiContainer, 3000);
        if (data.externalId) contactCalling(data.externalId);
        else callingContact(data.number);
        break;
      case "data":
        data.action === 'endcall' && contactCallEnd(data.number);
        break;  
    }
  };

  var init = function() {
    var urlSearchParams = new URLSearchParams(window.location.search);
    var params = Object.fromEntries(urlSearchParams.entries());

    if (params.site) {
      document.title = params.site;
      document.body.style.backgroundImage = getBackgroundImage(params.site);
    }

    var tels = params.tels && params.tels.split(",") || [];
    for(var i=0; i<tels.length; i++) {
      addContact(tels[i]);
    }

    CTI.start(ctiEventHandler, CTI_CONTAINER, params.env, params.aid, params.int, params.acc);
  };

  init();
}(this));