###
streamline.options = { "callback": "__" };
###

_ = require "underscore"

exports.index = (req, res) ->
  res.render 'index', title: 'Express'

