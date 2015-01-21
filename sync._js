// streamline.options = { "callback": "__" };

var _ = require('underscore');
var u = require('./utils');
var fs = require("fs");

var sync = {};

var convert_each = function(f){
    return function(l,iter,cb){
	f(l,function(o,n,ne,idx){
	    iter(function(err,val){
		if(err){
		    ne(err);
		}
		else{
		    n(val);
		}
	    },o,idx);
	},function(val){
	    cb(false,val)
	},function(err){
	    cb(err)
	});
    };    
};

sync.async_map = convert_each(u.async_map);
sync.async_filter = convert_each(u.async_filter);
sync.async_each = convert_each(u.async_each);
sync.async_each_timeout = convert_each(u.async_each_timeout);
sync.serialize_map = convert_each(u.serialize_map);
sync.serialize_filter = convert_each(u.serialize_filter);
sync.serialize_each = convert_each(u.serialize_each);

var async_each_block = function(input,iter,cb){
    var l = input.l;
    var nblock = input.nblock || 1;
    
    u.async_each_block_with_idx(l,function(w,n,ne){
    	iter(function(err,val){
    	    if(err){
    		ne(err);
    	    }
    	    else{
    		n();
    	    }
    	},w.o,w.idx);
    },function(val){
    	cb(false,val)
    },function(err){
    	cb(err)
    },nblock);
};
sync.async_each_block = async_each_block;

var async_each_block_map = function(input,iter,cb){
    var l = input.l;
    var nblock = input.nblock || 1;
    
    var hidx = {};
    u.async_each_block_with_idx(l,function(w,n,ne){
    	iter(function(err,val){
    	    if(err){
    		ne(err);
    	    }
    	    else{
		hidx[w.idx] = val;
    		n();
    	    }
    	},w.o,w.idx);
    },function(){
	l = _.map(l,function(obj,idx){
	    return hidx[idx];
	});
    	cb(false,l);
    },function(err){
    	cb(err)
    },nblock);
};
sync.async_each_block_map = async_each_block_map;

var async_each_block_filter = function(input,iter,cb){
    var l = input.l;
    var nblock = input.nblock || 1;
    
    var idx = 0;
    var hidx = {};
    u.async_each_block_with_idx(l,function(w,n,ne){
    	iter(function(err,val){
    	    if(err){
    		ne(err);
    	    }
    	    else{
		hidx[w.idx] = val;
    		n();
    	    }
    	},w.o,w.idx);
    },function(){
	l = _.filter(l,function(obj,idx){
	    return hidx[idx];
	});
    	cb(false,l);
    },function(err){
    	cb(err)
    },nblock);
};
sync.async_each_block_filter = async_each_block_filter;


var serialize_cursor = function(cursor,f,cb){
    var idx = 0;
    var _make = function(){
	cursor.nextObject(function(err, item) {
	    if(err){
		cb(err);
	    }
	    else{
		if(item === null){
		    cb(false);
		}
		else{
		    f(function(err){
			if(err){
			    cb(err);
			}
			else{
			    idx++;
			    setTimeout(function(){
				_make();
			    },1);
			}
		    },item,idx);
		}		
	    }
	});
    };
    _make();
};
sync.serialize_cursor = serialize_cursor;


// // BE AWARE!!! BUGGY DUE TO nextObject method
// var async_each_block_cursor = function(input,f,cb){
//     var cursor = input.cursor;
//     var nelem = input.nelem;
    
//     var idx = 0;
//     var has_err = false;
//     var has_end = false;
//     var _make = function(){
// 	var cnt_elem = 0;
// 	var lelem = _.range(0,nelem);
// 	sync.async_each(lelem,function(next,ielem){
// 	    console.log(ielem);
// 	    setTimeout(function(){
// 		cursor.nextObject(function(err, item) {
// 		    if(err){
// 			if(!has_err){
// 			    has_err = true;
// 			    cb(err);
// 			}
// 		    }		
// 		    else{
// 			if(item === null){ // be aware possible raise condition!
// 			    if(!has_end){
// 				has_end = true;
// 				cb(false);
// 			    }
// 			}
// 			else{
// 			    f(function(err){
// 				if(err){
// 				    if(!has_err){
// 					has_err = true;
// 					cb(err);
// 				    }			    
// 				}
// 				else{
// 				    idx++;
// 				    setTimeout(function(){
// 					next();
// 				    },1);
// 				}
// 			    },item,idx);
// 			}		
// 		    }
// 		});
// 	    },10*(ielem+1));	    
// 	},function(){
// 	    _make();
// 	});
//     };
//     _make();
    
// };
// sync.async_each_block_cursor = async_each_block;
// sync.async_each_block_cursor({cursor:cursor,nelem:10},function(__,prod,idx){
//     console.log(prod._id,idx);	
    
// },__);

var read_file_line = function(file_name,next_line,cb){
    var idx = 0;
    var read_file_stream = fs.createReadStream(file_name);

    var buffer = "";
    
    read_file_stream
	.on("data",function(data){
	    var data = data.toString("utf8");
	    buffer+=data;
	    // Split in line buffer
	    var lline = buffer.split("\n");
	    if(lline.length === 0){
		cb(new Error("Error in split line"));
	    }
	    else if(lline.length === 1){
		// No line found continue reading		
	    }
	    else if(lline.length > 1){
		read_file_stream.pause();
		var lline_read = lline.slice(0,lline.length-1);
		sync.serialize_each(lline_read,function(next,line){
		    next_line(next,line,idx);
		    idx = idx+1;
		},function(err){
		    if(err){
			read_file_stream.destroy();
			cb(err);
			return;
		    }
		    buffer = lline[lline.length-1];
		    read_file_stream.resume();
		});
	    }
	})
	.on("error",function(error){	    
	    cb(error);
	})
	.on("end",function(){
	    cb(false);
	});
};
sync.read_file_line = read_file_line;

module.exports = sync;
