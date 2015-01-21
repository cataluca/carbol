express = require 'express'
partials = require 'express-partials'
MongoStore = require('connect-mongo')(express);
fs = require "fs"
routes = require './routes'
user = require './routes/user'
http = require 'http'
path = require 'path'
less = require 'less-middleware'
mongoose = require 'mongoose'
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
app.use express.cookieParser 'my secret here'
if not conf.no_session
    app.use(express.session({secret: "this is chiccas",store: new MongoStore({url:conf.mongo_uri}),cookie: { maxAge: 365*24*60*60*1000}}))
app.use express.session()
app.use app.router
app.use less(
    paths  : [path.join(__dirname,'bower_components','bootstrap','less')]
    src: __dirname + '/public')
app.use express.static path.join(__dirname, 'bower_components')
app.use express.static path.join(__dirname, 'public')

# development only
if 'development' == app.get('env')
    app.use express.errorHandler()
fs.writeFileSync("process.pid",process.pid);

mongoose.connect(conf.mongo_uri);
app.get '/', routes.factory_show_posts()
app.get '/users', user.list

u.watch_file_list
	ls_cmd : "ls *._js models/*._js routes/*._js"
	f_exec : (f) ->
	    "_node -c "+f
	f_update : (f) ->
	    "updated "+f

http.createServer(app).listen app.get('port'),->
    console.log "Express server listening on port #{app.get('port')}"
