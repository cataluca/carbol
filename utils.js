var u = {};
try{
    var fs = require('fs');
    var _ = require('underscore');
    _.str = require('underscore.string');
    _.mixin(_.str.exports());
    var child_process = require('child_process');
    var http = require('http'); 
    var https = require('https'); 
    var qs = require('querystring');
    var lib_url = require('url');
    var lib_path = require('path');
    // var oauth = require('oauth');
    // var im = require('imagemagick');
    if (typeof module !== 'undefined' && module.exports) {
    	module.exports = u;
    } else {
    	root.u = u;
    }
}
catch(err){
}

RegExp.escape = function(str)
{
    var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
    return str.replace(specials, "\\$&");
};

var removeBegEndBlank = function(str){
    var re=/^ *(.*?) *$/;
    var result = re.exec(str);
    if(result && result.length>=1){
	return result[1];
    }
    else{
	return str;
    }    
};

var f_sync_calls = function(feach,fcont,fcont_err,timeout){
    var ntimes = 0;
    var err_found=false;
    var first_err = "";    
    var timeout_fired = false;
    var finished = false;
    var curr_timeout = null;

    if (timeout){
	curr_timeout = setTimeout(function(){
	    if(!finished){
		fcont_err(new Error("Timeout fired"));
		timeout_fired = true;
	    }
	},timeout);
    }

    var cont = function(){
	if(!timeout_fired){
	    ntimes--;
	    if (ntimes === 0){
		if (err_found){
		    fcont_err(first_err);
		}
		else{
		    fcont();
		}
		finished = true;
		if(curr_timeout){
		    clearTimeout(curr_timeout);
		}
	    }
	}
    };
    
    return function(obj,idx) {
	ntimes++;
	setTimeout(function(){
	    feach(obj,function(){	    
		cont();
	    },function(err){
		if (!err_found){
		    err_found = true;		    
		    first_err = err;
		}
		cont();
	    },idx);
	},1);
    };
};

var first = function(l){
    if(l && l.length > 0){
	return l[0];
    }
    else{
	return null;
    }
};

var last = function(l){
    if(l && l.length > 0){
	return l.slice(1);
    }
    else{
	return [];
    }
};

var last_elem = function(l,i){
    if(!i){
	i = 0;
    }
    if(l && l.length > i){
	return l[l.length-1-i];
    }
    else{
	return null;
    }
};

var serialize_each = function(l,f,f_end,f_end_err){    
    var idx = 0;
    var rec_f = function(ltmp){
	var elem = first(ltmp);
	
	if(elem || elem === 0 || elem === ""){
	    setTimeout(function(){
		f(elem,
		  function(){
		      idx++;
		      rec_f(last(ltmp));
		  },function(err){
		      idx++;
		      f_end_err(err);
		  },idx);
	    },1);
	}
	else{
	    f_end();
	}
    };
        
    if(l && l.length > 0){
	rec_f(l);
    }
    else{
	f_end();
    }
};

var serialize_each_fast = function(l,f,f_end,f_end_err){    
    var idx = 0;
    var rec_f = function(ltmp){
	var elem = first(ltmp);
	
	if(elem || elem === 0 || elem === ""){
	    f(elem,
	      function(){
		  idx++;
		  rec_f(last(ltmp));
	      },function(err){
		  idx++;
		  f_end_err(err);
	      },idx);
	}
	else{
	    f_end();
	}
    };
        
    if(l && l.length > 0){
	rec_f(l);
    }
    else{
	f_end();
    }
};
u.serialize_each_fast = serialize_each_fast;

// var test_serialize_each = function(){
//     var l = _.range(0,10000);
//     serialize_each(l,function(o,next,next_err){
// 	console.log(o);
// 	next();
//     },function(){
// 	console.log("end");
//     },f_err);
// };
// test_serialize_each();

var async_each = function(l,f,f_end,f_end_err){
    if(l && l.length > 0){
	_.each(l,f_sync_calls(f,f_end,f_end_err));	
    }
    else{
	f_end();
    }
};

var async_each_timeout = function(_i,f,f_end,f_end_err){
    var l = _i.l;
    var t = _i.t;
    if(l && l.length > 0){
	_.each(l,f_sync_calls(f,f_end,f_end_err,t));	
    }
    else{
	f_end();
    }
};

