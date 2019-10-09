String.prototype.format = function() {
    var str = this;
    for (let key in arguments) {
        let reg = new RegExp("({)" + key + "(})", "g");
        str = str.replace(reg, arguments[key]);
    }
    return str;
}

var xurl = 'http://127.0.0.1:8001'
var xpaths = {
    segment: "basic",
    login  : "login",
    logout : "logout",
    profile: "profile",
    summary: "summary"
}

var xuserseg = {//用户登录/修改密码...
    path: xpaths.segment,
    name: "用户",
    columns: [
      {key:"name",hint:"用户名",type:xTypes._text,show:true,edit:false,create:true},
      {key:"passw",hint:"密码",type:xTypes._pass,show:true,edit:true,create:true}
    ]
};

var xuser;
var xsummary;
var xmodels;
var xlatestSeg;
var xlatestOp;

function xenum(key) {
    return xsummary.enums[key];
}

function doLogin() {
    let op = {
        name: "登录",
        path: xpaths.login
    };
    showDialog(xuserseg, op, undefined, onLogin);
}

function onLogin(data) {
    showUser(data);
    showSummary();
}

function showUser(user) {
    xuser = user;
    $('#xuser').empty();
    $('#xuser').append(x.userhtm(user.name));

    $('#xboxhead').append('<h3>Welcome</h3>');

    xclick($('#xuser_logout'), function(){
        doGet('{0}/{1}'.format(xpaths.segment, xpaths.logout), function(resp){
            xuser = undefined;
            location.reload();
        });
    });

    xclick($('#xuser_profile'), function(){
        let op = {
            name: "修改密码",
            path: xpaths.profile
        };
        let model = {
            name: xuser.name,
            passw: ''
        }
        showDialog(xuserseg, op, model, function(){});
    });
}

function showSummary() {
    doGet('{0}/{1}'.format(xpaths.segment, xpaths.summary), showSiderbar);
}

function showSiderbar(data) {
    xsummary = data;
    for(let chapter of data.chapters){
        $('#xsiderbar').append(x.chapterhtm(chapter));
        for(let segment of chapter.segments){//二级菜单
            segment.spath = chapter.path;
            x.chapterdom(chapter).append(x.segmenthtm(segment));
            xclick(x.segmentdom(segment), showDetailFunc(segment));
        }
    }
}

function queryDatasFunc(segment, op) {
    return function() {
        let params = {};
        for(let input of op.inputs) {
            params[input.key] = x.qryInputDom(input.key).val();
        }
        doGet('{0}/{1}?{2}'.format(segpath(segment), op.path, ($.param(params))), function(data){showDetailBody(segment, data);});
    }
}

function showDetailFunc(segment) {
    return function() {
        if(xlatestSeg)
           x.segmentdom(xlatestSeg).removeClass('active'); 
        xlatestSeg = segment;
        x.segmentdom(segment).addClass('active');
        doGet(segpath(segment), function(data){showDetail(segment, data);});
    };
}

var _op;
function showDetail(segment, data) {
    xmodels = data;
    $('#xthead').empty();
    $('#xboxhead').empty();

    _op = false;

    let _tr = 0;
    //box head
    for(let op of segment.options) {
        if(op.opType == 1) {//only query use inputs
            for(let input of op.inputs) {
                x.addQryInput($('#xboxhead'), input);
            }
            $('#xboxhead').append(x.qryBtn.format(segment.path, _tr, op.name));
            xclick(x.qryBtnDom(segment.path, _tr), queryDatasFunc(segment, op)) 
        }
        if(op.opType == 2) {
            $('#xboxhead').append(x.addBtn.format(segment.path, _tr, op.name));
            xclick(x.addBtnDom(segment.path, _tr), showDialogFunc(segment, op));
        }
        if(op.opType == 3) _op = true;
        if(op.opType == 4) _op = true;
    }

    //box body --> table
    //table head
    $('#xthead').append($(x.tabletr.format(_tr)))
    for(let column of segment.columns){
        if(column.show) {
            x.tabletrDom(_tr).append($(x.tabletd.format(_tr, 0, column.hint)));
        }
    }
    if(_op) {//options td head
        x.tabletrDom(_tr).append($(x.tabletd.format(_tr, 0, "Options")));    
    }

    //table body
    showDetailBody(segment, data);
}

