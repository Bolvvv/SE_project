/**@file此文件包含LabelMe启动时使用的脚本。*/
/**注释工具的主要入口点。*/
function StartupLabelMe() {
  console.time('startup');

  // Check browser:
  GetBrowserInfo();

  if(IsNetscape() || (IsMicrosoft() && (bversion>=4.5)) || IsSafari() || IsChrome()) {

    if (IsNetscape()){
      $('#label_buttons_contrast').css('left', '545px');
    }
    if (IsSafari()){
      $('#label_buttons_contrast').css('left', '525px');
    }
    //写入“启动”消息：
    WriteLogMsg('*start_loading');
    console.log('LabelMe: starting up...');
    
    main_handler = new handler();
    main_canvas = new canvas('myCanvas_bg');
    main_media = new image('imcanvas');//创建新的图像类，参见image.js
    //解析输入URL如果URL未设置
    //注释文件夹或图像文件名。如果返回False，则
    //函数获取新图像并设置URL以反映
    //拉取的图片。
    if(!main_media.GetFileInfo().ParseURL()) return;
    if(video_mode) {
      $('#generic_buttons').remove();
      $.getScript("annotationTools/js/video.js", function(){
        main_media = new video('videoplayer');
        main_media.GetFileInfo().ParseURL();
        console.log("Video mode...");
        
        function main_media_onload_helper(){
          var anno_file = main_media.GetFileInfo().GetFullName();
          anno_file = 'VLMAnnotations/' + anno_file + '.xml' + '?' + Math.random();
          ReadXML(anno_file,LoadAnnotationSuccess,LoadAnnotation404);
        }
        main_media.GetNewVideo(main_media_onload_helper);
      });
    }
    else if (threed_mode){
      // 3D Code Starts here
    }
    else {
      //该函数在镜像加载后运行：
      function main_media_onload_helper() {
          //设置镜像尺寸：
          console.log('Imageloaded')
          main_media.SetImageDimensions();
          //读取XML注释文件：
          var anno_file = main_media.GetFileInfo().GetFullName();
          var file_url = anno_file;
          anno_file = 'Annotations/' + anno_file.substr(0,anno_file.length-4) + '.xml' + '?' + Math.random();
          console.log(anno_file);
          console.log("读取文件");
          ReadXML(anno_file,LoadAnnotationSuccess,LoadAnnotation404);
          main_media.GetFileInfo().PreFetchImage();
          $("#imcanvas").show();
          $("#current_img_url").text(file_url);
          //显示文件列表
          $('#filetree').jstree({
            'core': {
                'data': function(obj, callback){
                  var str;
                  $.ajax({
                    type: "POST",
                    url:"annotationTools/perl/fetch_files_url.cgi",
                    async: false,
                    success:function(result) {
                      console.log("获取文件夹列表成功");
                      str = result;
                    }
                  });
                  jsonstr = JSON.parse(str);
                  callback.call(this, jsonstr);
                }
            }
        }).bind("select_node.jstree", function (e, data) {
            var href = data.node.a_attr.href
            document.location.href = href;
        });;

        //生成模态框文件列表
        $('#file_tree_modal').jstree({
          'core': {
            'data': function (obj, callback) {
              var str;
              $.ajax({
                type: "POST",
                url: "annotationTools/perl/fetch_files_url.cgi",
                async: false,
                success: function (result) {
                  console.log("获取文件夹列表成功");
                  str = result;
                }
              });
              jsonstr = JSON.parse(str);
              callback.call(this, jsonstr);
            }
          }
        }).bind("select_node.jstree", function (e, data) {
          var href = data.node.a_attr.href
          document.location.href = href;
        });;
      };

      //获取镜像：
      main_media.GetNewImage(main_media_onload_helper);
    }
  }
  else {
    //浏览器无效，因此显示错误页
    $('body').remove();
    $('html').append('<body><p><img src="Icons/LabelMe.gif" /></p><br /><p>Sorry!  This page only works with Mozilla Firefox, Chrome, and Internet Explorer.  We may support other browsers in the future.</p><p><a href="http://www.mozilla.org">Download Mozilla Firefox?</a></p></body>');
  }
}
function LoadNewMedia(){
	
      main_canvas = new canvas('myCanvas_bg');
      function main_media_onload_helper() {
	      //设置镜像尺寸：
	       main_media.SetImageDimensions();

	      //读取XML注释文件：
	      var anno_file = main_media.GetFileInfo().GetFullName();
	      anno_file = 'Annotations/' + anno_file.substr(0,anno_file.length-4) + '.xml' + '?' + Math.random();
	      ReadXML(anno_file,LoadAnnotationSuccess,LoadAnnotation404);
	      main_media.Zoom('fitted');
	      main_media.GetFileInfo().PreFetchImage();
          };

      //获取镜像：
      main_media.GetNewImage(main_media_onload_helper);
}
/**如果批注加载成功，则调用此函数。
*@param{string}xml-关于当前文件的XML
*/
function LoadAnnotationSuccess(xml) {
  
  console.time('load success');

  //设置全局变量：
  LM_xml = xml;

  //加入时间：清华2007年01月25日下午3：33
  SetAllAnnotationsArray();

  console.time('attach main_canvas');
  //将有效批注附加到main_canvas：
  for(var pp = 0; pp < LMnumberOfObjects(LM_xml); pp++) {
    var isDeleted = LMgetObjectField(LM_xml, pp, 'deleted');
    if((view_Existing&&!isDeleted)||(isDeleted&&view_Deleted)) {
      //附加到main_canvas：
      main_canvas.AttachAnnotation(new annotation(pp));
      if (!video_mode && LMgetObjectField(LM_xml, pp, 'x') == null){
        main_canvas.annotations[main_canvas.annotations.length -1].SetType(1);
        main_canvas.annotations[main_canvas.annotations.length -1].scribble = new scribble(pp);
      }
    }
  }
  console.timeEnd('attach main_canvas');

  console.time('RenderAnnotations()');
  //渲染注释：
  main_canvas.RenderAnnotations();
  console.timeEnd('RenderAnnotations()');

  console.timeEnd('load success');

  //完成启动脚本：
 FinishStartup();
   

}