var test_async_each_timeout = function(){
    var l = _.range(0,10);
    async_each_timeout({l:l,t:100},function(o,next){
	setTimeout(function(){
	    console.log(o);
	    next();
	},2000);
    },function(){
	console.log("ok");
    },function(err){
	console.log(err);
    });
};

var split_list_nelem = function(l,nelem){
    var ll = [];
    _.each(l,function(o,idx){
	var npos = parseInt(idx/nelem);
	if(ll[npos]){
	    ll[npos].push(o);
	}
	else{
	    ll[npos] = [o];
	}
    });
    ll = _.filter(ll,function(l){
	return l.length > 0;
    });
    return ll;
};

var async_each_block = function(l,f,f_end,f_end_err,nblock){
    var ll = split_list_nelem(l,nblock);
    serialize_each(ll,function(l_block,next,next_err){
	async_each(l_block,f,next,next_err);
    },f_end,f_end_err);
};

var split_list_nelem_with_idx = function(l,nelem){
    var ll = [];
    _.each(l,function(o,idx){
	var npos = parseInt(idx/nelem);
	if(ll[npos]){
	    ll[npos].push({o:o,idx:idx});
	}
	else{
	    ll[npos] = [{o:o,idx:idx}];
	}
    });
    ll = _.filter(ll,function(l){
	return l.length > 0;
    });
    return ll;
};


var async_each_block_with_idx = function(l,f,f_end,f_end_err,nblock){
    var ll = split_list_nelem_with_idx(l,nblock);
    serialize_each(ll,function(l_block,next,next_err){
	async_each(l_block,f,next,next_err);
    },f_end,f_end_err);
};

var f_err = function(err){
    console.log(err);
};

var f_nop = function(){
};

var async_filter = function(l,f,cb,cb_err){
    var hidx = {};
    u.async_each(l,function(obj,next,next_err,idx){
	f(obj,function(res){
	    hidx[idx] = res;
	    next();
	},next_err);
    },function(){
	l = _.filter(l,function(obj,idx){
	    return hidx[idx];
	});
	cb(l);
    },cb_err);
};

var async_map = function(l,f,cb,cb_err){
    var hidx = {};
    u.async_each(l,function(obj,next,next_err,idx){
	f(obj,function(res){
	    hidx[idx] = res;
	    next();
	},next_err);
    },function(){
	l = _.map(l,function(obj,idx){
	    return hidx[idx];
	});
	cb(l);
    },cb_err);
};

var serialize_filter = function(l,f,cb,cb_err){
    var hidx = {};
    u.serialize_each(l,function(obj,next,next_err,idx){
	f(obj,function(res){
	    hidx[idx] = res;
	    next();
	},next_err);
    },function(){
	l = _.filter(l,function(obj,idx){
	    return hidx[idx];
	});
	cb(l);
    },cb_err);
};

var serialize_map = function(l,f,cb,cb_err){
    var hidx = {};
    u.serialize_each(l,function(obj,next,next_err,idx){
	f(obj,function(res){
	    hidx[idx] = res;
	    next();
	},next_err);
    },function(){
	l = _.map(l,function(obj,idx){
	    return hidx[idx];
	});
	cb(l);
    },cb_err);
};

var http_request_json_api = function(input,cb,cb_err){
    var path = input.path;
    var host = input.host;
    var method = input.method;

    var res_done = false;
    var client = http.request({
	port : 80,
	path : path,
	host: host,
	method : method
    },function(res){
	var res_data = "";
	res.on('data', function(data) {
    	    res_data+=data;
	});
	res.on("end",function(){
    	    if (!res_done){
		try{
		    cb(JSON.parse(res_data));
		}
		catch(e){
		    cb_err("Parse error:"+res_data);
		}
    		res_done = true;
    	    }
	});
    });	
    if(method === "GET"){
	client.end();
    }
    else{
	client.end(data);
    }
    client.on('error', function(e) {
	if (!res_done){
    	    cb_err(e);
    	    res_done = true;
	}
    });
};

