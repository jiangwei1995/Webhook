var http = require('http'), 
    exec = require('exec'),
    config = require('./config.json'),
    createHandler = require('github-webhook-handler'),
    handler = createHandler({ path: config.webpath, secret: config.secret }); //github => webhook配置的secret
    
//端口号和服务器源码路径
const PORT = config.port,
      commands = config.commands.join(' && ');

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(PORT);

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('push', function (event) {
  //进入文件夹执行pull命令
    exec(commands, function(err, out, code) {
      if (err instanceof Error) {
	throw err
      }
      process.stderr.write(err)
      process.stdout.write(out)
    })
    console.log('Received a push event for %s to %s',
      event.payload.repository.name,
      event.payload.ref)
})

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title)
})
