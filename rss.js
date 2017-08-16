/*
Parse Fullerton RSS feed check for duplicates and populate Elastic
Run this 10pm daily from linux command crontab -e: node Build.js&  0 22 * * *
TBI PostElasticSearch(attributes);
*/
function Build(out, cb) {
	var url = "http://calendar.fullerton.edu/RSSSyndicator.aspx?category=&location=&type=N&binary=Y&keywords=&ics=Y";
	//var url = "http://calendar.fullerton.edu/RSSSyndicator.aspx?category=&location=&type=N&starting=4/26/2017&ending=8/8/2017&binary=Y&keywords=&ics=Y";
	var n, content, out = [];	
	require('request')({ method: 'GET', uri: url, encoding: null }, function(e, res, body) {
		var a;
		if(e) { out.push(e + ' ' + url); cb(out); return; }
		if((a = res.statusCode) != 200) { out.push(a + ' ' + url); cb(out); return; }
		for(n = at_xpath(parse(body), "channel/item"); n; n = n.nextSibling) {
			var attributes = { 
				title: at_xpath(n, "title/text()", 1),
				link: at_xpath(n, "link/text()", 1),
				content: to_s(content = parse(at_xpath(n, "content/text()", 1))),
				description: at_xpath(n, "description/text()", 1),
			}
			attributes['start_date'] = at_xpath(content, "tbody/tr[1]/td[1]/table/tbody/tr[1]/td[2]/text()");
			attributes['start_time'] = at_xpath(content, "tbody/tr[1]/td[1]/table/tbody/tr[1]/td[4]/text()");
			attributes['end_date'] = at_xpath(content, "tbody/tr[1]/td[1]/table/tbody/tr[2]/td[2]/text()");
			attributes['end_time'] = at_xpath(content, "tbody/tr[1]/td[1]/table/tbody/tr[2]/td[4]/text()");
			attributes['alt_description'] = at_xpath(content, "tbody/tr[1]/td[1]/p/span/text()");
			attributes['venue'] = at_xpath(content, "tbody/tr[1]/td[1]/text()");
			/*
				POST /event/external?pretty json
			*/
			PostElasticSearch(attributes);
		}
		out.push('Schema: ' + to_s(parse(body)).substring(0, 200)); 
		cb(out);												
	});
}
/*
To Be Implemented
*/
function PostElasticSearch(eventattributes) {
}
var xpath = require('xpath.js');
var DOMParser = require('xmldom')['DOMParser'];
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
function hash(n, flag) { // absent flag skip ^_, path
	var i, leni, a, h, k; for(i = 0, h = {}, leni = !n ? 0 : !(a = n.attributes) ? 0 : a.length; i < leni;
		i++) h[a[i].name] = a[i].value;
	return h;
}
function at_xpath(nn, p, stringv) {
	if(/^\/\//.test(p = p || '')) { nn = root(nn); p = '.' + p; } 
	else if(/^\//.test(p)) { nn = root(nn); p = p.substring(1); } 
	var arr; return !p ? nn : (!nn || (arr = xpath(nn, p)).length == 0) ? ''
		: (stringv && /text\(\)$/.test(p)) ? (arr[0].data || '').trim()
		: (stringv && /\@[\w\-]+$/.test(p)) ? (arr[0].value || '').trim() : arr[0];
}
function debug(b) {
	var i, leni; for(i = 0, s = [], leni = arguments.length; i < leni; i += 1) {
		s.push('' + arguments[i]);
	}
	console.log(s.join(' '));
	return 1;
}
function to_s(s, limit) { return limit ? ('' + s).substring(0, 100) : '' + s };
function debug(b) {
	var i, leni; for(i = 0, s = [], leni = arguments.length; i < leni; i += 1) {
		s.push('' + arguments[i]);
	}
	console.log(s.join(' '));
	return 1;
}
