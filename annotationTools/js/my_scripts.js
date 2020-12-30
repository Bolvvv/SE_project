//尽可能将该文件最小化和抽象化。
//最好不要向该文件添加新的变量/函数。

//获取鼠标事件的x位置
function GetEventPosX(event) {
  if(IsNetscape()) return event.layerX;
  return event.offsetX;
}

//获取鼠标事件的y位置
function GetEventPosY(event) {
  if(IsNetscape()) return event.layerY;
  return event.offsetY;
}

function RemoveSpecialChars(str) {
  var re = /\$|@|#|~|`|\%|\*|\^|\&|\+|\=|\[|\]|\}|\{|\;|\:|\'|\"|\<|\>|\?|\||\\|\!|\$/g;
  console.log("18"+str);
  var aux = str.replace(re,"_");
  aux =  aux.replace(/\s+/g,' ');
  aux = aux.toLowerCase();
  aux = aux.trim();
  aux = aux.replace(/ +(?= )/g,'');
  return aux;
}

function WaitForInput() {
  alert("Need to enter object name.");
}

//如果用户名为“匿名”，则返回true。
function IsUserAnonymous() {
  return (username=='anonymous');
}

function IsUserAdmin() {
  var is_admin = false;
  var folder = main_media.GetFileInfo().GetDirName();
  var idx = folder.indexOf('/');
  if((idx != -1) && (folder.substring(0,idx)=='users')) {
    folder = folder.substring(idx+1,folder.length);
    idx = folder.indexOf('/');
    if((idx != -1) && (folder.substring(0,idx)==username)) is_admin = true;
  }
  return (username=='admin') | (username=='mtsupervisor') | is_admin | ((username.indexOf('submitted')!=-1)&(username==folder));
}

function IsCreator(u) {
  return (username==u);
}


function WriteLogMsg(msg) {
  var url = 'annotationTools/perl/write_logfile.cgi';
  var req_submit;
  //原生XMLHttpRequest对象分支
  if (window.XMLHttpRequest) {
    req_submit = new XMLHttpRequest();
    req_submit.open("POST", url, true);
    req_submit.send(msg);
  } 
  else if (window.ActiveXObject) {
    req_submit = new ActiveXObject("Microsoft.XMLHTTP");
    if (req_submit) {
      req_submit.open("POST", url, true);
      req_submit.send(msg);
    }
  }
}

//当用户点击“下一张图片”按钮时，会调用该函数。
function ShowPrevImage() {
  if(wait_for_input) return WaitForInput();
  if(draw_anno) {
    alert("Need to close current polygon first.");
    return;
  }

  RemoveObjectList();
  if (video_mode) main_media.GetFileInfo().SetURL(document.URL);
  else {
    main_media.GetFileInfo().FetchPrevImage();
    LoadNewMedia();
  }
}
function ShowNextImage() {
  if(wait_for_input) return WaitForInput();
  if(draw_anno) {
    alert("Need to close current polygon first.");
    return;
  }
  

  
  RemoveObjectList();

  
  if (video_mode) main_media.GetFileInfo().SetURL(document.URL);
  else {
    main_media.GetFileInfo().FetchImage();
    LoadNewMedia();
  }
}

