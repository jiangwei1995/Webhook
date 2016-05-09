var http = require('http'),
    exec = require('exec'),
    config = require('./config.json'),
    _ = require('lodash'),
    fs = require('fs'),
    accessLogfile = fs.createWriteStream('./logs/access.log', {flags: 'a'}),
    errorLogfile = fs.createWriteStream('./logs/error.log', {flags: 'a'}),
    createHandler = require('github-webhook-handler'),
    handler = createHandler({ path: config.webpath, secret: config.secret }); //github => webhook配置的secret

//端口号和服务器源码路径
const PORT = process.env.PORT || config.port;

http.createServer(function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(PORT,function(){
  console.log("服务启动成功，监听端口："+PORT);
});

handler.on('error', function (err) {
  ThrowError(err.message);
})

handler.on('push', function (event) {

  //进入文件夹执行pull命令
    var pusher = event.payload.pusher
        ,url = event.url
        ,id = event.id
        ,action = event.event;
        accessLogfile.write(`${new Date().Format("yyyy-MM-dd hh:mm")} --项目名称：${event.payload.repository.full_name} -- 提交人：${pusher.name} -- 执行：${action}  -- 任务id：${id}\n`);
        var project = checkProject(url);
        var isy = checkPusher(project, pusher);
        if(isy){
          exec(project.commands.join(' && '), function(err, out, code) {
            if (err instanceof Error) {
      	      ThrowError(err.message);
            }
            accessLogfile.write(`${new Date().Format("yyyy-MM-dd hh:mm")}--项目名称：${event.payload.repository.full_name} -- 提交人：${pusher.name} -- 执行：${action}  -- 任务id：${id} -- 状态：成功\n`);
            process.stderr.write(err)
            process.stdout.write(out)
          })
          console.log('Received a push event for %s to %s',
            event.payload.repository.name,
            event.payload.ref)
        }

})

function checkProject(url){
  if (typeof url != 'string')
    ThrowError('url没有添加项目名称');

  var arr = url.split('?');
  var arrjson= _.reduce(arr,function(mome,item,index){
     if(item.indexOf('=')>0){
       mome[item.substring(0,item.indexOf('='))] = item.substring(item.indexOf('=')+1);
     }
     return mome;
   },{});
  if (typeof config.projects[arrjson.project] != 'object')
     ThrowError('没有配置项目')
  if  (typeof config.projects[arrjson.project].commands != 'object')
    ThrowError('没有配置项目执行命令')
  return config.projects[arrjson.project];
}

function  checkPusher(project, pusher){
  if (typeof project != 'object')
    ThrowError('没有配置项目')
  if (typeof project.pusher != 'object')
    ThrowError('没有配置提交者')
  if (typeof project.pusher.length > 0){
    var result =  _.findIndex(project.pusher,pusher);
    if(result<0){
      return false;
    }
  }
  return true;
}

function ThrowError(message){
    errorLogfile.write(`${new Date()} -- Error：${message} \n`,function(){
      throw new TypeError(message);
    });
}

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title)
})

Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds() //秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