var http_request = function(input,cb,cb_err){
    var path = input.path;
    var host = input.host;
    var method = input.method;

    var res_done = false;
    var client = http.request({
	port : 80,
	path : path,
	host: host,
	method : method
    },function(res){
	if(res.statusCode === 200){
	    var res_data = "";
	    res.on('data', function(data) {
    		res_data+=data;
	    });
	    res.on("end",function(){
    		if (!res_done){
		    cb(res_done);
    		    res_done = true;
    		}
	    });
	}
	else{
	    if(res.statusCode === 301 || res.statusCode === 302){
		var url = res.headers && res.headers.location;
		cb({statusCode : res.statusCode, url:url}); 
	    }
	    else{
		cb_err("Error status code");
	    }
	}
    });	
    if(method === "GET"){
	client.end();
    }
    else{
	client.end(data);
    }
    client.on('error', function(e) {
	if (!res_done){
    	    cb_err(e);
    	    res_done = true;
	}
    });
};

var twitter_api = function(input,cb,cb_err){
    var params = input.params;
    var method_type = input.method_type;
    var path = input.path;
    var auth = input.auth || null;
    

    var res_done = false;
    var data = qs.stringify(params);

    var headers = { 
    	"Content-Type" : "application/x-www-form-urlencoded",
    	"Content-Length": data.length,
    	"Content-Encoding" : "utf8"
    };
    if(auth){
	headers["Authorization"] = "Basic " + new Buffer(auth.username + ":" + auth.password).toString("base64");
    }

    var actual_path = "/1.1"+path;
    if(method_type === "GET"){
	actual_path+="?"+data;
	delete headers["Content-Length"];
    }

    var client = https.request({
	port : 80,
	path : actual_path,
	host: "api.twitter.com",
	method : method_type, 
	headers: headers
    },function(res){
	var res_data = "";
	res.on('data', function(data) {
    	    res_data+=data;
	});
	res.on("end",function(){
    	    if (!res_done){
		//console.log(res_data);
		cb(JSON.parse(res_data));
    		res_done = true;
    	    }
	});
    });	
    if(method_type === "GET"){
	client.end();
    }
    else{
	client.end(data);
    }
    
    client.on('error', function(e) {
	if (!res_done){
    	    cb_err(e);
    	    res_done = true;
	}
    });
};

var twitter_api_https = function(input,cb,cb_err){
    var params = input.params;
    var method_type = input.method_type;
    var path = input.path;
    var auth = input.auth || null;
    var session = input.session || null;

    if(session){
	twitter_api_https_oauth(input,cb,cb_err);
	return;
    }
    

    var res_done = false;
    var data = qs.stringify(params);

    var headers = { 
    	"Content-Type" : "application/x-www-form-urlencoded",
    	"Content-Length": data.length,
    	"Content-Encoding" : "utf8"
    };
    if(auth){
	headers["Authorization"] = "Basic " + new Buffer(auth.username + ":" + auth.password).toString("base64");
    }

    var actual_path = "/1.1"+path;
    if(method_type === "GET"){
	actual_path+="?"+data;
	delete headers["Content-Length"];
    }

    var client = https.request({
	port : 443,
	path : actual_path,
	host: "api.twitter.com",
	method : method_type, 
	headers: headers
    },function(res){
	var res_data = "";
	res.on('data', function(data) {
    	    res_data+=data;
	});
	res.on("end",function(){
    	    if (!res_done){
		//console.log(res_data);
		try{
		    var res_parsed = JSON.parse(res_data);
		    if(!res_parsed.error){
			cb(res_parsed);
		    }
		    else{
			cb_err(res_parsed.error);
		    }
		}
		catch(e){
		    cb_err("Parse error:"+res_data);
		}
    		res_done = true;
    	    }
	});
    });	
    if(method_type === "GET"){
	client.end();
    }
    else{
	client.end(data);
    }
    
    client.on('error', function(e) {
	if (!res_done){
    	    cb_err(e);
    	    res_done = true;
	}
    });
};

u.twitter_auth = null;
var twitter_api_https_oauth_set_twitter_auth = function(input){
    var twitter_auth = input.twitter_auth;
    u.twitter_auth = twitter_auth;
};