function InsertServerLogData(modifiedControlPoints) {
  var old_pri = LM_xml.getElementsByTagName("private");
  for(ii=0;ii<old_pri.length;ii++) {
    old_pri[ii].parentNode.removeChild(old_pri[ii]);
  }
  var video_mode_num = 0;
  if (video_mode) video_mode_num = 1;
  
  var elt_pri = LM_xml.createElement("private");
  var elt_gct = LM_xml.createElement("global_count");
  var elt_user = LM_xml.createElement("pri_username");
  var elt_edt = LM_xml.createElement("edited");
  var elt_onm = LM_xml.createElement("old_name");
  var elt_nnm = LM_xml.createElement("new_name");
  var elt_mcp = LM_xml.createElement("modified_cpts");
  var elt_vid = LM_xml.createElement("video");
  var txt_gct = LM_xml.createTextNode(global_count);
  var txt_user = LM_xml.createTextNode(username);
  var txt_edt = LM_xml.createTextNode(submission_edited);
  var txt_onm = LM_xml.createTextNode(old_name);
  var txt_nnm = LM_xml.createTextNode(new_name);
  var txt_mcp = LM_xml.createTextNode(modifiedControlPoints);
  var txt_pri = LM_xml.createTextNode(ref);
  var txt_vid = LM_xml.createTextNode(video_mode_num);


  LM_xml.documentElement.appendChild(elt_pri);
  elt_pri.appendChild(elt_gct);
  elt_pri.appendChild(elt_user);
  elt_pri.appendChild(elt_edt);
  elt_pri.appendChild(elt_onm);
  elt_pri.appendChild(elt_nnm);
  elt_pri.appendChild(elt_mcp);
  elt_pri.appendChild(elt_vid);
  elt_pri.appendChild(txt_pri);
  
  elt_gct.appendChild(txt_gct);
  elt_user.appendChild(txt_user);
  elt_edt.appendChild(txt_edt);
  elt_onm.appendChild(txt_onm);
  elt_nnm.appendChild(txt_nnm);
  elt_mcp.appendChild(txt_mcp);
  elt_vid.appendChild(txt_vid);
}

function PermissionError() {
  var m = main_media.GetFileInfo().GetMode();
  if((m=='im') || (m=='mt')) {
    alert('This polygon was entered by another user.  You can only modify polygons that you have entered.');
  }
  else {
    alert('This polygon was entered by another user.  You can only modify polygons that you have entered.  Do not forget to sign in if you want to be able to edit your annotations');
  }
}

function GetTimeStamp() {
  var url = 'annotationTools/perl/get_timestamp.cgi';
  
  if (window.XMLHttpRequest) {
    req_anno = new XMLHttpRequest();
    req_anno.open("POST", url, false);
    req_anno.send();
  } 
  else if (window.ActiveXObject) {
    req_anno = new ActiveXObject("Microsoft.XMLHTTP");
    if (req_anno) {
      req_anno.open("POST", url, false);
      req_anno.send();
    }
  }

  if(req_anno.status==200) return req_anno.responseText;
  return '';
}



function SetObjectChoicesPointLine(num_control_points) {
  var isPoint = 0;
  if((num_control_points==1) && (object_choices=='...')) {
    object_choices = 'point';
    object_choices = object_choices.split(/,/);
    isPoint = 1;
  }
  var isLine = 0;
  if((num_control_points==2) && (object_choices=='...')) {
    object_choices = 'line,horizon line';
    object_choices = object_choices.split(/,/);
    isLine = 1;
  }
  
  return (isPoint || isLine);
}

//如果点(x，y)接近多边形p，则返回TRUE。
function IsNearPolygon(x,y,p) {
  var sx = x / main_media.GetImRatio();
  var sy = y / main_media.GetImRatio();
  
  var anid = main_canvas.GetAnnoIndex(p);
  var pt = main_canvas.annotations[anid].ClosestPoint(sx,sy);
  var minDist = pt[2];
  
  //这是多边形轮廓周围的敏感区
  //另外，当您将鼠标移到敏感区上时，该区域
  //变得更大，这样你就不会意外地离开它。
  var buffer = 5;
  if(selected_poly != -1) buffer = 13;
  
  //注意：需要乘以im_ratio，这样敏感区在放大时并不大。
  return ((minDist*main_media.GetImRatio()) < buffer);
}
    
function selectObject(idx) {
  var anid = main_canvas.GetAnnoIndex(idx);
  if(selected_poly==idx) return;
  unselectObjects();
  selected_poly = idx;
  if(view_ObjList) ChangeLinkColorFG(idx);
  main_canvas.annotations[anid].FillPolygon();
  
  var selected_poly_parts = getPartChildrens(idx);
  for (var i=0; i<selected_poly_parts.length; i++) {
    var anid = main_canvas.GetAnnoIndex(selected_poly_parts[i]);
    if(anid >= 0 && (selected_poly_parts[i]!=selected_poly)) {
      if (main_canvas.annotations[anid].hidden) main_canvas.annotations[anid].DrawPolygon(main_media.GetImRatio(), main_canvas.annotations[anid].GetPtsX(), main_canvas.annotations[anid].GetPtsY());
      main_canvas.annotations[anid].FillPolygon();
    }
    
  }
}

