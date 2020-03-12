controllers.controller("batchAddIPCtrl", ["$scope", "$filter", "$modalInstance", "msgModal", "sysService", "loading", "errorModal", "ipService",
    function ($scope, $filter, $modalInstance, msgModal, sysService, loading, errorModal, ipService) {
    $scope.args = {
        fileName: "未选择文件",
        fileContent: "",
    };

    $scope.uploadUserCsv = function () {
        var input = document.getElementById("uploadFile");
        var file = input.files[0];
        $("#filename").val(file.name);
        // $scope.args.fileName = CWApp.uploadCsv("uploadFile", callBack);
    };

    $scope.downloadTemp = function () {
        window.open(site_url + "download_ip_temp/");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

    $scope.confirm = function () {
        CWApp.uploadCsv("uploadFile", callBack);
    };

    var callBack = function () {
        var content = fr.result;
        var content_list = content.substring(0, content.lastIndexOf("\n")).split("\n");
        var ip_list = [];
        var errors = [];
        var title = content_list[0].replace("\r", "").split(",");
        var column_len = title.length;
        if(column_len < 9){
            errors.push("导入文件字段有误，请重新下载模板！");
            errorModal.open(errors);
            return;
        }
        if(content_list.length <= 1){
            errors.push("导入文件内容为空，请检查导入文件！");
            errorModal.open(errors);
            return;
        }
        for(var i = 1; i < content_list.length; i++){
            var one_line = content_list[i].replace("\r", "").split(",");
            var one_line_list = [];
            for(var j = 0; j < one_line.length; j++){
                if(/^\"/.test(one_line[j])) {
                    var one_line_element = "";
                    while(true){
                        if(/\"$/.test(one_line[j])) {
                            one_line_element += one_line[j].replace(/\"$/,"");
                            break;
                        } else{
                            one_line_element += one_line[j].replace(/^\"/,"") + ","
                        }
                        j++
                    }
                    one_line_list.push(one_line_element)
                }else {
                    one_line_list.push(one_line[j])
                }
            }
            // 数据校验
            if(one_line_list[0] == ""){
                errors.push("第" + i + "条数据有误：网段不能为空！")
            }
            else {
                var tmp = one_line_list[0].split("/");
                if (tmp.length != 2) {
                    errors.push("第" + i + "条数据有误：网段格式有误!");
                }
                else {
                    if (!CWApp.isIP(tmp[0])) {
                        errors.push("第" + i + "条数据有误：网段格式有误!");
                    }
                    else if (!CWApp.isNum(tmp[1])) {
                        errors.push("第" + i + "条数据有误：网段格式有误!");
                    }
                    else if (tmp[1] < 0 || tmp[1] > 32) {
                        errors.push("第" + i + "条数据有误：网段格式有误!");
                    }
                }
            }
            if(one_line_list[1] == ""){
                errors.push("第" + i + "条数据有误：起始IP不能为空！")
            }
            else{
                var ipList = one_line_list[1].split(",");
                for (var m = 0; m < ipList.length; m++) {
                    if (!CWApp.isIP(ipList[m])) {
                        errors.push("第" + i + "条数据有误：起始IP格式不正确！");
                        break;
                    }
                }
            }
            if(one_line_list[2] != ""){
                if (!CWApp.isIP(one_line_list[2])) {
                    errors.push("第" + i + "条数据有误：结束IP格式不正确！");
                }
            }
            if(one_line_list[3] != ""){
                if (!CWApp.isNum(one_line_list[3])) {
                    errors.push("第" + i + "条数据有误：云区域必须为数字！");
                }
            }else {
                one_line_list[3] = "0"
            }
            if(one_line_list[4] == ""){
                errors.push("第" + i + "条数据有误：过期时间不能为空！")
            }
            else{
                var oneError = CWApp.ValidateDate($filter, one_line_list[4]);
                if (oneError != "") {
                    errors.push("第" + i + "条数据有误：" + oneError);
                }
            }
            if(one_line_list[5] == ""){
                errors.push("第" + i + "条数据有误：管理员不能为空！")
            }
            if(one_line_list[6] == ""){
                errors.push("第" + i + "条数据有误：管理员邮箱不能为空！")
            }
            else{
                if(!CWApp.isMail(one_line_list[6])){
                    errors.push("第" + i + "条数据有误：管理员邮箱格式不对！")
                }
            }

            // 自定义属性数据处理
            var ip_attr = [];
            for (var j = 9; j < column_len; j++) {
                var element_tmp = "";
                if(j < one_line_list.length) {
                    element_tmp = one_line_list[j]
                }
                if(/[*]$/.test(title[j]) && element_tmp == ""){
                    errors.push("第" + i + "条数据有误:"+title[j]+"不能为空！")
                }
                ip_attr.push({
                    key: title[j],
                    value: element_tmp
                })
            }

            if(errors.length > 0){
                errorModal.open(errors);
                return;
            }
            var expired_time = CWApp.myReplace(one_line_list[4]);
            var ip_obj = {
                ip_net: one_line_list[0],
                start_ip: one_line_list[1],
                end_ip: one_line_list[2],
                cloud_id: one_line_list[3],
                when_expired: one_line_list[4],
                owner: one_line_list[5],
                owner_mail: one_line_list[6],
                business: one_line_list[7],
                description: one_line_list[8],
                ip_attr: ip_attr
            };
            ip_list.push(ip_obj);
        }
        $scope.batchAddIP(ip_list);
    };

    $scope.batchAddIP = function (ip_list) {
        loading.open();
        ipService.batch_add_ip({}, ip_list, function (res) {
            loading.close();
            if(res.result){
                msgModal.open("success", "批量新增成功!");
            }
            else{
                errorModal.open(res.data);
            }
            $modalInstance.close();
        })
    }

}]);