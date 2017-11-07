// Send selected data to Galaxy.
function sendToGalaxy(galaxy_url, galaxy_user, galaxy_pass, checkedLinks) {
    // start by retrieving the api key for the selected user
    // then retrieve the current history id
    // finally send links to the upload tool
    retrieveApiKey(galaxy_url, galaxy_user, galaxy_pass, checkedLinks);
}

function retrieveApiKey(galaxy_url, galaxy_user, galaxy_pass, checkedLinks) {
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
            getCurrentHistoryId(galaxy_url, api_key, checkedLinks);
            //return data['api_key'];
        },
        error: function( jqXhr, textStatus, errorThrown ){
            return undefined;
        }
    });
}

function getCurrentHistoryId(galaxy_url, api_key, checkedLinks) {
    var path = "api/histories/most_recently_used";
    if (!galaxy_url.endsWith("/"))
        path = "/"+path;
    var upload_url = galaxy_url+path;

    $.ajax({
        url: upload_url,
        type: 'get',
        //async: false,
        dataType: 'json',
        contentType: 'application/json',
        success: function( data, textStatus, jQxhr ){
            console.log(data);
            console.log("history_id: "+data["id"]);
            var history_id = data["id"];
            //return data["id"];
            for (var i = 0; i < checkedLinks.length; ++i) {
                //if (document.getElementById('check' + i).checked) {
                    // send data to galaxy
                    var file_url = checkedLinks[i];
                    console.log("file_url: "+file_url);
                    var file_name = file_url.split("/").pop();
                    var file_type = "auto";
                    var dbkey = "?";
                    uploadData(galaxy_url, api_key, history_id, file_name, file_url, file_type, dbkey);
                //}
            }
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
        data: JSON.stringify( 
            { 
                "key": api_key, 
                "tool_id": "upload1", 
                "history_id": history_id, 
                "inputs": {
                    "files_0|NAME": file_name, 
                    "files_0|type": file_type, 
                    "files_0|url_paste": file_url, 
                    "dbkey": dbkey, 
                    "file_type": file_type
                } 
            } 
        ),
        success: function( data, textStatus, jQxhr ){
            return data;
        },
        error: function( jqXhr, textStatus, errorThrown ){
            return undefined;
        }
    });
}