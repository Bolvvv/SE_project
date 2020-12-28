/**@用户输入其LabelMe用户名的文件登录表单。*/
//这段代码对于它所做的事情来说非常复杂。
//需要优化
//PlaceSignInHTML()比较复杂。需要使所有元素更加明确。


function initUserName() {
    //我们第一次获取用户名时，会优先考虑传递的用户名
    //在URL中，因为它可能来自LabelMe浏览器。
    username = getQueryVariable("username");

    if (!username || (username.length==0)) {
        username = getCookie("username");
        if (!username || (username.length==0)) {
            username = "anonymous";
        }
    }
    
    if (username=="null") {username = "anonymous";}
    
    setCookie("username",username);
    $("#usernametxt").text(username);
}

function show_enterUserNameDIV() {
    //此函数简单地交换div以显示“changeAndDisplayUserName”div
    $("#display_user").hide();
    $("#enterUserName").show();
    //将光标放在文本框内
    document.getElementById('userEnter').focus();
    document.getElementById('userEnter').select();

    return false;
}

function changeAndDisplayUserName(c) {
    //显示输入的名称。
    //c是产生退出文本框的密钥。
    //只有用户按“Enter”键才能更改用户名->c==13
    if (c==13){
        username = $("#userEnter").val();
    
        if (username.length==0) {
            username = getCookie("username");
        }   
    
        setCookie("username",username);
        $("#usernametxt").text(username);
    }

    $("#display_user").show();
    $("#enterUserName").hide();
}
