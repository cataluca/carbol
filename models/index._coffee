###
streamline.options = { "callback": "__" };
###

sync = require '../sync'
# generic methods for models

exports.cascade_delete =
cascade_delete  = ({Model,query,done}) ->
     Model.find query,
        (err,lobj) ->
            if err
                done err
                return
            sync.serialize_each lobj,(n,obj) ->
                obj.remove n
            ,(err) ->
                if err
                    done err
                else
                    done()
