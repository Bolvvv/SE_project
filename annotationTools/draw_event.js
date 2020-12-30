var draw_anno = null;
var query_anno = null;
/**此函数在Draw事件启动时调用。它可以是当用户(%1)单击基础画布时触发。*/
function StartDrawEvent(event) {
  draw_x = new Array();
  draw_y = new Array();
  if(!action_CreatePolygon) return;
  if(active_canvas != REST_CANVAS) return;  
  console.log('LabelMe: Starting draw event...');
  if(IsHidingAllPolygons) {
    for(var i = 0; i < main_canvas.annotations.length; i++) {
      main_canvas.annotations[i].hidden = true;
      main_canvas.annotations[i].DeletePolygon();
    }
  }
  if (video_mode) $('#myCanvas_bg').css('opacity', 0.5);
  active_canvas = DRAW_CANVAS;
  if (video_mode) oVP.Pause();
  var x = GetEventPosX(event);
  var y = GetEventPosY(event);
  var button = event.button;
  if(button>1) return;
  $('#draw_canvas').css('z-index','0');
  $('#draw_canvas_div').css('z-index','0'); 
  if(username_flag) submit_username();
  var numItems = $(LM_xml).children('annotation').children('object').length;
  draw_anno = new annotation(numItems);
  draw_x.push(Math.round(x/main_media.GetImRatio()));
  draw_y.push(Math.round(y/main_media.GetImRatio()));
  draw_anno.SetDivAttach('draw_canvas');
  draw_anno.DrawPolyLine(draw_x, draw_y);
  $('#draw_canvas_div').unbind();
  $('#draw_canvas_div').mousedown({obj: this},function(e) {
      return DrawCanvasMouseDown(e.originalEvent);
    });
  if (bounding_box){
    draw_anno.bounding_box = true;  
    $('#draw_canvas_div').mousemove({obj: this},function(e) {
      return DrawCanvasMouseMove(e.originalEvent);
    });
    
  }

  WriteLogMsg('*start_polygon');
}

