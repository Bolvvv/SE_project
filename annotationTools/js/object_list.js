//这里是在Labelme工具右侧构建对象列表的所有代码。
//此工具的样式定义在：注解工具/css/object_list.css中


var IsHidingAllPolygons = false;
var ListOffSet = 0;

//该函数创建并填充列表
function RenderObjectList() {
  //如果Object List已经渲染，则将其移除：
  var scrollPos = $("#anno_list").scrollTop();
  if($('#anno_list').length) {
    $('#anno_list').remove();
  }

  var html_str = '<div class="object_list" id="anno_list" style="border:0px solid black;z-index:0;" ondrop="drop(event, -1)" ondragenter="return dragEnter(event)" ondragover="return dragOver(event)">';
  
  var Npolygons = LMnumberOfObjects(LM_xml);
  var NundeletedPolygons = 0;
  for(var ii=0; ii < Npolygons; ii++) {
    if(!parseInt(LMgetObjectField(LM_xml,ii,'deleted'))) {
      NundeletedPolygons++;
    }
  }
  
  
  var tree = getPartsTree();
  
  
  if (showImgName) {html_str += '<p><b>Image name: '+ imgName +'</b></p>';}
  html_str += '<b>本张图片的多边形 ('+ NundeletedPolygons +')</b>';
  html_str += '<p style="font-size:10px;line-height:100%"><a ' +
  'onmouseover="main_canvas.ShadePolygons();" ' +
  'onmouseout="main_canvas.RenderAnnotations();"> 显示未标注的图形 </a></p>';
  
  if(IsHidingAllPolygons) {
    html_str += '<p style="font-size:10px;line-height:100%"><a id="show_all_button" href="javascript:ShowAllPolygons();">展示所有多边形</a></p>';
  }
  else {
    IsHidingAllPolygons = false;
    html_str += '<p style="font-size:10px;line-height:100%"><a id="hide_all_button" href="javascript:HideAllPolygons();">隐藏所有多边形</a></p>';
  }

  
  if(use_parts) {
    html_str += '<p style="font-size:10px;line-height:100%" ondrop="drop(event, -1)" ondragenter="return dragEnter(event)" ondragover="return dragOver(event)">将标签拖到另一个标签上以创建部分关系。</p>';
  }
  html_str += '<ol>';
  
  
  for(var i=0; i < Npolygons; i++) {
    
    if(use_parts) {
      var ii = tree[0][i];
      var level = tree[1][i];
    }
    else {
      var ii = i;
      var level = 0;
    }
    
    var isDeleted = parseInt(LMgetObjectField(LM_xml,ii,'deleted'));
    var is_currently_shown = true;
    
    if(is_currently_shown && (((ii<num_orig_anno)&&((view_Existing&&!isDeleted)||(isDeleted&&view_Deleted))) || ((ii>=num_orig_anno)&&(!isDeleted||(isDeleted&&view_Deleted))))) {
      
      
      html_str += '<div class="objectListLink" id="LinkAnchor' + ii + '" style="z-index:1; margin-left:'+ (level*1.5) +'em" ';
      
      if (use_parts) {
	
	html_str += 'draggable="true" ondragstart="drag(event, '+ii+')" '+
	  'ondragend="dragend(event, '+ii+')" '+
	  'ondrop="drop(event, '+ii+')" '+
	  'ondragenter="return dragEnter(event)" '+
	  'ondragover="return dragOver(event)">';
      }
      
      
      if(level==0) {
	
	html_str += '<li>';
      }
      else {
	
	html_str += '<li class="children_tree">';
      }
      
      
      html_str += '<a class="objectListLink"  id="Link' + ii + '" '+
	'href="javascript:main_handler.AnnotationLinkClick('+ii+');" '+
	'onmouseover="main_handler.AnnotationLinkMouseOver('+ii+');" ' +
	'onmouseout="main_handler.AnnotationLinkMouseOut();" ';
      
      if (use_parts) {
	html_str += 'ondrop="drop(event, '+ii+')" '+
	  'ondragend="dragend(event, '+ii+')" '+
	  'ondragenter="return dragEnter(event)" '+
	  'ondragover="return dragOver(event)"';
      }
      
      if(isDeleted) {
	html_str += ' style="color:#888888"><b>';
      }
      else {
	html_str += '>';
      }

      var obj_name = LMgetObjectField(LM_xml,ii,'name');
      if(obj_name.length==0 && !draw_anno) {
	html_str += '<i>[ 请输入名字 ]</i>';
      }
      else {
	html_str += obj_name;
      }
      
      if(isDeleted) html_str += '</b>';
      html_str += '</a>';

      var attributes = LMgetObjectField(LM_xml,ii,'attributes');
      if(attributes.length>0) {
	html_str += ' (' + attributes +')';
      }
      
      html_str += '</li></div>';
    }
  }
  
  html_str += '</ol><p><br/></p></div>';
  
  
  $('#anno_anchor').append(html_str);
  $('#Link'+add_parts_to).css('font-weight',700); 
  $('#anno_list').scrollTop(scrollPos);
}


function RemoveObjectList() {
  $('#anno_list').remove();
}


function ChangeLinkColorBG(idx) {
  if(document.getElementById('Link'+idx)) {
    var isDeleted = parseInt($(LM_xml).children("annotation").children("object").eq(idx).children("deleted").text());
    if(isDeleted) document.getElementById('Link'+idx).style.color = '#888888';
    else document.getElementById('Link'+idx).style.color = '#0000FF';
    var anid = main_canvas.GetAnnoIndex(idx);
    
    if(IsHidingAllPolygons && main_canvas.annotations[anid].hidden) {
      main_canvas.annotations[anid].DeletePolygon();
    }
  }
}


function ChangeLinkColorFG(idx) {
  document.getElementById('Link'+idx).style.color = '#FF0000';
  var anid = main_canvas.GetAnnoIndex(idx);
  
  if(IsHidingAllPolygons && main_canvas.annotations[anid].hidden) {
    main_canvas.annotations[anid].DrawPolygon(main_media.GetImRatio(), main_canvas.annotations[anid].GetPtsX(), main_canvas.annotations[anid].GetPtsY());
  }
}

function HideAllPolygons() {
  if(!edit_popup_open) {
    
    IsHidingAllPolygons = true;
    
    
    for(var i = 0; i < main_canvas.annotations.length; i++) {
      main_canvas.annotations[i].DeletePolygon();
      main_canvas.annotations[i].hidden = true;
    }
    
    
    $('#hide_all_button').replaceWith('<a id="show_all_button" href="javascript:ShowAllPolygons();">显示所有多边形</a>');
  }
  else {
    alert('Close edit popup bubble first');
  }
}

function ShowAllPolygons() {
  
  IsHidingAllPolygons = false;

  
  main_canvas.UnhideAllAnnotations();
  main_canvas.RenderAnnotations();

  
  $('#show_all_button').replaceWith('<a id="hide_all_button" href="javascript:HideAllPolygons();">隐藏所有多边形</a>');
}







function drag(event, part_id) {
  
  event.dataTransfer.setData("Text", part_id);
}

function dragend(event, object_id) {
  event.preventDefault();
  
  
  WriteXML(SubmitXmlUrl,LM_xml,function(){return;});
}

function dragEnter(event) {
  event.preventDefault();
  return true;
}

function dragOver(event) {
  event.preventDefault();
}

function drop(event, object_id) {
  event.preventDefault();
  var part_id=event.dataTransfer.getData("Text");
  event.stopPropagation();
  
  
  if(object_id!=part_id) {
    addPart(object_id, part_id);
    
    
    RenderObjectList();
  }
}
