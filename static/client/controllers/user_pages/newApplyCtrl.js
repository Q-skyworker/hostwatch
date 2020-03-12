controllers.controller("newApplyCtrl", function ($scope, sysService, ipService, ipPoolService, $filter, loading, errorModal, $modalInstance, applyService, msgModal) {
    $scope.title = "新增申请";
    $scope.flag = false;
    var date_now = new Date();

    $scope.DateStart = date_now.setDate(date_now.getDate() + 30);
    $scope.ip_pool_list = [];
    $scope.business_list = [];
    $scope.isModify = true;
    $scope.applyObj = {
        ip_type: "00",
        business: "",
        ips: "",
        start_ip: "",
        end_ip: "",
        when_expired: $filter('date')($scope.DateStart, 'yyyy-MM-dd'),
        apply_reason: "",
        description: "",
        ip_pool_id: "",
        cloud_id: "",
        net_mask: "",
        dns: "",
        gate_way: "",
        attr_list: [],
        email: current_email,
        status: "00"
    };

    // 查询IP自定义属性
    ipService.search_attr_list({}, {attr_type: "ip"}, function (res) {
        if (res.result) {
            $scope.applyObj.attr_list = res.data;
        }
    });

    //IP地址池和业务加载
    $scope.init = function () {
        loading.open();
        ipPoolService.get_ip_pools({}, {}, function (res) {
            if (res.result)
                $scope.ip_pool_list = res.data;
            $scope.applyObj.ip_pool_id = $scope.ip_pool_list[0]['id'];
            $scope.change_pool($scope.applyObj.ip_pool_id)
        });
        sysService.search_business({}, {}, function (res) {
            loading.close();
            if (res.result)
                $scope.business_list = res.data;
            $scope.applyObj.business = $scope.business_list[0]['bk_biz_name']
        });
    };
    $scope.init();

    $scope.change_pool = function (pool_id) {
        $scope.isModify = true;
        $scope.applyObj.dns = "";
        $scope.applyObj.gate_way = "";
        $scope.applyObj.net_mask = "";
        loading.open();
        sysService.get_pool_settings({}, {pool_id: pool_id}, function (res) {
            loading.close();
            if (res.result) {
                $scope.applyObj.dns = res.dns;
                $scope.applyObj.gate_way = res.gate_way;
                $scope.applyObj.net_mask = res.net_mask;
                $scope.applyObj.cloud_id = res.cloud_id;
                if ($scope.applyObj.net_mask == "") {
                    $scope.isModify = false;
                }
            }
        })
    };

    $scope.is_submit = false
    $scope.save = function () {
        $scope.applyObj.status = "03";
        loading.open();
        applyService.create_apply({}, $scope.applyObj, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "保存成功");
                $modalInstance.close();
            } else {
                errorModal.open(res.data);
            }
        })

    };

    $scope.commit = function () {
        $scope.is_submit = true
        $scope.applyObj.status = "00";
        var errors = validate($scope.applyObj);
        if (errors.length > 0) {
            return;
        }
        loading.open();
        applyService.create_apply({}, $scope.applyObj, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "提交成功");
                $modalInstance.close();
            } else {
                errorModal.open(res.data);
            }
        })
    };

    $scope.cancel = function () {
        $modalInstance.close();
    };

    $scope.rules = {}
    var validate = function (data) {
        var rules = {
            dns: '',
            reason: '',
            ip: '',
            email: '',
            time: '',
            start_ip: '',
        };
        var errors = []
        if (!CWApp.isMail(data.email)) {
            errors.push("邮箱格式有误！");
            rules.email = "邮箱格式有误！"
        } else if (data.email === "") {
            rules.email = "邮箱不能为空！"
        }
        if (data.apply_reason == "") {
            errors.push("申请理由不能为空！")
            rules.reason = "申请理由不能为空！"
        } else if (data.apply_reason.length > 100) {
            errors.push("申请理由超过100个字！")
            rules.reason = "申请理由超过100个字！"
        }
        var oneError = CWApp.ValidateDate($filter, data.when_expired);
        if (oneError != "") {
            errors.push("所选时间比当前时间小");
            rules.time = "所选时间比当前时间小"
        }
        if (data.ip_type == "00") {
            if (data.ips == "") {
                errors.push("IP不能为空！")
                rules.ip = "IP不能为空！"
            } else {
                var ipList = data.ips.split(",");
                for (var i = 0; i < ipList.length; i++) {
                    if (!CWApp.isIP(ipList[i])) {
                        errors.push("IP格式不正确！");
                        rules.ip = "IP格式不正确！"
                        break;
                    }
                }
            }
        } else {
            if (!CWApp.isIP(data.start_ip)) {
                errors.push("起始IP格式不正确！");
                rules.start_ip = "起始IP格式不正确！"
            }
            if (!CWApp.isIP(data.end_ip)) {
                errors.push("结束IP格式不正确！");
                rules.start_ip = "结束IP格式不正确！"
            }
            var start_ips = data.start_ip.split('.');
            var end_ips = data.end_ip.split('.');
            for (var i = 0; i < 4; i++) {
                if (Number(start_ips[i]) > Number(end_ips[i])) {
                    errors.push("网段区域不正确！");
                    rules.start_ip = "网段区域不正确！"
                    break;
                }
            }
        }
        if (data.dns == "") {
            errors.push("DNS服务器不能为空！");
            rules.dns = "DNS服务器不能为空！"
        } else {
            if (!CWApp.isIP(data.dns)) {
                errors.push("DNS服务器格式有误!");
                rules.dns = "DNS服务器格式有误!"
            }
        }
        for (var i = 0; i < data.attr_list.length; i++) {
            if (data.attr_list[i].is_required && data.attr_list[i].value == "") {
                errors.push(data.attr_list[i].cn_name + "不能为空！")
            }
        }
        $scope.rules = rules
        return errors;
    }
});