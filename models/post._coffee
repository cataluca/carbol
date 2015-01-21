###
streamline.options = { "callback": "__" };
###

mongoose = require 'mongoose'
conf = require '../conf'
Schema = mongoose.Schema
ObjectId = Schema.ObjectId

postSchema = new Schema
    title : String
    author: {type : ObjectId, ref : "Author"}
    body:   String
    comments: [{ body: String, date: Date }]
    date: { type: Date, default: Date.now }
    hidden: Boolean
    meta :
        votes : Number
        favs : Number

postSchema.path("title").validate (value) ->
    value
, "Title is not defined"


postSchema.pre "save", (next) ->
    #next new Error("Title is not defined") unless @title
    #next new Error("Author is not defined") unless @author
    next()

postSchema.pre "remove", (next) ->
    console.log "pre-remove",@
    next()

exports.Post = mongoose.model('Post', postSchema);

    
# TESTS
##################################################
test_add_post = ({},__) ->
    mongoose.connect(conf.mongo_uri);
    Author = require("./author").Author
    author = Author.findOne
        name : "Fabio"
    ,__
    post = new exports.Post
        title : "Prova"
        author : author
        body : "Corpo messaggio"
        comments : []
        hidden : false
    post.save __
    console.log post
    mongoose.connection.close()

test_find_and_modify_post = ({},__) ->
    mongoose.connect(conf.mongo_uri);
    Author = require("./author").Author
    post = exports.Post.findOne
        _id:"5229df3602e5e9e878000002"
    .populate("author")
    .exec __
    console.log post
    #post.title = "Nuovo Titolo"
    #post.save __
    #console.log post
    mongoose.connection.close()

test_remove_post = ({},__) ->
    mongoose.connect(conf.mongo_uri);
    post = exports.Post.findOne
        _id:"52175243290b101b38000002"
    ,__
    post.remove __
    console.log post
    mongoose.connection.close()

if not module.parent
    # test model
    if process.argv.length >= 3
        f =  process.argv[2]
        f = eval f
        f({},__)