//停止所选对象的填充多边形渲染：
function unselectObjects() {
  if(selected_poly == -1) return;
  var anid;

  var anid = main_canvas.GetAnnoIndex(selected_poly);
  if(view_ObjList) ChangeLinkColorBG(selected_poly);
  main_canvas.annotations[anid].UnfillPolygon();
  
  //取消选择对象部件：
  var selected_poly_parts = getPartChildrens(selected_poly);
  for (var i=0; i<selected_poly_parts.length; i++) {

    var anid = main_canvas.GetAnnoIndex(selected_poly_parts[i]);
    if(anid >= 0 && (selected_poly_parts[i]!=selected_poly)) {
      main_canvas.annotations[anid].UnfillPolygon();
      if (main_canvas.annotations[anid].hidden) main_canvas.annotations[anid].DeletePolygon();
    }

    
  }
  
  //重置SELECTED_POLY变量：
  selected_poly = -1;
}

function DeleteSelectedPolygon() {
  if(selected_poly == -1) return;
  
  if((IsUserAnonymous() || (!IsCreator(LMgetObjectField(LM_xml, selected_poly, 'username')))) && (!IsUserAdmin()) && (selected_poly<num_orig_anno) && !action_DeleteExistingObjects) {
    alert('You do not have permission to delete this polygon');
    return;
  }
  
  if(LMgetObjectField(LM_xml, selected_poly, 'verified')) {
    StartEditEvent(selected_poly,null);
    return;
  }
  
  submission_edited = 0;
  old_name = LMgetObjectField(LM_xml,main_canvas.annotations[selected_poly].anno_id,'name');
  new_name = old_name;
  
  //写入日志文件：
  WriteLogMsg('*Deleting_object');
  InsertServerLogData('cpts_not_modified');
  
  //在LM_XML中设置<Delete>：
  $(LM_xml).children("annotation").children("object").eq(selected_poly).children("deleted").text('1');
  
  //将XML写入服务器：
  WriteXML(SubmitXmlUrl,LM_xml,function(){return;});
  var ndx = selected_poly;
  
  unselectObjects();
  if(view_ObjList) RenderObjectList();
  
  //从画布中删除多边形：
  main_canvas.annotations[ndx].DeletePolygon();
}


function CheckXMLExists() {
  if(req_submit.readyState==4) {
    if(req_submit.status != 200) {
      alert("The XML annotation file does not exist yet.  Please label an object and try again");
    }
    else {
      window.open(main_media.GetFileInfo().GetAnnotationPath());
    }
  }
}

function GetXMLFile() {
  var xml_url = main_media.GetFileInfo().GetAnnotationPath();
  if (window.XMLHttpRequest) {
    req_submit = new XMLHttpRequest();
    req_submit.onreadystatechange = CheckXMLExists;
    req_submit.open("GET", xml_url, true);
    req_submit.send('');
  } 
  else if (window.ActiveXObject) {
    req_submit = new ActiveXObject("Microsoft.XMLHTTP");
    if (req_submit) {
      req_submit.onreadystatechange = CheckXMLExists;
      req_submit.open("GET", xml_url, true);
      req_submit.send('');
    }
  }
}

function transImg(){
  console.log("发起请求")
  $.ajax({
    type: "POST",
    url:"annotationTools/perl/trans_ima.cgi",
    async: false,
    success:function(result) {
      console.log("数据格式转换成功");
      alert("数据格式转换成功")
    }
  });
  console.log("产生请求")
}

function show_img_url_tree_modal(){
  $('#file_url_tree_modal').modal('show');
}
