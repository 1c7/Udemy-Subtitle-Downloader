// ==UserScript==
// @name         Udemy 字幕下载 | Udemy Subtitle Downloader v1
// @version      1
// @description  下载 Udemy 的字幕 | Download Udemy Subtitle as .srt file
// @author       Zheng Cheng
// @match        https://www.udemy.com/course/*
// @run-at       document-end
// @grant        unsafeWindow
// ==/UserScript==

// 状态：半完成。最核心的获取字幕的方法已经搞定了。
// 构造出一个合适的  url, 请求头里带上 accss_token 
// 就可以拿到数据。
// 现在就剩下往页面上加按钮，
// 一个按钮点击下载当前视频的字幕(.vtt)
// 一个按钮下载这一整门课的字幕。（多个.vtt）
// 可能再加一个按钮，下载当前视频(.mp4)

// 写于2021-3-2
// 优点
// 1. 使用门槛比 udemy-dl 更低 （可以在页面上直接点按钮下载，不需要用命令行）
// 2. 方便，点击既下载

(function () {
  'use strict';

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  // copy from: https://gist.github.com/danallison/3ec9d5314788b337b682
  // Example downloadString(srt, "text/plain", filename);
  function downloadString(text, fileType, fileName) {
    var blob = new Blob([text], {
      type: fileType
    });
    var a = document.createElement('a');
    a.download = fileName;
    a.href = URL.createObjectURL(blob);
    a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
    }, 11500);
  }

  // 获得参数
  function get_args() {
    var ud_app_loader = document.querySelector('.ud-app-loader')
    var args = ud_app_loader.dataset.moduleArgs
    var json = JSON.parse(args)
    return json
  }

  // 获得课程 id
  function get_args_course_id() {
    var json = get_args()
    return json.courseId
  }

  // 获得这一节的 id
  function get_args_lecture_id() {
    var json = get_args()
    return json.initialCurriculumItemId
  }

  // 返回 Cookie 里指定名字的值
  // https://stackoverflow.com/questions/5639346/what-is-the-shortest-function-for-reading-a-cookie-by-name-in-javascript
  function getCookie(name) {
    return (document.cookie.match('(?:^|;)\\s*' + name.trim() + '\\s*=\\s*([^;]*?)\\s*(?:;|$)') || [])[1];
  }

  // 单个视频的数据 URL
  // 可以传参数也可以不传，不传就当做取当前视频的
  function get_lecture_data_url(param_course_id = null, param_lecture_id = null) {
    // var course_id = '3681012'
    // var lecture_id = '23665120'
    // var example_url = `https://www.udemy.com/api-2.0/users/me/subscribed-courses/3681012/lectures/23665120/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls`
    var course_id = param_course_id || get_args_course_id()
    var lecture_id = param_lecture_id || get_args_lecture_id()
    var url = `https://www.udemy.com/api-2.0/users/me/subscribed-courses/${course_id}/lectures/${lecture_id}/?fields[lecture]=asset,description,download_url,is_free,last_watched_second&fields[asset]=asset_type,length,media_license_token,media_sources,captions,thumbnail_sprite,slides,slide_urls,download_urls`
    return url
  }


  // 一整门课的数据 URL
  function get_course_data_url() {
    var course_id = get_args_course_id()
    // var example_url = "https://www.udemy.com/api-2.0/courses/3681012/subscriber-curriculum-items/?page_size=1400&fields[lecture]=title,object_index,is_published,sort_order,created,asset,supplementary_assets,is_free&fields[quiz]=title,object_index,is_published,sort_order,type&fields[practice]=title,object_index,is_published,sort_order&fields[chapter]=title,object_index,is_published,sort_order&fields[asset]=title,filename,asset_type,status,time_estimation,is_external&caching_intent=True"
    var url = `https://www.udemy.com/api-2.0/courses/${course_id}/subscriber-curriculum-items/?page_size=1400&fields[lecture]=title,object_index,is_published,sort_order,created,asset,supplementary_assets,is_free&fields[quiz]=title,object_index,is_published,sort_order,type&fields[practice]=title,object_index,is_published,sort_order&fields[chapter]=title,object_index,is_published,sort_order&fields[asset]=title,filename,asset_type,status,time_estimation,is_external&caching_intent=True`
    return url
  }

  // 获得一节的数据
  function get_lecture_data(course_id = null, lecture_id = null) {
    return new Promise((resolve, reject) => {
      var access_token = getCookie("access_token")
      var bearer_token = `Bearer ${access_token}`
      fetch(get_lecture_data_url(course_id, lecture_id), {
          headers: {
            'x-udemy-authorization': bearer_token,
            'authorization': bearer_token,
          }
        })
        .then(response => response.json())
        .then(data => {
          resolve(data);
        }).catch(e => {
          reject(e);
        })
    })
  }

  // 获得一整门课的数据
  function get_course_data() {
    return new Promise((resolve, reject) => {
      var access_token = getCookie("access_token")
      var bearer_token = `Bearer ${access_token}`
      fetch(get_course_data_url(), {
          headers: {
            'x-udemy-authorization': bearer_token,
            'authorization': bearer_token,
          }
        })
        .then(response => response.json())
        .then(data => {
          // console.log(data);
          // var captions_array = data.asset.captions;
          // console.log(cations_array);
          resolve(data);
        }).catch(e => {
          reject(e);
        })
    })
  }

  // 转换成安全的文件名
  function safe_filename(string) {
    var s = string
    s = s.replace(':', '-')
    s = s.replace('\'', ' ')
    return s
  }

  // 输入 id
  // 返回那节课的标题
  // await get_lecture_title_by_id(id)
  async function get_lecture_title_by_id(id) {
    var data = await get_course_data()
    var array = data.results;
    for (let i = 0; i < array.length; i++) {
      const r = array[i];
      if (r._class == 'lecture' && r.id == id) {
        var name = `${r.object_index}. ${r.title}`
        return name;
      }
    }
  }

  // 下载当前这一节视频的字幕
  // 如何调用: await parse_lecture_data();
  // 会下载得到一个 .vtt 字幕
  async function parse_lecture_data(course_id = null, lecture_id = null) {
    var data = await get_lecture_data(course_id, lecture_id) // 获得当前这一节的数据
    var lecture_id = data.id; // 获得这一节的 id
    var lecture_title = await get_lecture_title_by_id(lecture_id) // 根据 id 找到标题
    var filename = `${safe_filename(lecture_title)}.vtt` // 构造文件名

    // 遍历数组
    var array = data.asset.captions
    for (let i = 0; i < array.length; i++) {
      const caption = array[i];
      // console.log(caption)
      var url = caption.url // vtt 字幕的 URL
      // var locale_id = caption.locale_id  // locale_id: "en_US"
      // source: "auto"
      // video_label: "英语 [自动]"
      // console.log(url);
      save_vtt(url, filename); // 直接保存
    }
  }

  // 保存 vtt
  // 参数: url 是 vtt 文件的 url，访问 url 应该得到文件内容
  // filename 是要保存的文件名
  function save_vtt(url, filename) {
    fetch(url, {})
      .then(response => response.text())
      .then(data => {
        downloadString(data, "text/plain", filename);
      }).catch(e => {
        console.log(e);
      })
  }

  function main() {
    // TODO:
    // 单节字幕下载 [x]
    // 一整门课字幕下载 []
    // 下载成 srt []
    // 页面上有按钮可点击下载 []
    inject_our_script()
  }

  async function inject_our_script() {
    var div = document.createElement('div');
    var button1 = document.createElement('button'); // 下载本集的字幕(1个 .vtt 文件)
    var button2 = document.createElement('button'); // 下载整门课程的字幕 (多个 .vtt 文件)
    var button3 = document.createElement('button'); // 下载本集视频
    var title_element = document.querySelector('a[data-purpose="course-header-title"]')

    var button1_css = `
      font-size: 14px;
      padding: 1px 12px;
      border-radius: 4px;
      border: none;
      color: black;
    `;

    var button2_css = `
      font-size: 14px;
      padding: 1px 12px;
      border-radius: 4px;
      border: none;
      color: black;
      margin-left: 8px;
    `;

    var div_css = `
      margin-bottom: 10px;
    `;

    button1.setAttribute('style', button1_css);
    button1.textContent = "下载本集字幕"
    button1.addEventListener('click', download_lecture_subtitle);

    button2.setAttribute('style', button2_css);
    button2.textContent = "下载整门课程的字幕(多个文件)"
    button2.addEventListener('click', download_course_subtitle);

    button3.setAttribute('style', button2_css);
    button3.textContent = "下载本集视频"
    button3.addEventListener('click', download_lecture_video);

    div.setAttribute('style', div_css);
    div.appendChild(button1);
    div.appendChild(button2);
    div.appendChild(button3);

    insertAfter(div, title_element);
  }

  async function download_lecture_subtitle() {
    await parse_lecture_data();
  }

  async function download_course_subtitle() {
    var course_id = get_args_course_id();
    var data = await get_course_data()
    var array = data.results;
    for (let i = 0; i < array.length; i++) {
      const result = array[i];
      if (result._class == 'lecture') {
        var lecture_id = result.id;
        await parse_lecture_data(course_id, lecture_id)
        await sleep(800);
      }
    }
  }

  async function download_lecture_video() {
    var data = await get_lecture_data() // 获得当前这一节的数据
    var lecture_id = data.id; // 获得这一节的 id
    var lecture_title = await get_lecture_title_by_id(lecture_id) // 根据 id 找到标题

    var highest_resolution = data.asset.media_sources[0]
    var url = highest_resolution.src // "https://mp4-a.udemycdn.com/2020-12-04_12-48-10-150cfde997c5ba9f05e5e7d86c813db3/1/WebHD_720p.mp4?XquxJGAXiyTc17qxb6iyah_9GXvjHC43UK98UHC3LUkZk7q9yPPll-BJ-5RKz--T9ucjtKOES68m_rZ6vzDZkyEROWwuaoHGFsr3DDuN0AWwk3RpjEo-JNfp98iIaEd_0Vfk0te375rNGtvtCnXibgcZmxDOx4tI5jqFKkl5hVDnwVE7"
    var resolution = highest_resolution.label // 720 or 1080
    var filename = `${safe_filename(lecture_title)}_${resolution}.mp4` // 构造文件名

    console.log(url);
    console.log(filename);

    fetch(url)
      .then(res => res.blob())
      .then(blob => {
        downloadString(blob, "video/mp4", filename);
      });
  }

  setTimeout(main, 2000);

})();