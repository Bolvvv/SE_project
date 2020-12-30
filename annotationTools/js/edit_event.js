/**@file此文件包含激活编辑事件时的脚本。*/

var select_anno = null;
var adjust_event = null;
function StartEditEvent(anno_id,event) {
  
  console.log('LabelMe: Starting edit event...');
  
  if (add_parts_to != null){
    $('#Link'+add_parts_to).css('font-weight',400)
    add_parts_to = null;
  }
  if (video_mode) oVP.Pause();
  if(event) event.stopPropagation();
  if((IsUserAnonymous() || (!IsCreator(LMgetObjectField(LM_xml, anno_id, 'username')))) && (!IsUserAdmin()) && (anno_id<num_orig_anno) && !action_RenameExistingObjects && !action_ModifyControlExistingObjects && !action_DeleteExistingObjects) {
    PermissionError();
    return;
  }
  active_canvas = SELECTED_CANVAS;
  edit_popup_open = 1;
  
  //关闭自动标志，写入XML文件：
  if(LMgetObjectField(LM_xml, anno_id, 'automatic')) {
    //插入服务器日志文件数据：
    var anid = main_canvas.GetAnnoIndex(anno_id);
    old_name = LMgetObjectField(LM_xml,main_canvas.annotations[anid].anno_id,'name');
    new_name = old_name;
    InsertServerLogData('cpts_not_modified');
    
    //在XML中设置<Automatic>：
    LMsetObjectField(LM_xml, anno_id, 'automatic', '0');
    
    //将XML写入服务器：
    WriteXML(SubmitXmlUrl,LM_xml,function(){return;});
  }
  
 //将select_canvas前移：
  $('#select_canvas').css('z-index','0');
  $('#select_canvas_div').css('z-index','0');
  
  var anno = main_canvas.DetachAnnotation(anno_id);
  
  editedControlPoints = 0;
    
  if(username_flag) submit_username();
  
  select_anno = anno;
  select_anno.SetDivAttach('select_canvas');
  var pt_x, pt_y;
  if (video_mode){
    pt_x = LMgetObjectField(LM_xml,select_anno.anno_id,'x', oVP.getcurrentFrame());
    pt_y = LMgetObjectField(LM_xml,select_anno.anno_id,'y', oVP.getcurrentFrame());
  }
  else {
    pt_x = select_anno.GetPtsX();
    pt_y = select_anno.GetPtsY();
  }
  FillPolygon(select_anno.DrawPolygon(main_media.GetImRatio(),pt_x,pt_y));
  
 //获取弹出泡沫的出现位置：
  var pt = main_media.SlideWindow(Math.round(pt_x[0]*main_media.GetImRatio()),Math.round(pt_y[0]*main_media.GetImRatio()));

 //弹出编辑窗口
  main_media.ScrollbarsOff();
  if(LMgetObjectField(LM_xml, anno.anno_id, 'verified')) {
    edit_popup_open = 1;
    var innerHTML = "<b>This annotation has been blocked.</b><br />";
    var dom_bubble = CreatePopupBubble(pt[0],pt[1],innerHTML,'main_section');
    CreatePopupBubbleCloseButton(dom_bubble,StopEditEvent);
  }
  else {
    //设置点和线的对象列表选项：
    var doReset = SetObjectChoicesPointLine(anno.GetPtsX().length);
    
    //弹出编辑泡沫：
    WriteLogMsg('*Opened_Edit_Popup');
    mkEditPopup(pt[0],pt[1],anno);
    
    //如果批注是点或线，则
    if(doReset) object_choices = '...';
  }
}

/**该函数在编辑事件完成时调用。它可以是
*当用户(1)点击关闭编辑泡沫按钮时触发，
*(2)缩放，(3)在弹出泡沫中提交对象标签，
*(4)按弹出泡沫中的DELETE按钮，(5)点击
*对象列表中的对象，(6)按Esc键。
*/
function StopEditEvent() {
  

  active_canvas = REST_CANVAS;
  edit_popup_open = 0;
  
  $('#select_canvas').css('z-index','-2');
  $('#select_canvas_div').css('z-index','-2');
  
  
  if (!video_mode) select_anno.DeletePolygon();
  else $('#'+select_anno.polygon_id).remove();
  var anno = select_anno;
  select_anno = null;

  
  WriteLogMsg('*Closed_Edit_Popup');

  
  CloseEditPopup();
  
  main_media.ScrollbarsOn();

  
  
  if(!LMgetObjectField(LM_xml, anno.anno_id, 'deleted') || view_Deleted) {
    
    main_canvas.AttachAnnotation(anno);
    if(!anno.hidden) {
      anno.RenderAnnotation('rest');
    }
    if (video_mode){
      oVP.DisplayFrame(oVP.getcurrentFrame());
    }
  }

  
  if(view_ObjList) {
    RenderObjectList();
  }
  console.log('LabelMe: Stopped edit event.');
}

var adjust_objEnter = '';
var adjust_attributes;
var adjust_occluded;


function AdjustPolygonButton() {
  
  
  
  
  var anno = select_anno;

  
  old_name = LMgetObjectField(LM_xml,anno.anno_id,'name');
  if(document.getElementById('objEnter')) new_name = RemoveSpecialChars(document.getElementById('objEnter').value);
  else new_name = RemoveSpecialChars(adjust_objEnter);
  
  var re = /[a-zA-Z0-9]/;
  if(!re.test(new_name)) {
    alert('Please enter an object name');
    return;
  }
  adjust_objEnter = document.getElementById('objEnter').value;
  if (use_attributes){
	  adjust_attributes = document.getElementById('attributes').value;
	  adjust_occluded = document.getElementById('occluded').value;
  }
  
  CloseEditPopup();

  
  main_media.ScrollbarsOn();
  
  

  
  $('#'+anno.polygon_id).parent().remove();

  
  SetDrawingMode(0);

  
  var frame = null;
  if (video_mode) frame = oVP.getcurrentFrame();
  adjust_event = new AdjustEvent('select_canvas',LMgetObjectField(LM_xml,anno.anno_id,'x', frame),LMgetObjectField(LM_xml,anno.anno_id,'y', frame),
    LMgetObjectField(LM_xml,anno.anno_id,'name'),function(x,y,_editedControlPoints) {
      
      if(username_flag) submit_username();

      
      anno.RenderAnnotation('rest');
      
      
      if (!video_mode){
        LMsetObjectField(LM_xml, anno.anno_id, 'x', x);
        LMsetObjectField(LM_xml, anno.anno_id, 'y', y);
      }
      else {
        var slidervalues = $('#oTempBar').slider("option", "values");
        if (oVP.getcurrentFrame() >= slidervalues[0] && oVP.getcurrentFrame() <= slidervalues[1]){   
          main_media.UpdateObjectPosition(anno, x, y);
        }
      }
      

      
      editedControlPoints = _editedControlPoints;
      
      

      if (video_mode) main_media.SubmitEditObject();
      else main_handler.SubmitEditLabel();
      adjust_event = null;
    },main_media.GetImRatio(), (LMgetObjectField(LM_xml, anno.anno_id, 'type') == 'bounding_box'));

  
  adjust_event.StartEvent();
}