var twitter_api_https_oauth = function(input,cb,cb_err){
    var params = input.params;
    var method_type = input.method_type;
    var path = input.path;    
    var session = input.session;

    if(!u.twitter_auth){
	cb_err("Errore autenticazione twitter");
	return;
    }

    if(!session || !session.oauthAccessToken || !session.oauthAccessTokenSecret){
	cb_err("No oauth token");
	return;
    }
    
    var data = qs.stringify(params);
    var actual_path = "/1.1"+path;
    if(method_type === "GET"){
	actual_path+="?"+data;
    }

    var url = "https://api.twitter.com"+actual_path;
    
    var api_call = null;
    if(method_type === "GET"){
	api_call = function(next){
	    return u.twitter_auth().get(url, session.oauthAccessToken, session.oauthAccessTokenSecret,next);
	};
    }
    else if(method_type === "POST"){
	api_call = function(next){
	    return u.twitter_auth().post(url, session.oauthAccessToken, session.oauthAccessTokenSecret,data,next);
	};
    }
    else if(method_type === "PUT"){
	api_call = function(next){
	    return u.twitter_auth().put(url, session.oauthAccessToken, session.oauthAccessTokenSecret,data,next);
	};
    }
    else if(method_type === "DELETE"){
	// api_call = function(next){
	//     return u.twitter_auth().delete(url, session.oauthAccessToken, session.oauthAccessTokenSecret,next);
	// };
    }
    else{
	cb_err("method error");
	return;
    }
    
    api_call(function(error, res_data, response){
	if(error){
	    cb_err(error);
	}
	else{
	    try{
		res_data = JSON.parse(res_data);
		if(!res_data.error){
		    cb(res_data,response.headers);
		}
		else{
		    cb_err(res_data.error,response.headers);
		}
	    }
	    catch(e){
		cb_err(e);
	    }
	}
    });
};

var twitter_api_https_oauth_verify_account = function(input,cb,cb_err){
    var session = input.session;
    twitter_api_https_oauth({
    	params : {},
    	method_type : "GET",
    	path : "/account/verify_credentials.json",
	session : session
    },function(res){
	cb(res);
    },function(err){
	cb_err("Errore account");
    });
};

// var last_data_time = null;
// var check_connection_active = function(){
//     var now = new Date();
    
//     if(last_data_time && client){
// 	var diff_sec = (last_data_time.getTime()-now.getTime())/1000;
// 	if(diff_sec > 60*5){
// 	    client.abort();
// 	}
//     }
// };

var twitter_stream_api_https = function(input,cb,cb_err){
    var params = input.params;
    var method_type = input.method_type;
    var path = input.path;
    var on_data = input.on_data;
    var on_data_err = input.on_data_err || null;
    var auth = input.auth || null;
    
    var res_done = false;
    var data = qs.stringify(params);

    var headers = { 
    	"Content-Type" : "application/x-www-form-urlencoded",
    	"Content-Length": data.length,
    	"Content-Encoding" : "utf8"
    };
    if(auth){
	headers["Authorization"] = "Basic " + new Buffer(auth.username + ":" + auth.password).toString("base64");
    }
    
    var end_token = "\r\n";
    var buffer = "";    
    var last_data_time = new Date();

    var client = https.request({
	port : 443,
	path : "/1.1"+path,
	host: "stream.twitter.com",
	method : method_type, 
	headers: headers
    },function(res){
	res.on('data', function(data) {
	    //console.log(data.toString());
	    last_data_time = new Date();
	    if(data){
		buffer += data.toString("utf8");
		//console.log("buffer init",buffer);
		var index=0, json="";

		// We have END?
		while ((index = buffer.indexOf(end_token)) > -1) {
		    json = buffer.slice(0, index);
		    buffer = buffer.slice(index + end_token.length);
		    if (json.length > 0) {
			try {
			    json = JSON.parse(json);
			} catch (error) {
			    console.log(error);
			    if(on_data_err){
				on_data_err(error);
			    }
			    return;
			}
			on_data(json);
		    }
		}
		//console.log("buffer end",buffer);
	    }
	});
	res.on("end",function(){
    	    if (!res_done){
		cb();
    		res_done = true;
    	    }
	});
    });	
    client.end(data);
    client.on('error', function(e) {
	if (!res_done){
    	    cb_err(e);
    	    res_done = true;
	}
    });
    client.on("close",function(){
	if (!res_done){
	    cb();
	    res_done = true;
	}
    });
    
    // Check connection not in stall, ohterwise close socket and exit
    var check_connection_is_alive = function(cb_not_alive){
	if(!res_done){
	    var now = new Date();
	    var diff_msec_last_data = now.getTime() - last_data_time.getTime();
	    var thresh_not_alive = 90*1000;
	    if (diff_msec_last_data < thresh_not_alive){
		console.log("connection alive");
		// Check after 30sec
		setTimeout(function(){
		    check_connection_is_alive(cb_not_alive);
		},30*1000);
	    }
	    else{
		console.log("connection NOT alive");
		cb_not_alive();
	    }
	}
    };    
    var close_connection = function(){
	if(client.destroy){
	    client.destroy();
	}
	else{
	    console.log("no destroy method!");
	}
    };
    // Launch check connection
    check_connection_is_alive(close_connection);
};

