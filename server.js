/*
Phone app sends question and expects answer
Call Watson to deconstruct the question down to subject, action and context attribtues if belongs to a subject
Pass through Watson best response if question not in any subject
Map question to subject and action, source the answerer format the query, use context attributes from watson
Get the answer, humanize response before returning to Phone app, with updated context
*/
var map, context, elastic, url, action, fs = require('fs'),
	conversation = require('watson-developer-cloud').conversation(
	hash(at_xpath(map = parse(fs.readFileSync('map.xml')), "watson")));
fs.readdir(__dirname, function(e, list) { 
	if(e) return '';
	list.forEach(function(file) {
		var a; fs.stat(a = __dirname + "/" + file, function(e, stat) {
			/* Append connectors to the map */			
        	if(!/\.xml$/.test(file) || /map\.xml/.test(file)) return;
        	map.appendChild(parse(fs.readFileSync(a)).cloneNode(true));
        });		
	});
});
require('http').createServer(function(req, res) {
	var input = '', url, cb;
	req.on('data', function(bytes) { input += bytes });
	req.on('end',function() {
		if(/\?([\s\S]+)$/.test(url = '' + req.url)) input += '&' + RegExp.$1;
		cb = function(e, s) {
			res.writeHead(200, {"Content-Type": "application/json; charset=UTF-8"});
			res.write(e ? JSON.stringify(e) : s);
			res.end();
		};
		if(/messageApi/.test(url)) watson(map, JSON.parse(input), cb);
		else cb('Please call with /messageApi');
	});
}).listen(port);
var xpath = require('xpath.js');
var DOMParser = require('xmldom')['DOMParser'];
/*
Return XML from text
*/
function parse(s) {
	var i, arri, leni, n; if(!(s || '').trim() 
		|| !(n = new DOMParser({ errorHandler: {
			warning: function(e) { debug('parse Warning:', e) },
			error: function(e) { debug('PARSE:', e, s.substring(0, 1300)) },
			fatalError: function(e) { debug('PARSE:', e, s.substring(0, 130)) } } })) 
		|| !(n = n.parseFromString(s, 'application/xml'))
		|| !(n = n.documentElement)
		|| !n.getAttribute) return ''; 	
	for(i = 0, leni = (arri = xpath(n, "//text()[normalize-space(.) = '']"))
		.length; i < leni; i++) remove(arri[i]);
	return n;
}
/*
Return hash XML node n attributes 
*/
function hash(n) { 
	var i, leni, a, h, k; for(i = 0, h = {}, leni = !n ? 0 : !(a = n.attributes) ? 0 : a.length; i < leni;
		i++) h[a[i].name] = a[i].value;
	return h;
}
/*
Return XML first node for xpath query if !stringv
Return XML attribute as text for xpath query if stringv
*/
function at_xpath(nn, p, stringv) {
	if(/^\/\//.test(p = p || '')) { nn = root(nn); p = '.' + p; } 
	else if(/^\//.test(p)) { nn = root(nn); p = p.substring(1); } 
	var arr; return !p ? nn : (!nn || (arr = xpath(nn, p)).length == 0) ? ''
		: (stringv && /text\(\)$/.test(p)) ? (arr[0].data || '').trim()
		: (stringv && /\@[\w\-]+$/.test(p)) ? (arr[0].value || '').trim() : arr[0];
}
/*
You can log with commas
*/
function debug(b) {
	var i, leni; for(i = 0, s = [], leni = arguments.length; i < leni; i += 1) {
		s.push('' + arguments[i]);
	}
	console.log(s.join(' '));
	return 1;
}
/* 
Convert XML to String
*/
function to_s(s, limit) { return limit ? ('' + s).substring(0, 100) : '' + s };
eval(fs.readFileSync('./watson.js', { encoding:'utf8' }));
eval(fs.readFileSync('./query.js', { encoding:'utf8' }));

