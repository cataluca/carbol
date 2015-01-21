Post = require("../model/post").Post
    
exports.index = (req, res) ->
  res.render 'index', title: 'Express'

exports.factory_show_posts = ({}) ->
    (req,res) ->
        
        res.render 'index', title: 'Express'
