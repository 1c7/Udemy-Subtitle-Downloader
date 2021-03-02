// https://www.udemy.com/course/swiftui-built-a-real-world-application-using-core-data/learn/lecture/23665120#overview
试图获取这一门课的字幕


// UD
// 这个似乎是 Udemy 的全局变量，但是字幕数据不在里面

// 字幕也不在源代码里，
// 似乎用的是 video js

function addScript(src, callback) {
	var s = document.createElement('script');
	s.setAttribute('src', src);
	s.onload = callback;
	document.body.appendChild(s);
}

var video_js_cdn = "https://vjs.zencdn.net/7.10.2/video.min.js"
addScript(video_js_cdn, function () {
	console.log('done');
})

var vjs = videojs(document.querySelector('video'))



https: //www.udemy.com/api-2.0/users/me/subscribed-courses/3681012/lectures/23665120/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls&q=0.2018478031485651

	https: //www.udemy.com/api-2.0/users/me/subscribed-courses/3681012/lectures/23665120/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls&q=0.2018478031485651


	x - udemy - authorization: Bearer jCM9ItIBq4YEbtZw5tYqil5nBoEsUsmSaG00vu0c
authorization: Bearer jCM9ItIBq4YEbtZw5tYqil5nBoEsUsmSaG00vu0c

// accept: application/json, text/plain, */*

结论： 现在只要也发同样 URL 的请求， 就可以获得 webvtt 的数据。
问题是直接访问会报错， 有某种身份验证， 看起来不是在 URL 里而是在请求头里
jCM9ItIBq4YEbtZw5tYqil5nBoEsUsmSaG00vu0c
这个要怎么获取？

localStorage 里面没找到有价值的

在 Cookie 里面找到了， 这个叫 access_token


// https://stackoverflow.com/questions/5639346/what-is-the-shortest-function-for-reading-a-cookie-by-name-in-javascript
const getCookieValue = (name) => (
	document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)') ? .pop() || ''
)

getCookieValue("access_token")
"jCM9ItIBq4YEbtZw5tYqil5nBoEsUsmSaG00vu0c"

没问题

// var url = "https://www.udemy.com/api-2.0/users/me/subscribed-courses/3681012/lectures/23665120/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls&q=0.2018478031485651"
var url = "https://www.udemy.com/api-2.0/users/me/subscribed-courses/3681012/lectures/23665120/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls"
// 问题：现在的确可以拿到字幕了，但是 url 怎么构建？
// 3681012：课程 id
// 23665120：这一节课的 id


问题： 有没有办法获得每一节课的 id？ 一次性下载一整门课的字幕（ 而不是一个个来）


// 把下载视频也一起做了？

courseId: 3681012
拿到了。。
initialCurriculumItemId: 23665120

function get_args() {
	var ud_app_loader = document.querySelector('.ud-app-loader')
	var args = ud_app_loader.dataset.moduleArgs
	var json = JSON.parse(args)
	return json
}

function get_course_id() {
	var json = get_args()
	return json.courseId
}

function get_lecture_id() {
	var json = get_args()
	return json.initialCurriculumItemId
}


// 一整门课的数据
function get_course_data_url() {

}

var access_token = getCookieValue("access_token")
var bearer_token = `Bearer ${access_token}`
fetch(get_lecture_data_url(), {
		headers: {
			'x-udemy-authorization': bearer_token,
			'authorization': bearer_token,
		}
	})
	.then(response => response.json())
	.then(data => {
		console.log(data);
		var captions_array = data.asset.captions;
		console.log(captions_array);
	}).catch(e => {
		reject(e);
	})