var if_async = function(test,f_then,f_else,f_cont){
    if(test){
	f_then(f_cont);
    }
    else{
	f_else(f_cont);
    }
};
// Usage:
// if_async(
//     test,
//     function(next_if){ // then
//     },
//     function(next_if){ // else
//     },
//     function(){ // cont
//     });

var get_lfollowing_screen_name = function(input,cb,cb_err){
    var screen_name = input.screen_name;
    
    twitter_api_https({
    	params : {screen_name : screen_name,
    		  cursor : "-1",
		  stringify_ids : "true"
    		 },
    	method_type : "GET",
    	path : "/friends/ids.json"
    },function(res){
    	var lids = res.ids;
	lids.sort();
	cb(lids);
    },cb_err);    
};

var get_twitter_profile_ids = function(input,cb,cb_err){
    var screen_name = input.screen_name;
    
    twitter_api({
    	params : {screen_name : screen_name,
    		  cursor : "-1",
		  stringify_ids : "true"
    		 },
    	method_type : "GET",
    	path : "/followers/ids.json"
    },function(res){
    	var lids = res.ids;
	lids.sort();
	cb(lids);
    });    
};

var get_followers_lscreen_name = function(input,cb,cb_err){
    var lscreen_name = input.lscreen_name;
    
    var ltwitter_id = [];

    async_each(lscreen_name,function(screen_name,next,next_err){
	get_twitter_profile_ids({
	    screen_name : screen_name
	},function(ltwitter_id_site){
	    console.log(screen_name,ltwitter_id_site.length);
	    ltwitter_id = ltwitter_id.concat(ltwitter_id_site);
	    next();
	},next);
    },function(){
	ltwitter_id.sort();
	var ltwitter_id_uniq = _.uniq(ltwitter_id,true);	
	cb(ltwitter_id_uniq);	
    },cb_err);
};

var get_info_ltwitter_id_max100 = function(input,cb,cb_err){
    var ltwitter_id = input.ltwitter_id;
    
    var str_ltwitter_id = _.reduce(ltwitter_id,function(x,y){
	return x+","+y;
    });
    
    twitter_api_https({
    	params : {user_id : str_ltwitter_id
    		 },
    	method_type : "GET",
    	path : "/users/lookup.json"
    },function(lres){
	cb(lres);
    },cb_err);
};

var get_info_ltwitter_id = function(input,cb,cb_err){
    var ltwitter_id = input.ltwitter_id;
    var h_twitter_id = {};

    var ll_twitter_id = split_list_nelem(ltwitter_id,100);
    serialize_each(ll_twitter_id,function(ltwitter_id_block,next,next_err){
	get_info_ltwitter_id_max100({
	    ltwitter_id : ltwitter_id_block
	},function(ltwitter_info){
	    _.each(ltwitter_info,function(o){
		h_twitter_id[o.id_str] = o;
	    });	    
	    next();
	},next);
    },function(){
	var ltwitter_info = _.map(ltwitter_id,function(twitter_id){
	    return h_twitter_id[twitter_id];
	});
	cb(ltwitter_info);
    },cb_err);
};

var get_info_lscreen_name = function(input,cb,cb_err){
    var lscreen_name = input.lscreen_name;
    var session = input.session || null;
    
    var str_lscreen_name = _.reduce(lscreen_name,function(x,y){
	return x+","+y;
    });
    
    twitter_api_https({
    	params : {screen_name : str_lscreen_name
    		 },
    	method_type : "GET",
    	path : "/users/lookup.json",
	session : session
    },function(lres,headers){
	cb(lres,headers);
    },cb_err);
};

var f_identity = function(o){
    return o;
};

var create_hash_from_list = function(input){
    var l = input.l;
    var f_key = input.f_key;
    var f_val = input.f_val || f_identity;
    
    var h = {};
    _.each(l,function(o){
	var k = f_key(o);
	var v = f_val(o);
	if(k){
	    h[k] = v;
	}
    });
    return h;
};

