express = require 'express'
partials = require 'express-partials'
fs = require "fs"
routes = require './routes'
http = require 'http'
path = require 'path'
conf = require './conf'
u = require './utils'
app = express()

console.log conf.mongo_uri

#all environments
app.set 'port', conf.port
app.set 'views', __dirname + '/views'
app.set 'view engine', 'ejs'
app.use partials()
app.use express.favicon()
app.use express.logger 'dev'
app.use express.bodyParser()
app.use express.methodOverride()
app.use app.router
app.use express.static path.join(__dirname, 'bower_components')
app.use express.static path.join(__dirname, 'public')

# development only
if 'development' == app.get('env')
    app.use express.errorHandler()
fs.writeFileSync("process.pid",process.pid);

#mongoose.connect(conf.mongo_uri);
# app.get '/', (req,res) ->
#     res.status(200).sendfile("public/index.html")

app.get '/', routes.index


http.createServer(app).listen app.get('port'),->
    console.log "Express server listening on port #{app.get('port')}"