/**从LM_XML设置AllAnnotation数组*/
function SetAllAnnotationsArray() {
  var obj_elts = LM_xml.getElementsByTagName("object");
  var num_obj = obj_elts.length;
  
  num_orig_anno = num_obj;

  console.time('initialize XML');
  //初始化XML文件中的任何空标签：
  for(var pp = 0; pp < num_obj; pp++) {
    var curr_obj = $(LM_xml).children("annotation").children("object").eq(pp);

    //如果XML文件中为空，则初始化Object Name：
    if(curr_obj.children("name").length == 0) LMsetObjectField(LM_xml, pp, "name","");

    //设置Object ID：
    LMsetObjectField(LM_xml, pp, "id", pp.toString());
    if(curr_obj.children("polygon").length == 0) { // Segmentation
      if(curr_obj.children("segm").children("username").length == 0) {
        curr_obj.children("segm").append($("<username>anonymous</username>"));
      }
    }
    else if(curr_obj.children("polygon").children("username").length == 0) curr_obj.children("polygon").append($("<username>anonymous</username>"));
  }
  console.timeEnd('initialize XML');

  console.time('addPartFields()');
  //添加part字段(这将调用object_parts.js内部的函数)
  addPartFields(); //确保所有批注都包含所有字段。
  console.timeEnd('addPartFields()');

  console.time('loop annotated');
  
  console.timeEnd('loop annotated');
}

/**注释文件不存在，请加载模板。*/
function LoadAnnotation404(jqXHR,textStatus,errorThrown) {
  if(jqXHR.status==404) 
    ReadXML(main_media.GetFileInfo().GetTemplatePath(),LoadTemplateSuccess,LoadTemplate404);
  else if (jqXHR.status == 200){
    var resp = jqXHR.responseText;
    var NOT_SAFE_IN_XML_1_0 = /[^\x09\x0A\x0D\x20-\xFF\x85\xA0-\uD7FF\uE000-\uFDCF\uFDE0-\uFFFD]/gm;
    resp =resp.replace(/[\u001a]/gm,'');
    resp = resp.replace(NOT_SAFE_IN_XML_1_0,'');
    LoadAnnotationSuccess(jQuery.parseXML(resp));
  }
  else 
    alert(jqXHR.status);
}

