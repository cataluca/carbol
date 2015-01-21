###
streamline.options = { "callback": "__" };
###

mongoose = require 'mongoose'
conf = require '../conf'
Schema = mongoose.Schema
ObjectId = Schema.ObjectId
model = require "./index"

authorSchema = new Schema
    name : String
    surname: String
    __cascade : Boolean

authorSchema.virtual("fullname").get ->
    "#{@name} #{@surname}"

# authorSchema.path("name").validate (name) ->
#     name
# , "Name is not defined"

authorSchema.pre "save", (next) ->
    console.log "salvataggio...",@
    if not @name
        next new Error("Name is not defined")
    else
        next();

authorSchema.pre "remove", true, (next,done) ->
    console.log "pre-remove",@
    next()
    if @__cascade
        Post = require("./post").Post
        model.cascade_delete
            Model : Post
            query :
                author : @_id
            done : done
    else
        done()

exports.Author = mongoose.model('Author', authorSchema);

# TESTS
##################################################
test_add_author = ({},__) ->
    author = new exports.Author
        name : "Fabio"
        surname : "Castaldo"
    author.save __
    console.log author
    mongoose.connection.close()

test_get_author = ({},__) ->
    mongoose.connect(conf.mongo_uri);
    author = exports.Author.findOne
        _id : "5229d9dd3f1445e174000001"
    ,__
    console.log author
    console.log author.fullname
    author.name = "Fabio"
    author.save __
    mongoose.connection.close()

test_remove_author = ({},__) ->
    mongoose.connect(conf.mongo_uri);
    post = exports.Author.findOne
        _id : "5229d9dd3f1445e174000001"
    ,__
    console.log post
    post.__cascade = true;
    post.remove __    
    mongoose.connection.close()

if not module.parent
    # test model
    if process.argv.length >= 3
        f =  process.argv[2]
        f = eval f
        f({},__)
