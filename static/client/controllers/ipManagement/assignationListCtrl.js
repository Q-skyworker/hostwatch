controllers.controller('assignationListCtrl', ["$scope", "ipService", "loading", "errorModal", function ($scope, ipService, loading, errorModal) {
    $scope.filterObj = {
        ip_type: "00",
        ips: "",
        start_ip: "",
        end_ip: "",
        cloud_id: "",
    };

    $scope.flag = "";

    $scope.result_list = [];

    $scope.searchIPs = function () {
        var errors = validate();
        if (errors.length > 0) {
            errorModal.open(errors);
            return;
        }
        if (!$scope.filterObj.cloud_id) {
            $scope.filterObj.cloud_id = '0';
        }
        loading.open();
        ipService.allocation_search($scope.filterObj, {}, function (res) {
            loading.close();
            if (res.result) {
                $scope.use_list = res.use;
                $scope.unused_list = res.unused;
                $scope.flag = "01";
            } else
                errorModal.open(res.data);
        })
    };

    $scope.detectIPs = function () {
        var errors = validate();
        if (errors.length > 0) {
            errorModal.open(errors);
            return;
        }
        loading.open();
        ipService.detect_ips($scope.filterObj, {}, function (res) {
            loading.close();
            if (res.result) {
                $scope.use_list = res.use;
                $scope.unused_list = res.unused;
                $scope.flag = "00";
            } else
                errorModal.open(res.data);
        })
    };

    $scope.gridOptions = {
        data: "result_list",
        columnDefs: [
            {field: "ip", displayName: "IP地址"}
        ]
    };

    var validate = function () {
        var errors = [];
        if ($scope.filterObj.ip_type == "00") {
            if ($scope.filterObj.ips === "") {
                errors.push("IP地址不能为空！");
            } else {
                var ip_list = $scope.filterObj.ips.split(",");
                for (var i = 0; i < ip_list.length; i++) {
                    if (!CWApp.isIP(ip_list[i])) {
                        errors.push(ip_list[i] + "的IP地址格式不正确！");
                        break;
                    }
                }
            }
        } else {
            if ($scope.filterObj.start_ip === "") {
                errors.push("起始IP地址不能为空！");
            } else if (!CWApp.isIP($scope.filterObj.start_ip)) {
                errors.push("起始IP格式不正确！");
            }
            if ($scope.filterObj.start_ip === "") {
                errors.push("结束IP地址不能为空！");
            } else if (!CWApp.isIP($scope.filterObj.end_ip)) {
                errors.push("结束IP格式不正确！");
            }
        }
        if ($scope.filterObj.cloud_id && !CWApp.isNum($scope.filterObj.cloud_id)) {
            errors.push("云区域必须为数字!");
        }
        return errors;
    }
}]);