function showDetailBody(segment, data) {
    $('#xtbody').empty();

    let _tr = 0;
    //table body
    for(let model of data) {
        model._id = (++ _tr);
        $('#xtbody').append($(x.tabletr.format(_tr)))
        var _td = 0;
        for(let column of segment.columns){
            if(column.show) {
                x.tabletrDom(_tr).append($(x.tabletd.format(_tr, (++_td), model[column.key])));
            }
        }
        //options td
        if(_op) {
            x.tabletrDom(_tr).append($(x.tabletd.format(_tr, (++_td), '')));
            for(let op of segment.options) {
                if(op.opType == 3) {
                    x.tabletdDom(_tr, _td).append(x.edtBtn.format(segment.path, _tr, op.name));
                    xclick(x.edtBtnDom(segment.path, _tr), showDialogFunc(segment, op, model));
                }
                if(op.opType == 4) {
                    x.tabletdDom(_tr, _td).append(x.delBtn.format(segment.path, _tr, op.name));
                    xclick(x.delBtnDom(segment.path, _tr), showDialogFunc(segment, op, model));
                }
            }
        }
    }
}


function showDialogFunc(segment, op, model=undefined) {
    return function() {
        showDialog(segment, op, model, function(data){showDetailBody(segment, data)});
    };
}

function dialogTitle(segment, op) {
    return '{0}&nbsp;/&nbsp;{1}'.format(segment.name, op.name)
}

function showDialog(segment, op, model, func) {
    $('#xdialog_title').empty();
    $('#xdialog_form').empty();

    $('#xdialog_title').append(dialogTitle(segment, op))
    for(let column of segment.columns){
      if(!column.create) continue;
      let val = model ? model[column.key] : '';
      x.addDlgInput($('#xdialog_form'), column, segment.path, val);
      if ((model && !column.edit) || op.opType == 4) {
        x.dlgInputDom(segment.path, column.key).attr("disabled", true);
      }
    }
    xclick($('#xdialog_submit'), function(){submitDialog(segment, op, func);})
    modalShow();
}

function submitDialog(segment, op, func) {
    var model = {};
    for(let column of segment.columns) {
        let key = column.key;
        model[key] = x.dlgInputDom(segment.path, key).val();
        if(column.type==xTypes._pass) model[key]=$.md5(model[key]);
    }
    xlatestOp = op;
    doPost('{0}/{1}'.format(segpath(segment), op.path), model,
        function(resp) {
            modalHide();
            func(resp);
        }
    );
}

function modalShow() {
    $('#xdialog').modal('show');
}

function modalHide() {
    $('#xdialog').modal('hide');
}

function segpath(segment) {
    return segment.spath ? '{0}/{1}'.format(segment.spath, segment.path) : segment.path;
}

function xtoken() {
    return xuser ? xuser.token : '';
}

function doPost(path, data, func) {
    $.ajax({
        type: 'post',
        url: '{0}/{1}'.format(xurl, path),
        data: JSON.stringify(data),
        headers: {"x-token": xtoken()},
        dataType: 'json',
        success: doResp(func)
    });
}

function doGet(path, func) {
    $.ajax({
        type: 'get',
        url: '{0}/{1}'.format(xurl, path),
        headers: {"x-token": xtoken()},
        dataType: 'json',
        success: doResp(func)
    });
}

var xtoast = {
    show: function(type, msg) {
            Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500
        }).fire({
            type: type,
            title: msg
        });
    },
    succ : function(msg) {this.show('success', msg)},
    error: function(msg) {this.show('error', msg)}
}

function doResp(func) {
    return function(resp) {
        if(resp.status == -1) {
            xtoast.error('{0} 失败'.format(xlatestOp.name));
        } else if(xlatestOp) {
            xtoast.succ('{0} 成功'.format(xlatestOp.name));
            func(resp.data);
        } else {
            func(resp.data);
        }
        xlatestOp = undefined;
    }
}

function xclick(btn, func) {
    btn.off('click');
    btn.click(func);
}

function initial() {
// popup dialog keypress listening
    $('#xdialog').on('hide.bs.modal ', function(){
        $(document).off('keyup');
    });
    $('#xdialog').on('shown.bs.modal', function(){
        $('#xdialog').focus();
        $(document).on('keyup', function(e){
            if(e.keyCode==13) {$("#xdialog_submit").trigger('click');}
            if(e.keyCode==27) {$("#xdialog_close").trigger('click');}
        });
    });
}

$(function () {
    initial();
    doLogin();
});