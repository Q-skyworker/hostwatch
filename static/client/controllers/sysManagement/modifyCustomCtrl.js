controllers.controller('modifyCustomCtrl', ["$scope", "sysService", "errorModal", "$modalInstance", "loading", "msgModal", "itemObj", function ($scope, sysService, errorModal, $modalInstance, loading, msgModal, itemObj) {
    $scope.title = "编辑自定义字段";
    $scope.is_modify = true;

    $scope.init = function () {
        loading.open();
        sysService.get_custom_attr({id: itemObj.id}, {}, function (res) {
            loading.close();
            if (res.result) {
                $scope.args = res.data;
            } else {
                $scope.args.is_modify = true;
                errorModal.open(res.data);
            }
        })
    };
    $scope.init();

    $scope.is_submit = false
    $scope.confirm = function () {
        var errorList = validateObj();
        $scope.is_submit = true
        if (errorList.length > 0) {
            return;
        }
        loading.open();
        sysService.modify_custom_attr({}, $scope.args, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "编辑成功");
                $modalInstance.close();
            } else {
                errorModal.open(res.data);
                $modalInstance.close();
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
            name: '',
            cn_name: ''
        }
        if ($scope.args.name == "") {
            errors.push("字段名称不能为空！");
            $scope.rules.name = "字段名称不能为空！"
        } else if (!CWApp.isEng($scope.args.name)) {
            errors.push("字段名称不允许有中文和特殊符号！");
            $scope.rules.name = "字段名称不允许有中文和特殊符号！"
        }
        if ($scope.args.cn_name == "") {
            errors.push("显示名称不能为空！");
            $scope.rules.cn_name = "显示名称不能为空！";
        } else if (/[*]$/.test($scope.args.cn_name)) {
            errors.push("显示名称结尾不能为【*】！")
            $scope.rules.cn_name = "显示名称结尾不能为【*】！"
        } else if (/[,]/.test($scope.args.cn_name)) {
            errors.push("显示名称不能含有【,】！")
            $scope.rules.cn_name = "显示名称不能含有【,】！"
        }
        return errors;
    }
}]);