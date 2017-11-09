// https://docs.galaxyproject.org/en/master/api/api.html
// http://bioblend.readthedocs.io/en/latest/api_docs/galaxy/all.html

/************************************************************************************/
/** Observer Pattern */
/************************************************************************************/
var _GALAXY_URL_ = undefined;
var _API_KEY_ = undefined;
var _HISTORY_ID_ = undefined;
var _COLLECTION_NAME_ = undefined;
var _MAP_SIZE_ = undefined;

var ObservableMap = function() {
    this.map = {};
}
ObservableMap.prototype.put = function( key, value ) {
    this.map[key] = value;
    //console.log("ObservableMap size: "+Object.keys(this.map).length);
    if (Object.keys(this.map).length === _MAP_SIZE_) {
        if (_COLLECTION_NAME_ !== undefined)
            createCollection(_GALAXY_URL_, _HISTORY_ID_, _COLLECTION_NAME_, this.map);
    }
}
ObservableMap.prototype.setSize = function( size ) {
    _MAP_SIZE_ = size;
}

var file_ids = new ObservableMap();
/************************************************************************************/

function autofill() {
   var popups = chrome.extension.getViews({type: "popup"});
   console.log(popups);
   if (popups.length > 0) {
       popups[0].autofill(_GALAXY_URL_, _API_KEY_);
   }
}

function resetGlobalVariables() {
    _GALAXY_URL_ = undefined;
    _API_KEY_ = undefined;
    _HISTORY_ID_ = undefined;
    _COLLECTION_NAME_ = undefined;
    _MAP_SIZE_ = undefined;
    file_ids = new ObservableMap();
}

// Send selected data to Galaxy.
//function sendToGalaxy(galaxy_url, galaxy_user, galaxy_pass, checkedLinks, collection_name) {
function sendToGalaxy(galaxy_url, api_key, checkedLinks, collection_name) {
    resetGlobalVariables();

    _GALAXY_URL_ = galaxy_url;
    _API_KEY_ = api_key;
    _COLLECTION_NAME_ = collection_name;
    // TO-DO remove invalid links in checkedLinks
    file_ids.setSize(checkedLinks.length);
    // start by retrieving the api key for the selected user
    // then retrieve the current history id
    // finally send links to the upload tool
    //retrieveApiKey(galaxy_url, galaxy_user, galaxy_pass, checkedLinks, collection_name);
    getCurrentHistoryId(galaxy_url, api_key, checkedLinks, collection_name);
}

/*function retrieveApiKey(galaxy_url, galaxy_user, galaxy_pass, checkedLinks, collection_name) {
    var path = "api/authenticate/baseauth";
    if (!galaxy_url.endsWith("/"))
        path = "/"+path;
    var auth_url = galaxy_url+path;

    $.ajax({
        url: auth_url,
        contentType: 'application/json',
        headers: {
            "Authorization": "Basic " + btoa(galaxy_user + ":" + galaxy_pass)
        },
        success: function( data, textStatus, jQxhr ){
            var api_key = data["api_key"];
            console.log("api_key: "+api_key);
            getCurrentHistoryId(galaxy_url, api_key, checkedLinks, collection_name);
            //return data['api_key'];
        },
        error: function( jqXhr, textStatus, errorThrown ){
            return undefined;
        }
    });
}*/

function getCurrentHistoryId(galaxy_url, api_key, checkedLinks, collection_name) {
    var path = "api/histories/most_recently_used";
    if (!galaxy_url.endsWith("/"))
        path = "/"+path;
    var history_url = galaxy_url+path;

    $.ajax({
        url: history_url,
        type: 'get',
        //async: false,
        dataType: 'json',
        contentType: 'application/json',
        success: function( data, textStatus, jQxhr ){
            console.log(data);
            console.log("history_id: "+data["id"]);
            var history_id = data["id"];
            _HISTORY_ID_ = history_id;
            uploadData(galaxy_url, api_key, history_id, checkedLinks);
        },
        error: function( jqXhr, textStatus, errorThrown ){
            return undefined;
        }
    });
}

//function uploadData(galaxy_url, api_key, history_id, file_name, file_url, file_type, dbkey) {
function uploadData(galaxy_url, api_key, history_id, checkedLinks) {
    var path = "api/tools";
    if (!galaxy_url.endsWith("/"))
        path = "/"+path;
    var upload_url = galaxy_url+path;

    var file_type = "auto";
    var dbkey = "?";

    var files_0_names = "";
    var files_0_type = "";
    var files_0_url_paste = "";
    for (var i=0; i<checkedLinks.length; i++) {
        // send data to galaxy
        var file_url = checkedLinks[i];
        console.log("file_url: "+file_url);
        files_0_url_paste += "\n" + file_url;
    }

    $.ajax({
        url: upload_url,
        type: 'post',
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify( 
            { 
                "key": api_key, 
                "tool_id": "upload1", 
                "history_id": history_id, 
                "inputs": {
                    "files_0|url_paste": files_0_url_paste, 
                    "dbkey": dbkey, 
                    "file_type": file_type
                } 
            } 
        ),
        success: function( data, textStatus, jQxhr ){
            console.log(data);
            //return data;
            var outputs_arr = data["outputs"];
            for (var i=0; i<outputs_arr.length; i++) {
                var file_id = outputs_arr[i]["id"];
                var file_name = outputs_arr[i]["name"];
                //file_ids[file_id] = file_name;
                console.log("id: "+file_id+" - name: "+file_name);
                file_ids.put(file_id, file_name);
                //console.log("file_ids:"+Object.keys(file_ids).length);
            }
        },
        error: function( jqXhr, textStatus, errorThrown ){
            return undefined;
        }
    });
}

function createCollection(galaxy_url, history_id, collection_name, file_ids) {
    var path = "api/histories/"+history_id+"/contents";
    if (!galaxy_url.endsWith("/"))
        path = "/"+path;
    var collection_url = galaxy_url+path;

    if (Object.keys(file_ids).length > 0) {
        element_identifiers = [];
        for (var key in file_ids) {
            element = {};
            element["id"] = key;
            element["name"] = file_ids[key];
            element["src"] = "hda";
            element_identifiers.push(element);
        }

        $.ajax({
            url: collection_url,
            type: 'post',
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(
                {
                    "type": "dataset_collection",
                    "collection_type": "list",
                    "name": collection_name,
                    "element_identifiers": element_identifiers,
                    "hide_source_items": true
                }
            ),
            success: function( data, textStatus, jQxhr ){
                console.log(data);
                // TO-DO: hide datasets outside the collection
                return data;
            },
            error: function( jqXhr, textStatus, errorThrown ){
                //console.log(textStatus);
                //console.log(errorThrown);
                return undefined;
            }
        });
    }
}