var img_get_resolution = function(input,cb,cb_err){
    var file_img = input.file_img;
    im.identify([
	file_img
    ],function(err,res){
	if(err){
	    cb_err(err);
	}
	else{
	    // Search resolution
	    var regex =/ ([0-9]+x[0-9]+) /;
	    var val = regex.exec(res)[1];
	    if (val){
		var lsplit = val.split("x");
		cb({w : parseInt(lsplit[0],10),
		    h : parseInt(lsplit[1],10)
		   });
	    }
	    else{
		cb_err("Errore ottenere risoluzione");
	    }
	}
    });
};
u.img_get_resolution = img_get_resolution;


var download_file = function(input,cb,cb_err){
    var url = input.url;
    var path = input.path;
    var debug = input.debug;

    if(url.match(/^\/\//)){
	url = "http:"+url;
    }

    if(debug){
	cb();
	return;
    }
    
    var parsed_url = lib_url.parse(url);
    options = {
	host: parsed_url.host,
	port: parsed_url.port,
	path: parsed_url.pathname
    };

    var request = http.get(options, function(res){
	var data = '';
	res.setEncoding('binary');

	res.on('data', function(chunk){
	    data += chunk;
	});

	res.on('end', function(){
	    cb({data:data});
	});

	res.on("error",function(e){
	    cb_err(e);
	});

    });
};
u.download_file = download_file;

var download_img = function(input,cb,cb_err){
    var url = input.url;
    var path = input.path;
    
    fs.exists(path,function(exists){
	if(exists){
	    cb(path);
	}
	else{
	    download_file({
		url : url
	    },function(res){
		fs.writeFile(path, res.data,"binary",function(err){
		    if(err){
			cb_err(err);
		    }
		    else{
			cb(path);
		    }
		});
	    },cb_err);
	}
    });
};
u.download_img = download_img;

var img_get_resolution_url = function(input,cb,cb_err){
    var url = input.url;
    
    var path = "tmp/"+url.replace(/\//g,"_");
    
    download_img({
	url : url,
	path: path
    },function(){
	img_get_resolution({
	    file_img : path
	},function(res){
	    cb(res);
	},cb_err);
    },cb_err);
};
u.img_get_resolution_url = img_get_resolution_url;

var writefile = function(input,cb,cb_err){
    var file_name = input.file_name;
    var data = input.data;
    fs.writeFile(file_name,data,function(err){
	if(err){
	    cb_err(err);
	}
	else{
	    cb();
	}
    });
};

var histeresis = function(f,msec){
    if(!msec){
	msec = 100;
    }
    var last_update = null;
    return function(){
	var curr_update = new Date();
	if(!last_update || (curr_update.getTime() - last_update.getTime()) > msec){
	    last_update = curr_update;
	    return f.apply(this,arguments);
	}
	else{
	    return null;
	}
    };
};

var watch_file_exec = function(input){
    var file_name = input.file_name;
    var exec = input.exec;
    var update = input.update||"updated";
    fs.watch(file_name,histeresis(function(event, filename){
	// exec less compilation
	child_process.exec(exec,function(){
	    console.log(update);
	});
    }));
};

var date_diff = function(d1,d2){
    if(!d1 || !d2 || !d1.getTime || !d2.getTime){
	return {
	    secs : 0,
	    mins : 0,
	    hours : 0,
	    days : 0,
	    negative : 0
	};
    }
    var day_sec = 86400;
    var hour_sec = 3600;
    var min_sec = 60;
    var t1 = d1.getTime();
    var t2 = d2.getTime();
    var diff = Math.floor((t1 - t2)/1000);
    var negative = (diff<0);
    diff = (diff<0) ? (-diff) : (diff);
    var days =  Math.floor(diff/day_sec);
    diff = diff % day_sec;
    var hours = Math.floor(diff/hour_sec);
    diff = diff % hour_sec;
    var mins = Math.floor(diff/min_sec);
    diff = diff % min_sec;
    var secs = diff;
    var obj = {
	secs : secs,
	mins : mins,
	hours : hours,
	days : days,
	negative : negative
    };
    return obj;
};

var decorator_call_func_one_time = function(f,delay){
    var try_call = false;
    return function(input,cb,cb_err){
	if(!try_call){
	    try_call = true;
	    f(input,function(){
		if(delay){
		    setTimeout(function(){
			try_call = false;
			cb();
		    },delay);
		}
		else{
		    try_call = false;
		    cb();
		}
	    },function(err){
		if(delay){
		    setTimeout(function(){
			try_call = false;
			cb_err(err);
		    },delay);
		}
		else{
		    try_call = false;
		    cb_err(err);
		}
	    });
	}
    };    
};

var decorator_wait_last_func_call = function(f,delay){
    var idx = 0;
    return function(input,cb,cb_err){
	idx++;
	var local_idx = idx;
	setTimeout(function(){
	    if(idx === local_idx){
		f(input,cb,cb_err);
	    }
	},delay);
    }
};

var serialize_func = function(input,lfunc,cb,cb_err){
    var curr_input = input;
    serialize_each(lfunc,function(f,next,next_err){
	f(curr_input,function(res){
	    curr_input = res;
	    next();
	},next_err);
    },function(){
	cb(curr_input);
    },cb_err);
};

// Usage example:
// u.serialize_func({},[
//     function(_i,_n,_ne){
// 	_n();
//     },
//     function(_i,_n,_ne){
// 	_n();
//     },
// ],function(){
//     cb();
// },cb_err);

var watch_file_list = function(input){
    var ls_cmd = input.ls_cmd;
    var f_exec = input.f_exec;
    var f_update = input.f_update;

    child_process.exec(ls_cmd,function(err,res){
	var lfile = _.lines(res);
	lfile = _.filter(lfile,function(f){
	    return f;
	});
	_.each(lfile,function(f){
	    watch_file_exec({
		file_name : f,
		exec : f_exec(f),
		update : f_update(f),
	    });
	});
    });
};
u.watch_file_list = watch_file_list;

var all_combination = function(l){
    var _rec = function(all,idx){

	if(idx < l.length){
	    console.log("s");
	    var curr = l[idx];
	    var all =  all.concat(_.flatten(_.map(all,function(e){
		var z =  _.map(_.range(0,e.length+1),function(idx){
		    return e.slice(0,idx).concat([curr]).concat(e.slice(idx));
		});		
		return z;
	    }),true));
	    console.log(all);
	    return _rec(all,idx+1);
	}
	else{
	    return all;
	}	
    };
    return _rec([[]],0);
};

var test_all_combination = function(){
    var l = ["a","b","c","d"];
    var all = all_combination(l);
    //console.log(all);
};


// Export symbol library
u.removeBegEndBlank = removeBegEndBlank;
u.f_sync_calls = f_sync_calls;
u.first = first;
u.last_elem = last_elem;
u.serialize_each = serialize_each;
u.async_each = async_each;
u.async_each_timeout = async_each_timeout;
u.split_list_nelem = split_list_nelem;
u.async_each_block = async_each_block;
u.async_each_block_with_idx = async_each_block_with_idx;
u.async_filter = async_filter;
u.async_map = async_map;
u.serialize_filter = serialize_filter;
u.serialize_map = serialize_map;
u.create_hash_from_list = create_hash_from_list;
u.f_err = f_err;
u.f_nop = f_nop;
u.http_request_json_api = http_request_json_api;
u.http_request = http_request;
u.twitter_api = twitter_api;
u.twitter_api_https = twitter_api_https;
u.twitter_stream_api_https = twitter_stream_api_https;
u.if_async = if_async;
u.get_lfollowing_screen_name = get_lfollowing_screen_name;
u.get_followers_lscreen_name = get_followers_lscreen_name;
u.get_twitter_profile_ids = get_twitter_profile_ids;
u.get_followers_lscreen_name = get_followers_lscreen_name;
u.get_info_ltwitter_id_max100 = get_info_ltwitter_id_max100;
u.get_info_ltwitter_id = get_info_ltwitter_id;
u.get_info_lscreen_name = get_info_lscreen_name;
u.writefile = writefile;
u.histeresis = histeresis;
u.watch_file_exec = watch_file_exec;
u.date_diff = date_diff;
u.twitter_api_https_oauth_set_twitter_auth = twitter_api_https_oauth_set_twitter_auth;
u.twitter_api_https_oauth = twitter_api_https_oauth;
u.twitter_api_https_oauth_verify_account = twitter_api_https_oauth_verify_account;
u.decorator_call_func_one_time = decorator_call_func_one_time;
u.decorator_wait_last_func_call = decorator_wait_last_func_call;
u.serialize_func = serialize_func;

// if(!module.parent){
//     //test_all_combination();
//     //test_async_each_timeout();
// }
