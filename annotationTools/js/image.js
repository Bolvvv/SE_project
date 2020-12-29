/**@file包含图像类的文件。
*获取并操作将被批注的主图像。
*从HTML代码创建一个<img src.>标记，该标记带有id并传递
*此id在创建类时作为参数。
*/
/**
 * Creates an image object
 * @constructor
 * @param {string} id - The id of the dom element containing the image
*/
function image(id) {
    
    this.file_info = new file_info();
    this.contrast = 128;
    this.id = id;
    this.im = document.getElementById(this.id);
    this.width_orig;
    this.height_orig;
    this.width_curr;  //当前图片本身的宽度和高度
    this.height_curr;
    this.im_ratio; //(显示图像调光率)/(原始图像调光率)
    this.browser_im_ratio; //初始信息比(_R)，不能更改！！
    this.curr_frame_width;  //当前main_media的宽度
    this.curr_frame_height; //当前main_media的高度

    /**根据URL字符串获取新图像或在以下位置获取新图像
    *@param{function}onload_helper-指向
    *是在加载镜像时调用的。通常情况下，这是
    *将调用obj.SetImageDimensions()。
    */
    this.GetNewImage = function(onload_helper) {
	console.log('new image');
        document.getElementById('loading').style.visibility = 'visible';
        if(IsMicrosoft()) this.im.style.visibility = 'hidden';
        else this.im.style.display = 'none';
        this.image =  new Image();
        this.image.src  =  this.file_info.GetImagePath();
        this.image.onload = function (){
            onload_helper();
            main_media.contrast = 128;
            main_media.im.getContext('2d').drawImage(main_media.image,0,0,main_media.width_curr, main_media.height_curr);
            main_media.DisplayWithContrast(main_media.contrast);
        }
        wait_for_input = 0;
        edit_popup_open = 0;
    };
    
    /**返回可用宽高与原始宽高之比
    宽度/高度。
    */
    this.GetImRatio = function() {
        return this.im_ratio;
    };
    
    /**返回FILE_INFO对象，该对象包含有关
    *显示的图像。
    */
    this.GetFileInfo = function() {
        return this.file_info;
    };
 
    
    this.SetImageDimensions = function() {
        this.SetOrigImDims(this.image);
        var avail_width = this.GetAvailWidth();
        var avail_height = this.GetAvailHeight();
        var width_ratio = avail_width/this.width_orig;
        var height_ratio = avail_height/this.height_orig;
        
        if(width_ratio<height_ratio) this.im_ratio = width_ratio;
        else this.im_ratio = height_ratio;
        this.browser_im_ratio = this.im_ratio;
        
        this.width_curr = Math.round(this.im_ratio*this.width_orig);
        this.height_curr = Math.round(this.im_ratio*this.height_orig);
        
        this.im.width = this.width_curr;
        this.im.height = this.height_curr;
        $("#myCanvas_bg").width(this.width_curr).height(this.height_curr);
        $("#select_canvas").width(this.width_curr).height(this.height_curr);
        $("#draw_canvas").width(this.width_curr).height(this.height_curr);
        $("#query_canvas").width(this.width_curr).height(this.height_curr);
        
        
        this.curr_frame_width = this.width_curr;
        this.curr_frame_height = this.height_curr;
        
        document.getElementById('loading').style.visibility = 'hidden';
        document.getElementById('main_media').style.visibility = 'visible';
        
        if(IsMicrosoft()) {
            this.im.style.visibility = '';
            document.getElementById('main_media').style.overflow = 'visible';
            this.ScaleFrame();
        }
        else this.im.style.display = '';
    };
    
    
    /**如果(x，y)不在视图中，则将其滚动到视图中。调整后的回车
    *(x，y)考虑滑动偏移的点。
    *@param{int}x
    *@param{int}y
    *@return{intarray}
    */
    this.SlideWindow = function (x,y) {
        var pt = Array(2);
        if(!this.IsPointVisible(x,y)) {
            document.getElementById('main_media').scrollLeft = x-100;
            document.getElementById('main_media').scrollTop = y-100;
        }
        pt[0] = x-$("#main_media").scrollLeft();
        pt[1] = y-$("#main_media").scrollTop();
        return pt;
    };

    
    
    this.ScrollbarsOff = function () {
        if(!this.IsFitImage()) {
            document.getElementById('main_media').style.overflow = 'hidden';
        }
    };
    
    
    this.ScrollbarsOn = function () {
        if(!this.IsFitImage()) {
            document.getElementById('main_media').style.overflow = 'auto';
        }
    };
    
    this.Zoom = function(amt) {
        //如果在用户按缩放按钮的同时添加新多边形，则不执行任何操作。
        if(wait_for_input) return;
        
        //如果在用户按缩放按钮时正在编辑旧多边形，则关闭该多边形并缩放。
        if(edit_popup_open) StopEditEvent();
        
        if(amt=='fitted') {
                this.im_ratio = this.browser_im_ratio;
        } else {
                this.im_ratio = this.im_ratio * amt;
        }
        
        //如果比例因子低于原始比例，则不做任何操作(不要将图像调得太小)
        if(this.im_ratio < this.browser_im_ratio) {this.im_ratio=this.browser_im_ratio; return;}
        
        //新的缩放图片的宽度和高度
        this.width_curr = Math.round(this.im_ratio*this.width_orig);
        this.height_curr = Math.round(this.im_ratio*this.height_orig);
        
        //缩放并滚动图片，使中心保持在可见区域的中心
        this.ScaleFrame(amt);
        
    	//从绘图画布中移除多边形：
    	var anno = null;
    	if(draw_anno) {
    	  draw_anno.DeletePolygon();
    	  anno = draw_anno;
    	  draw_anno = null;
        }

        //设置图片大小(this.im为图片对象)
        this.im.width = this.width_curr;
        this.im.height = this.height_curr;
        //设置所有画布的大小
        $("#myCanvas_bg").width(this.width_curr).height(this.height_curr);
        $("#select_canvas").width(this.width_curr).height(this.height_curr);
        $("#draw_canvas").width(this.width_curr).height(this.height_curr);
        $("#query_canvas").width(this.width_curr).height(this.height_curr);

        main_media.DisplayWithContrast(main_media.contrast);
        //重画多边形。
    	main_canvas.RenderAnnotations();

    	if(anno) {
    	  draw_anno = anno;
    	  draw_anno.SetDivAttach('draw_canvas');
    	  draw_anno.DrawPolyLine(draw_x, draw_y);
    	}
        if (adjust_event){
            adjust_event.scale = main_media.GetImRatio();
            $('#'+adjust_event.polygon_id).parent().remove();
            adjust_event.polygon_id = adjust_event.DrawPolygon(adjust_event.dom_attach,adjust_event.x,adjust_event.y,adjust_event.obj_name,adjust_event.scale);
            select_anno.polygon_id = this.polygon_id;
            adjust_event.RemoveControlPoints();
            adjust_event.RemoveCenterOfMass();
            adjust_event.ShowCenterOfMass();
            adjust_event.ShowControlPoints();
        }

    	if (drawing_mode == 1){
    	  scribble_canvas.redraw();
    	  scribble_canvas.drawMask();
        }
    };
    
    
    /**告诉图片占用浏览器中的可用空间(如果需要)。6.29.06*/
    this.ScaleFrame = function(amt) {
        //查看可用的浏览器(Height，Width)和图片(Height，Width)
        //并将两者中较小的一个用于main_media(高度、宽度)。
        //也使图片居中，调整比例后，可见的中心像素保持在同一位置
        //var avail_Height=this.GetAvailHeight()；
        this.curr_frame_height = Math.min(this.GetAvailHeight(), this.height_curr);
        
        //var avail_width = this.GetAvailWidth();
        this.curr_frame_width = Math.min(this.GetAvailWidth(), this.width_curr);
        
        //也使图片居中，调整比例后，可见的中心像素保持在同一位置
        cx = $("#main_media").scrollLeft()+this.curr_frame_width/2.0; //当前中心
        cy = $("#main_media").scrollTop()+this.curr_frame_height/2.0;
        Dx = Math.max(0, $("#main_media").scrollLeft()+(amt-1.0)*cx); //需要位移
        Dy = Math.max(0, $("#main_media").scrollTop()+(amt-1.0)*cy);
        
        //设置宽度、高度和卷轴
        $("#main_media").scrollLeft(Dx).scrollTop(Dy);
        $("#main_media").width(this.curr_frame_width).height(this.curr_frame_height);
        
    };
    
    
    /**检索并设置原始图片的尺寸(宽/高)。
     * @param {image} im
    */
    this.SetOrigImDims = function (im) {
        this.width_orig = im.naturalWidth;
        this.height_orig = im.naturalHeight;
        return;
    };
    
    /**获取可用宽度(6.14.06)*/
    this.GetAvailWidth = function() {
        return $(window).width() - $("#main_media").offset().left -10 - 200;
        //我们可以使用$(“#anno_list”).offset().Left包含有关对象框大小的信息
    };
    
    /**获取可用高度(6.14.06)*/
    this.GetAvailHeight = function() {
        var m = main_media.GetFileInfo().GetMode();
        if(m=='mt') {
            return $(window).height() - $("#main_media").offset().top -75;
        }
        return $(window).height() - $("#main_media").offset().top -10;
    };
    
    /**如果图像缩放到原始(适合的)分辨率，则返回TRUE。*/
    this.IsFitImage = function () {
        return (this.im_ratio < 0.01+this.browser_im_ratio);
    };
    
    /**如果(x，y)可见，则返回TRUE。*/
    this.IsPointVisible = function (x,y) {        
        var scrollLeft = $("#main_media").scrollLeft();
        var scrollTop = $("#main_media").scrollTop();
        
        if(((x*this.im_ratio < scrollLeft) ||
            (x*this.im_ratio - scrollLeft > this.curr_frame_width - 160)) || 
           ((y*this.im_ratio < scrollTop) || 
            (y*this.im_ratio - scrollTop > this.curr_frame_height))) 
            return false; 
        return true;
    };
	this.ObtainImagePixels = function(){
		var c = document.getElementById('imcanvas');
		c.width = this.width_curr;
		c.height = this.height_curr;
		var ctx = c.getContext('2d');
		ctx.drawImage(this.image,0,0, main_media.width_curr, main_media.height_curr);
		data = ctx.getImageData(0,0, c.width, c.height);
        return data;
	}
    this.AugmentContrast = function(){
        this.contrast = this.contrast + 5;
        this.contrast = Math.min(this.contrast, 254);
        this.DisplayWithContrast(this.contrast);
    }
    this.ReduceContrast = function(){
        this.contrast = this.contrast - 5;
        this.contrast = Math.max(this.contrast, 1);
        this.DisplayWithContrast(this.contrast);
    }
	this.DisplayWithContrast = function(alpha){
		var data_im = this.ObtainImagePixels();
        var data = data_im.data;
		for (var i = 0; i < data.length; i+=4){
			for (var j = 0; j < 3; j++){
				var elem = data[i+j];
				if (elem < alpha){
					var elem_new = 128*(elem/alpha)
				}
				else {
					var elem_new = 128*(1+(elem - alpha)/(255-alpha));
				}
				data[i+j] = elem_new;
			}
		}
        data_im.data = data;
        main_media.im.getContext('2d').putImageData(data_im,0,0,0,0,main_media.width_curr, main_media.height_curr);

	}
    
}

