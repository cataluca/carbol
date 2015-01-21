###
streamline.options = { "callback": "__" };
###

_ = require "underscore"

Post = require("../models/post").Post
Author = require("../models/author").Author
    
exports.index = (req, res) ->
  res.render 'index', title: 'Express'

render_post = ({p}) ->
    #p = _.pick p, "title","body"       
    p

factory_render_page = ({page,render_name}) ->
    (req,res,next) ->
        page req,res,(err,view_info)->
            console.log err
            if err
                next(err)
                return
            res.render 'index', view_info

exports.factory_show_posts = ({}) ->
    page = (req,res,__) ->
        status = {}
        lpost = Post.find({})
        .populate("author")
        .exec __
        console.log(lpost);        
        lpost = _.map lpost,(p) ->
            render_post
                p : p
        console.log lpost
        {title:"Pippo",lpost:lpost,status:status}
    factory_render_page
        page:page
        render_name : "index"
