var http = require('http'), 
    exec = require('exec'),
    createHandler = require('github-webhook-handler'),
    handler = createHandler({ path: '/', secret: 'jiangwei123' });
    

const PORT = 1337
  , PATH = '../home.io'

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
  var commands = [
      'cd ' + PATH,
      'git pull'
    ].join(' && ')

    exec(commands, function(err, out, code) {
      if (err instanceof Error) {
        response.writeHead(500)
        response.end('Server Internal Error.')
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