/**此文件夹不存在批注模板，因此加载默认值*/
function LoadTemplate404(jqXHR,textStatus,errorThrown) {
  if(jqXHR.status==404)
    ReadXML('annotationCache/XMLTemplates/labelme.xml',LoadTemplateSuccess,function(jqXHR) {
  alert(jqXHR.status);
      });
  else
    alert(jqXHR.status);
}

/**模板加载成功后的操作
*@param{string}xml-关于当前文件的XML
*/
function LoadTemplateSuccess(xml) {
  //设置全局变量：
  LM_xml = xml;

  //设置文件夹和图像文件名：
  LM_xml.getElementsByTagName("filename")[0].firstChild.nodeValue = '\n'+main_media.GetFileInfo().GetImName()+'\n';
  LM_xml.getElementsByTagName("folder")[0].firstChild.nodeValue = '\n'+main_media.GetFileInfo().GetDirName()+'\n';

  // Set global variable:
  num_orig_anno = 0;

  
  FinishStartup();
}


function FinishStartup() {
  
  if(view_ObjList) RenderObjectList();
  if (loaded_once) return; 
  loaded_once = true;
  
  console.log('LabelMe: setting actions');
  if($('#img_url')){
    if (!video_mode) $('#img_url').attr('onclick','javascript:location.href=main_media.GetFileInfo().GetImagePath();');
    else $('#img_url').attr('onclick','javascript:location.href=main_media.GetFileInfo().GetVideoPath();');
  } 
  $('#changeuser').attr("onclick","javascript:show_enterUserNameDIV(); return false;");
  $('#userEnter').attr("onkeyup","javascript:var c; if(event.keyCode)c=event.keyCode; if(event.which)c=event.which; if(c==13 || c==27) changeAndDisplayUserName(c);");
  $('#xml_url').attr("onclick","javascript:GetXMLFile();");
  $('#transImg').attr("onclick","javascript:transImg();");
  $('#show_img_url_tree').attr("onclick","javascript:show_img_url_tree_modal();");
  $('#prevImage').attr("onclick","javascript:ShowPrevImage()");
  $('#nextImage').attr("onclick","javascript:ShowNextImage()");
  $('#lessContrast').attr("onclick","javascript:main_media.AugmentContrast()");
  $('#moreContrast').attr("onclick","javascript:main_media.ReduceContrast()");
  if (video_mode){
    $('#nextImage').attr("title", "Next Video");
    $('#img_url').attr("title", "Download Video");
  } 
  $('#zoomin').attr("onclick","javascript:main_media.Zoom(1.15)");
  $('#zoomout').attr("onclick","javascript:main_media.Zoom(1.0/1.15)");
  $('#fit').attr("onclick","javascript:main_media.Zoom('fitted')");
  $('#erase').attr("onclick","javascript:main_handler.EraseSegment()");
  $('#myCanvas_bg_div').attr("onmousedown","javascript:StartDrawEvent(event);return false;");
  $('#myCanvas_bg_div').attr("oncontextmenu","javascript:return false;");
  $('#myCanvas_bg_div').attr("onmouseover","javascript:unselectObjects();");
  $('#select_canvas_div').attr("oncontextmenu","javascript:return false;");
  $('#query_canvas_div').attr("onmousedown","javascript:event.preventDefault();WaitForInput();return false;");
  $('#query_canvas_div').attr("onmouseup","javascript:event.preventDefault();");
  $('#query_canvas_div').attr("oncontextmenu","javascript:return false;");

  
  initUserName();

  

  InitializeAnnotationTools('label_buttons_drawing','main_media');
  
  
  document.onkeyup = main_handler.KeyPress;
  
  
  ref = document.referrer;

  
  WriteLogMsg('*done_loading_' + main_media.GetFileInfo().GetImagePath());
  console.log('LabelMe: finished loading');

  console.timeEnd('startup');
}
//初始化分段工具此函数在字段被调用时调用
//url的涂鸦为true
function InitializeAnnotationTools(tag_button, tag_canvas){

    if (scribble_mode){
	 scribble_canvas = new Scribble_canvas(tag_canvas);
    }
    var html_str = '<div id= "polygonDiv" class="annotatemenu">Polygon<br></br>Tool \
        <button id="polygon" class="labelBtnDraw" type="button" title="Start Polygon" onclick="SetPolygonDrawingMode(false)" > \
        <img id="polygonModeImg" src="Icons/polygon.png"  width="28" height="38" /> \
        </button> \
        <button id="erase" class="labelBtnDraw" type="button" title="Delete last segment" onclick="main_handler.EraseSegment()" > \
        <img src="Icons/erase.png"  width="28" height="38" /> \
        </button> ';
        if (bbox_mode) html_str += ' <button id="bounding_box" class="labelBtnDraw" type="button" title="Start bounding box" onclick="SetPolygonDrawingMode(true)" > \
        <img src="Icons/bounding.png"  width="28" height="38" /> \
        </button> ';
    html_str += '</div>';

    if (!video_mode){
      var html_str2 = '<button xmlns="http://www.w3.org/1999/xhtml" id="img_url" class="labelBtn" type="button" title="Download Pack" onclick="javascript:GetPackFile();"> \
          <img src="Icons/download_all.png" height="30" /> \
          </button>';

      var html_str3 = '<form action="annotationTools/php/getpackfile.php" method="post" id="packform"> \
          <input type="hidden" id= "folder" name="folder" value="provesfinal" /> \
          <input type="hidden" id= "name" name="name" value="img2.jpg" /> \
         </form>';

      $('#tool_buttons').append(html_str3);
      $('#help').before(html_str2); 
    }
    $('#'+tag_button).append(html_str);  
    if (document.getElementById("polygon")) document.getElementById("polygon").setAttribute('style', 'background-color: #faa');
    if (document.getElementById("segmDiv")){
      document.getElementById("segmDiv").setAttribute('style', 'opacity: 1');
      document.getElementById("segmDiv").setAttribute('style', 'border-color: #000');
    }
    if (document.getElementById("polygonDiv")){
      document.getElementById("polygonDiv").setAttribute('style', 'opacity: 1');
      document.getElementById("polygonDiv").setAttribute('style', 'border-color: #f00');
    }
    if (video_mode) SetPolygonDrawingMode(true);
    
}

