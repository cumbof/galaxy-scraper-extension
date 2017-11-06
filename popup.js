// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This extension demonstrates using chrome.downloads.download() to
// download URLs.

var allLinks = [];
var visibleLinks = [];

// Display all visible links.
function showLinks() {
  var linksTable = document.getElementById('links');
  while (linksTable.children.length > 1) {
    linksTable.removeChild(linksTable.children[linksTable.children.length - 1])
  }
  for (var i = 0; i < visibleLinks.length; ++i) {
    var row = document.createElement('tr');
    var col0 = document.createElement('td');
    var col1 = document.createElement('td');
    var checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'check' + i;
    col0.appendChild(checkbox);
    col1.innerText = visibleLinks[i];
    col1.style.whiteSpace = 'nowrap';
    col1.onclick = function() {
      checkbox.checked = !checkbox.checked;
    }
    row.appendChild(col0);
    row.appendChild(col1);
    linksTable.appendChild(row);
  }
}

// Toggle the checked state of all visible links.
function toggleAll() {
  var checked = document.getElementById('toggle_all').checked;
  for (var i = 0; i < visibleLinks.length; ++i) {
    document.getElementById('check' + i).checked = checked;
  }
}

function countSelectedLinks(visibleLinks) {
  var count = 0;
  for (var i = 0; i < visibleLinks.length; ++i) {
    if (document.getElementById('check' + i).checked) {
      count++;
    }
  }
  return count;
}

// Send selected data to Galaxy.
function sendToGalaxy() {
  var galaxy_url = document.getElementById('galaxy').value;
  var galaxy_user = document.getElementById('user').value;
  var galaxy_pass = document.getElementById('password').value;

  if (countSelectedLinks(visibleLinks) > 0) {
    // retrieve api key
    var api_key = retrieveApiKey(galaxy_url, galaxy_user, galaxy_pass);
    console.log("api_key: "+api_key);
    if (api_key !== undefined) {
      // get current history id
      var history_id = getCurrentHistoryId(galaxy_url);
      console.log("history_id: "+history_id);
      if (history_id !== undefined) {
        for (var i = 0; i < visibleLinks.length; ++i) {
          if (document.getElementById('check' + i).checked) {
            // send data to galaxy
            var file_url = visibleLinks[i];
            console.log("file_url: "+file_url);
            var file_name = file_url.split("/").pop();
            var file_type = "auto";
            var dbkey = "?";
            uploadData(galaxy_url, api_key, history_id, file_name, file_url, file_type, dbkey);
          }
        }
      }
      else console.log("Unable to retrieve the current history id.");
    }
    else console.log("Unable to retrieve api key.");
  }
  else console.log("Select at least one link.");
  
  window.close();
}

function getCurrentHistoryId(galaxy_url) {
  var path = "api/histories/most_recently_used";
  if (!galaxy_url.endsWith("/"))
    path = "/"+path;
  var upload_url = galaxy_url+path;

  $.ajax({
    url: upload_url,
    type: 'get',
    dataType: 'json',
    contentType: 'application/json',
    success: function( data, textStatus, jQxhr ){
      return data["id"];
    },
    error: function( jqXhr, textStatus, errorThrown ){
      return undefined;
    }
  });
}

function uploadData(galaxy_url, api_key, history_id, file_name, file_url, file_type, dbkey) {
  var path = "api/tools";
  if (!galaxy_url.endsWith("/"))
    path = "/"+path;
  var upload_url = galaxy_url+path;
  
  $.ajax({
    url: upload_url,
    type: 'post',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify( { "key": api_key, "tool_id": "upload1", "history_id": history_id } ),
    files: JSON.stringify( { "files_0|NAME": file_name, "files_0|type": "upload_dataset", "files_0|file_url": file_url, "dbkey": dbkey, "file_type": file_type, "ajax_upload": "true" } ),
    success: function( data, textStatus, jQxhr ){
      return data;
    },
    error: function( jqXhr, textStatus, errorThrown ){
      return undefined;
    }
  });
}

function retrieveApiKey(galaxy_url, galaxy_user, galaxy_pass) {
  var path = "api/authenticate/baseauth";
  if (!galaxy_url.endsWith("/"))
    path = "/"+path;
  var auth_url = galaxy_url+path;

  $.ajax({
    url: auth_url,
    type: 'post',
    dataType: 'json',
    contentType: 'application/json',
    data: JSON.stringify( { "user": galaxy_user, "password": galaxy_pass } ),
    success: function( data, textStatus, jQxhr ){
      return data['api_key'];
    },
    error: function( jqXhr, textStatus, errorThrown ){
      return undefined;
    }
  });
}

// Re-filter allLinks into visibleLinks and reshow visibleLinks.
function filterLinks() {
  var filterValue = document.getElementById('filter').value;
  if (document.getElementById('regex').checked) {
    visibleLinks = allLinks.filter(function(link) {
      return link.match(filterValue);
    });
  } else {
    var terms = filterValue.split(' ');
    visibleLinks = allLinks.filter(function(link) {
      for (var termI = 0; termI < terms.length; ++termI) {
        var term = terms[termI];
        if (term.length != 0) {
          var expected = (term[0] != '-');
          if (!expected) {
            term = term.substr(1);
            if (term.length == 0) {
              continue;
            }
          }
          var found = (-1 !== link.indexOf(term));
          if (found != expected) {
            return false;
          }
        }
      }
      return true;
    });
  }
  showLinks();
}

// Add links to allLinks and visibleLinks, sort and show them.  send_links.js is
// injected into all frames of the active tab, so this listener may be called
// multiple times.
chrome.extension.onRequest.addListener(function(links) {
  for (var index in links) {
    allLinks.push(links[index]);
  }
  allLinks.sort();
  visibleLinks = allLinks;
  showLinks();
});

// Set up event handlers and inject send_links.js into all frames in the active
// tab.
window.onload = function() {
  document.getElementById('filter').onkeyup = filterLinks;
  document.getElementById('regex').onchange = filterLinks;
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('send0').onclick = sendToGalaxy;
  document.getElementById('send1').onclick = sendToGalaxy;

  chrome.windows.getCurrent(function (currentWindow) {
    chrome.tabs.query({active: true, windowId: currentWindow.id}, function(activeTabs) {
      chrome.tabs.executeScript(activeTabs[0].id, {file: 'send_links.js', allFrames: true});
    });
  });
};
