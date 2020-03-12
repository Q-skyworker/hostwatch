controllers.controller('modifyIPPool', function ($scope, ipPoolService,itemObj, errorModal, $modalInstance, loading, msgModal) {
    $scope.title = "修改IP资源池";
    $scope.args = itemObj;
    $scope.is_modify = true;
    $scope.confirm = function () {
        var errors = validateObj();
        if (errors.length > 0) {
            errorModal.open(errors);
            return;
        }
        if (!$scope.args.cloud_id)
            $scope.args.cloud_id = '0';
        loading.open();
        ipPoolService.modify_ip_pool({}, $scope.args, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "修改成功");
                $modalInstance.close(res.data);
            }
            else {
                errorModal.open(res.data);
            }
        })
    };
    $scope.cancel = function () {
        $modalInstance.dismiss("cancel");
    };

    var validateObj = function () {
        var errors = [];
        if ($scope.args.title === "") {
            errors.push("名称不能为空！");
        }
        if ($scope.args.ip_net === "") {
            errors.push("网段不能为空！");
        }
        else {
            var tmp = $scope.args.ip_net.split("/");
            if (tmp.length != 2) {
                errors.push("网段格式有误!");
            }
            else {
                if (!CWApp.isIP(tmp[0])) {
                    errors.push("网段格式有误!");
                }
                else if (!CWApp.isNum(tmp[1])) {
                    errors.push("网段格式有误!");
                }
                else if (tmp[1] < 0 || tmp[1] > 24) {
                    errors.push("网段格式有误!");
                }
            }
        }
        if ($scope.args.cloud_id && !CWApp.isNum($scope.args.cloud_id)) {
                errors.push("云区域必须为数字!");
        }
        return errors;
    }
});