function DrawCanvasMouseMove(event){
  if (event.target.id != "draw_canvas") return;
  draw_anno.DeletePolygon();
  var xb = GetEventPosX(event);
  var yb = GetEventPosY(event);
  console.log(xb,yb);
  var scale = main_media.GetImRatio();
  var xarr = [draw_x[0], Math.round(xb/scale), Math.round(xb/scale), draw_x[0], draw_x[0]];
  var yarr = [draw_y[0],draw_y[0], Math.round(yb/scale), Math.round(yb/scale), draw_y[0]];
  draw_anno.DrawPolyLine(xarr, yarr);
}
function DrawCanvasMouseDown(event) {
  if(event.button > 1 && !bounding_box) return DrawCanvasClosePolygon();
  if(active_canvas!=DRAW_CANVAS) return;
  if(username_flag) submit_username();
  var scale = main_media.GetImRatio();
  var x = Math.round(GetEventPosX(event)/scale);
  var y = Math.round(GetEventPosY(event)/scale);
  if (bounding_box){
    $('#draw_canvas').find("a").remove();
    draw_x.push(x);
    draw_y.push(draw_y[0]);
    draw_x.push(x);
    draw_y.push(y);
    draw_x.push(draw_x[0]);
    draw_y.push(y);
    $('#draw_canvas_div').unbind("mousemove");
    DrawCanvasClosePolygon();
    return;
  } 
  else {
    draw_x.push(x);
    draw_y.push(y);
  }
  if(!draw_anno.line_ids) draw_anno.line_ids = Array();
  var line_idx = draw_anno.line_ids.length;
  var n = draw_x.length-1;
  draw_anno.line_ids.push(DrawLineSegment(draw_anno.div_attach,draw_x[n-1],draw_y[n-1],draw_x[n],draw_y[n],'stroke="#0000ff" stroke-width="4"',scale));
  $('#'+draw_anno.line_ids[line_idx]).css('cursor','crosshair');
  $('#'+draw_anno.div_attach).append($('#'+draw_anno.point_id));
}    
function DrawCanvasClosePolygon() {
  if(active_canvas!=DRAW_CANVAS) return;
  if(username_flag) submit_username();
  if((object_choices!='...') && (object_choices.length==1)) {
    main_handler.SubmitQuery();
    StopDrawEvent();
    return;
  }
  active_canvas = QUERY_CANVAS;
  document.getElementById('draw_canvas').style.zIndex = -2;
  document.getElementById('draw_canvas_div').style.zIndex = -2;
  var anno = null;
  if(draw_anno) {
    console.log(draw_anno.first_point)
    draw_anno.DeletePolygon();
    anno = draw_anno;
    draw_anno = null;
  }
  document.getElementById('query_canvas').style.zIndex = 0;
  document.getElementById('query_canvas_div').style.zIndex = 0;
  var doReset = SetObjectChoicesPointLine(draw_x.length);
  var pt = main_media.SlideWindow(Math.round(draw_x[0]*main_media.GetImRatio()),Math.round(draw_y[0]*main_media.GetImRatio()));
  main_media.ScrollbarsOff();
  WriteLogMsg('*What_is_this_object_query');
  if (video_mode){
    var html_str = "<b>Enter object name</b><br />";
    html_str += HTMLobjectBox("");
    
    if(use_attributes) {
      html_str += HTMLoccludedBox("");
      html_str += "<b>Enter attributes</b><br />";
      html_str += HTMLattributesBox("");
    }
    if(use_parts) {
      html_str += HTMLpartsBox("");
    }
    html_str += "<br />";
  
    
    html_str += '<input type="button" value="Done" title="Press this button after you have provided all the information you want about the object." onclick="main_media.SubmitObject();" tabindex="0" />';
  
    
    if (!bounding_box) html_str += '<input type="button" value="Undo close" title="Press this button if you accidentally closed the polygon. You can continue adding control points." onclick="UndoCloseButton();" tabindex="0" />';
  
    
    html_str += '<input type="button" value="Delete" title="Press this button if you wish to delete the polygon." onclick="main_handler.WhatIsThisObjectDeleteButton();" tabindex="0" />';
    


    wait_for_input = 1;
    CreatePopupBubble(pt[0],pt[1], html_str, 'main_section');
  } 
  else mkPopup(pt[0],pt[1]);
  
  
  if(doReset) object_choices = '...';
  
  
  query_anno = anno;
  query_anno.SetDivAttach('query_canvas');
  FillPolygon(query_anno.DrawPolygon(main_media.GetImRatio(), draw_x, draw_y));
}

/**当用户按下撤消关闭按钮以响应“这是什么东西？”弹出式泡沫。*/
function UndoCloseButton() {
  active_canvas = DRAW_CANVAS;
  document.getElementById('query_canvas').style.zIndex = -2;
  document.getElementById('query_canvas_div').style.zIndex = -2;
  query_anno.DeletePolygon();
  var anno = query_anno;
  query_anno = null;
  CloseQueryPopup();
  main_media.ScrollbarsOn();
  document.getElementById('draw_canvas').style.zIndex = 0;
  document.getElementById('draw_canvas_div').style.zIndex = 0;

  
  draw_anno = anno;
  draw_anno.SetDivAttach('draw_canvas');
  draw_anno.DrawPolyLine(draw_x, draw_y);
}

/**此函数在绘制事件完成时调用。它可以是当用户(1)关闭面并且只有一个选项为时触发在下拉列表中有效(2)删除最后一个控制点。*/
function StopDrawEvent() {
  
  active_canvas = REST_CANVAS;
  if (video_mode) oVP.Play();
  
  $('#draw_canvas').css('z-index','-2');
  $('#draw_canvas_div').css('z-index','-2');

  
  if(draw_anno) {
    draw_anno.DeletePolygon();
    draw_anno = null;
  }

  if (video_mode) $('#myCanvas_bg').css('opacity', 1);
  
  console.log('LabelMe: Stopped draw event.');
}
