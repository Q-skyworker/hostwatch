controllers.controller("ipDetectionCtrl", ["$scope", "loading", "ipService", "errorModal", function ($scope, loading, ipService, errorModal) {
    $scope.filterObj = {
        ip_type: "00",
        ips: "",
        start_ip: "",
        end_ip: "",
        cloud_id: "",
    };

    $scope.flag = false;

    $scope.use_list = [];
    $scope.unused_list = [];

    $scope.searchIPs = function () {
        var errors = validate();
        if (errors.length > 0) {
            errorModal.open(errors);
            return;
        }
        if (!$scope.filterObj.cloud_id){
            $scope.filterObj.cloud_id = '0';
        }
        loading.open();
        ipService.allocation_search($scope.filterObj, {}, function (res) {
            loading.close();
            if (res.result) {
                $scope.use_list = res.use;
                $scope.unused_list = res.unused;
                $scope.flag = true;
            }
            else
                errorModal.open(res.data);
        })
    };

    var validate = function () {
        var errors = [];
        if ($scope.filterObj.ip_type == "00") {
            var ip_list = $scope.filterObj.ips.split(",");
            for (var i = 0; i < ip_list.length; i++) {
                if (ip_list[i] == "") {
                    errors.push("IP地址不能是空的！");
                    break;
                }
                if (!CWApp.isIP(ip_list[i])) {
                    errors.push(ip_list[i] + "的IP地址格式不正确！");
                    break;
                }
            }
        }
        else {
            if (!CWApp.isIP($scope.filterObj.start_ip)) {
                errors.push("起始IP格式不正确！");
            }
            else if ($scope.filterObj.start_ip == "") {
                errors.push("起始IP地址不能是空的！")
            }
            if (!CWApp.isIP($scope.filterObj.end_ip)) {
                errors.push("结束IP格式不正确！");
            }
            else if ($scope.filterObj.end_ip == "") {
                errors.push("结束IP地址不能是空的！")
            }
        }
        if ($scope.filterObj.cloud_id && !CWApp.isNum($scope.filterObj.cloud_id)) {
                errors.push("云区域必须为数字!");
        }
        return errors;
    }
}]);