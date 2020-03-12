controllers.controller("addKeepCtrl", function ($scope, $filter, loading, errorModal, $modalInstance, ipService, sysService, ipPoolService, msgModal) {
    $scope.title = "新增保留";
    var date_now = new Date();
    $scope.userList = [];
    $scope.DateStart = date_now.setDate(date_now.getDate() + 30);

    $scope.ip_pool_list = [];
    ipPoolService.get_ip_pools({}, {}, function (res) {
        if (res.result)
            $scope.ip_pool_list = res.data;
    });
    var current_user = 0
    $scope.isModify = true;
    $scope.ipObj = {
        ipType: "00",
        ips: "",
        business: "",
        start_ip: "",
        end_ip: "",
        when_expired: "",
        description: "",
        owner: current_user,
        ip_pool_id: "",
        cloud_id: "",
        owner_mail: "",
        net_mask: "",
        gate_way: "",
        dns: "",
        attr_list: []
    };

    // 查询自定义属性
    ipService.search_attr_list({}, {attr_type: "ip"}, function (res) {
        if (res.result) {
            $scope.ipObj.attr_list = res.data;
        }
    });

    $scope.init = function () {
        loading.open();
        sysService.search_all_users({}, {}, function (res) {
            loading.close();
            if (res.result) {
                $scope.userList = res.data;
                for (var i = 0; i < $scope.userList.length; i++) {
                    if ($scope.userList[i].text == current_user) {
                        $scope.ipObj.owner = $scope.userList[i].id;
                        $scope.ipObj.owner_mail = $scope.userList[i].email;
                        break;
                    }
                }
            } else {
                errorModal.open(res.data);
            }
        })
    };
    $scope.init();

    $scope.userOption = {
        data: "userList",
        modelData: "ipObj.owner"
    };

    $scope.changeMail = function () {
        for (var i = 0; i < $scope.userList.length; i++) {
            if ($scope.userList[i].id == $scope.ipObj.owner) {
                $scope.ipObj.owner_mail = $scope.userList[i].email;
                break;
            }
        }
    };

    $scope.change_pool = function (pool_id) {
        $scope.isModify = true;
        $scope.ipObj.dns = "";
        $scope.ipObj.net_mask = "";
        $scope.ipObj.gate_way = "";
        loading.open();
        sysService.get_pool_settings({}, {pool_id: pool_id}, function (res) {
            loading.close();
            if (res.result) {
                $scope.ipObj.dns = res.dns;
                $scope.ipObj.gate_way = res.gate_way;
                $scope.ipObj.net_mask = res.net_mask;
                $scope.ipObj.cloud_id = res.cloud_id
                if ($scope.ipObj.net_mask == "") {
                    $scope.isModify = false;
                }
            } else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.is_submit = false
    $scope.confirm = function () {
        $scope.is_submit = true
        var errors = validate();
        if (errors.length > 0) {
            return;
        }
        loading.open();
        for (var i in $scope.userList) {
            if ($scope.userList[i].id == $scope.ipObj.owner) {
                $scope.ipObj.owner_name = $scope.userList[i].text;
            }
        }
        ipService.create_keep_ips({}, $scope.ipObj, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "新增成功");
                $modalInstance.close();
            } else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

    $scope.rules = {}
    var validate = function () {
        var errors = [];
        $scope.rules = {
            ips: '',
            start_ip: '',
            gate_way: '',
            dns: ''
        }
        if ($scope.ipObj.ip_pool_id == "") {
            errors.push("IP资源池未选择！");
        }
        if ($scope.ipObj.ipType == "00") {
            var ipList = $scope.ipObj.ips.split(",");
            for (var i = 0; i < ipList.length; i++) {
                if (!CWApp.isIP(ipList[i])) {
                    errors.push("IP格式不正确！");
                    $scope.rules.ips = "IP格式不正确！";
                    break;
                }
            }
        } else {
            if (!CWApp.isIP($scope.ipObj.start_ip)) {
                errors.push("起始IP格式不正确！");
                $scope.rules.start_ip = "起始IP格式不正确！";
            }
            if (!CWApp.isIP($scope.ipObj.end_ip)) {
                errors.push("结束IP格式不正确！");
                $scope.rules.start_ip = "结束IP格式不正确！";
            }
        }
        if ($scope.ipObj.gate_way == "") {
            $scope.rules.gate_way = "网关不能为空！";
        } else {
            if (!CWApp.isIP($scope.ipObj.gate_way)) {
                errors.push("网关格式有误!");
                $scope.rules.gate_way = "网关格式有误!"
            }
        }
        if ($scope.ipObj.dns == "") {
            errors.push("DNS服务器不能为空！");
            $scope.rules.dns = "DNS服务器不能为空！";
        } else {
            if (!CWApp.isIP($scope.ipObj.dns)) {
                errors.push("DNS服务器格式有误!");
                $scope.rules.dns = "DNS服务器格式有误!";
            }
        }
        if (String($scope.ipObj.owner) === "") {
            errors.push("管理员未指定！");
        }
        for (var i = 0; i < $scope.ipObj.attr_list.length; i++) {
            if ($scope.ipObj.attr_list[i].is_required && $scope.ipObj.attr_list[i].value == "") {
                errors.push($scope.ipObj.attr_list[i].cn_name + "不能为空！")
            }
        }
        return errors;
    };
});