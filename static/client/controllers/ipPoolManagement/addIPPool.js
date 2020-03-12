controllers.controller('addIPPool', function ($scope, ipPoolService, ipService, errorModal, $modalInstance, loading, msgModal) {
    $scope.title = "添加IP资源池";
    $scope.is_modify = false;
    $scope.args = {
        title: "",
        ip_net: "",
        cloud_id: "",
        gate_way: "",
        dns: "",
        attr_list: []
    };

    // 搜索资源池自定义属性
    $scope.init = function () {
        loading.open();
        ipService.search_attr_list({}, {attr_type: "pool"}, function (res) {
            loading.close();
            if (res.result) {
                $scope.args.attr_list = res.data;
            }
        })
    };
    $scope.init();
    $scope.is_submit = false
    $scope.confirm = function () {
        $scope.is_submit = true
        var errors = validateObj();
        if (errors.length > 0) {
            return;
        }
        if (!$scope.args.cloud_id)
            $scope.args.cloud_id = '0';
        loading.open("", ".addIPPool");
        ipPoolService.create_ip_pool({}, $scope.args, function (res) {
            loading.close(".addIPPool");
            if (res.result) {
                msgModal.open("success", "添加成功");
                $modalInstance.close(res.data);
            } else {
                errorModal.open(res.data);
            }
        })
    };
    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };
    $scope.rules = {}
    var validateObj = function () {
        var errors = [];
        $scope.rules = {
            ip_net: '',
            cloud_id: '',
            gate_way: '',
            dns: '',
        }
        if ($scope.args.title === "") {
            errors.push("名称不能为空！");
        }
        if ($scope.args.ip_net === "") {
            errors.push("网段不能为空！");
            $scope.rules.ip_net = "网段不能为空！";
        } else {
            var tmp = $scope.args.ip_net.split("/");
            if (tmp.length !== 2 || !CWApp.isIP(tmp[0]) || !CWApp.isNum(tmp[1]) || (tmp[1] < 0 || tmp[1] > 32)) {
                errors.push("网段格式有误!");
                $scope.rules.ip_net = "网段格式有误！";
            }
        }
        if ($scope.args.cloud_id === '') {
            errors.push("云区域不能为空!");
            $scope.rules.cloud_id = "云区域不能为空!";
        } else if (!CWApp.isNum($scope.args.cloud_id)) {
            errors.push("云区域必须为数字!");
            $scope.rules.cloud_id = "云区域必须为数字!";
        }
        if ($scope.args.gate_way === "") {
            errors.push("网关不能为空！");
            $scope.rules.gate_way = "网关不能为空！";
        } else {
            if (!CWApp.isIP($scope.args.gate_way)) {
                errors.push("网关格式有误!");
                $scope.rules.gate_way = "网关格式有误！";
            }
        }
        if ($scope.args.dns === "") {
            errors.push("DNS服务器不能为空！");
            $scope.rules.dns = "DNS服务器不能为空！"
        } else {
            if (!CWApp.isIP($scope.args.dns)) {
                errors.push("DNS服务器格式有误!");
                $scope.rules.dns = "DNS服务器格式有误！"
            }
        }
        for (var i = 0; i < $scope.args.attr_list.length; i++) {
            if ($scope.args.attr_list[i].is_required && $scope.args.attr_list[i].value == "") {
                errors.push($scope.args.attr_list[i].cn_name + "不能为空！");
            }
        }
        return errors;
    }
});