//在多边形和涂鸦模式之间切换。如果面处于打开状态或用户
//分段进行到一半时，会出现一条警报指明这一点。
function SetDrawingMode(mode){
    if (drawing_mode == mode || active_canvas == QUERY_CANVAS) return;
    if (mode == 0){
        if (scribble_canvas.annotationid != -1){
            alert("You can't change drawing mode while editting scribbles.");
            return;
        }

        document.getElementById("segmDiv").setAttribute('style', 'border-color: #000');
        document.getElementById("polygonDiv").setAttribute('style', 'border-color: #f00');
        scribble_canvas.scribble_image = "";
        scribble_canvas.cleanscribbles();
        scribble_canvas.CloseCanvas();
    }
    if (mode == 1) {
        if(draw_anno) {
        alert("Need to close current polygon first.");
        return;
    }
    
    document.getElementById("segmDiv").setAttribute('style', 'border-color: #f00');
    document.getElementById("polygonDiv").setAttribute('style', 'border-color: #000');
    scribble_canvas.startSegmentationMode();
    }
    drawing_mode = mode;
}

function SetPolygonDrawingMode(bounding){
  if (active_canvas == QUERY_CANVAS) return;
  if(draw_anno) {
      alert("Need to close current polygon first.");
      return;
  }
  var buttons = document.getElementsByClassName("labelBtnDraw");
  for (var i = 0; i < buttons.length; i++) buttons[i].setAttribute('style', 'background-color: #fff');
  if (!bounding) document.getElementById("polygon").setAttribute('style', 'background-color: #faa');
  else document.getElementById("bounding_box").setAttribute('style', 'background-color: #faa');
  bounding_box = bounding;
  SetDrawingMode(0);
}
