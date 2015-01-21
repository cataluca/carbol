Post = require("../model/post").Post
    
exports.index = (req, res) ->
  res.render 'index', title: 'Express'

