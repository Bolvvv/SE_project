//该文件包含用于绘制多边形、直线、点等的函数。
//放到SVG画布上。

//绘制所有LabelMe注释并返回DOM元素id。
function LMplot(xml,imagename) {
  //显示image：
  $('body').append('<svg id="canvas" width="2560" height="1920" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><image id="img" xlink:href="' + imagename + '" x="0" y="0" height="1920" width="2560" /></svg>');

  //显示多边形：
  var N = $(xml).children("annotation").children("object").length;
  for(var i = 0; i < N; i++) {
    var obj = $(xml).children("annotation").children("object").eq(i);
    if(!parseInt(obj.children("deleted").text())) {
      //获取Object名称：
      var name = obj.children("name").text();

      //获取积分：
      var X = Array();
      var Y = Array();
      for(var j = 0; j < obj.children("polygon").children("pt").length; j++) {
  X.push(parseInt(obj.children("polygon").children("pt").eq(j).children("x").text()));
  Y.push(parseInt(obj.children("polygon").children("pt").eq(j).children("y").text()));
      }

      //绘制多边形：
      var attr = 'fill="none" stroke="' + HashObjectColor(name) + '" stroke-width="4"';
      var scale = 1;
      DrawPolygon('canvas',X,Y,name,attr,scale);
    }
  }

  return 'canvas';
}

//绘制多边形。返回绘制多边形的DOM元素ID。
//element_id-包含要附加到的DOM元素ID的字符串。
//X-具有X坐标的数组。
//Y-具有Y坐标的数组。
//obj_name-带对象名称的字符串(如果没有名称，则为空字符串)。
//attr-包含多边形属性的字符串。
//Scale-缩放X、Y坐标的标量值(可选)。
function DrawPolygon(element_id,X,Y,obj_name,attr,scale) {
  // Create string of the points ("x1,y1 x2,y2 x3,y3 ..."):
  var poly_points = "";
  for(var i = 0; i < X.length; i++) poly_points += (scale*X[i]) + "," + (scale*Y[i]) + " ";
  
  
  var dom_id = element_id + '_obj' + $('#'+element_id).children().length + '_' + Math.floor(Math.random()*100000);

  
  $('#'+element_id).append('<a xmlns="http://www.w3.org/2000/svg"> <polygon xmlns="http://www.w3.org/2000/svg" id="' + dom_id + '" points="' + poly_points + '" ' + attr + ' /><title xmlns="http://www.w3.org/2000/svg">' + obj_name + '</title></a>');

  return dom_id;
}

//在给定一个点(X，Y)的情况下绘制一面旗帜。返回绘制的标志的DOM元素ID。
//element_id-包含要附加到的DOM元素ID的字符串。
//X-带X坐标的标量。
//Y-带Y坐标的标量。
//obj_name-带对象名称的字符串(如果没有名称，则为空字符串)。
//Scale-缩放X、Y坐标的标量值(可选)。
function DrawFlag(element_id,x,y,obj_name,scale) {
  
  x *= scale; y *= scale;

  
  x -= 12; y -= 38;
  
  
  var dom_id = element_id + '_obj' + $('#'+element_id).children().length;

  
  $('#'+element_id).append('<a xmlns="http://www.w3.org/2000/svg"><image xmlns="http://www.w3.org/2000/svg" id="' + dom_id + '" width="36" height="43" x="' + x + '" y="' + y + '" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="Icons/flag.png" /></a>');

  return dom_id;
}

//绘制多段线。返回绘制的多段线的DOM元素ID。
//element_id-包含要附加到的DOM元素ID的字符串。
//X-具有X坐标的数组。
//Y-具有Y坐标的数组。
//obj_name-带对象名称的字符串(如果没有名称，则为空字符串)。
//attr-包含多边形属性的字符串。
//Scale-缩放X、Y坐标的标量值(可选)。
function DrawPolyLine(element_id,X,Y,obj_name,attr,scale) {
  //创建点字符串(“x1，y1 x2，y2 x3，y3.”)：
  var poly_points = "";
  for(var i = 0; i < X.length; i++) poly_points += (scale*X[i]) + "," + (scale*Y[i]) + " ";
  
  //获取绘制对象DOM元素id：
  var dom_id = element_id + '_obj' + $('#'+element_id).children().length;

  $('#'+element_id).append('<a xmlns="http://www.w3.org/2000/svg"> <polyline xmlns="http://www.w3.org/2000/svg" id="' + dom_id + '" points="' + poly_points + '" ' + attr + ' /></a>');

  return dom_id;
}

//在给定起始坐标和结束坐标的情况下绘制线段。
function DrawLineSegment(element_id,x1,y1,x2,y2,attr,scale) {
  //获取绘制对象DOM元素id：
  var dom_id = element_id + '_line' + $('#'+element_id).children().length;

  //绘制线段：
  $('#'+element_id).append('<line xmlns="http://www.w3.org/2000/svg" id="' + dom_id + '" x1="' + x1*scale + '" x2="' + x2*scale + '" y1="' + y1*scale + '" y2="' + y2*scale + '" ' + attr + ' />');

  return dom_id;
}
  
//画点。
function DrawPoint(element_id,x,y,attr,scale) {
  //获取绘制对象DOM元素id：
  var dom_id = element_id + '_point' + $('#'+element_id).children().length;

  //绘制点：
  $('#'+element_id).append('<circle xmlns="http://www.w3.org/2000/svg" id="' + dom_id + '" cx="' + x*scale + '" cy="' + y*scale + '" ' + attr + ' />');

  return dom_id;
}

function HashObjectColor(name) {
  //可能的对象颜色列表：
  var objectColors = Array("#009900","#00ff00","#ccff00","#ffff00","#ffcc00","#ff9999","#cc0033","#ff33cc","#9933ff","#990099","#000099","#006699","#00ccff","#999900");
  
  //基于Object名称的伪随机化不区分大小写哈希：
  var hash = 0;
  name = name.toUpperCase(); 
  for(var i = 0; i < name.length;i++) {
    var tmp = name.substring(i,i+1);
    for(var j = 1; j <= 255; j++) {
      if(unescape('%'+j.toString(16)) == tmp) {
  hash += j;
  break;
      }
    }
  }
  hash = (((hash + 567) * 1048797) % objectColors.length);
  
  return objectColors[hash];
}

//填充多边形的内部输入是DOM元素ID。
function FillPolygon(id) {
  if(id) {
    $('#'+id).attr("fill",$('#'+id).attr("stroke"));
    $('#'+id).attr("fill-opacity","0.5");
  }
}
function ShadePolygon(id) {
  if(id) {
    $('#'+id).attr("fill",'red');
    $('#'+id).attr("fill-opacity","1");
    $('#'+id).attr("stroke-width", "0");
  }
}
    
