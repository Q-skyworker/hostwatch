controllers.controller('addCustomCtrl', ["$scope", "sysService", "errorModal", "$modalInstance", "loading", "msgModal", function ($scope, sysService, errorModal, $modalInstance, loading, msgModal) {
    $scope.title = "添加自定义字段";
    $scope.is_modify = false;
    $scope.args = {
        attr_type: "",
        name: "",
        cn_name: "",
        description: "",
        is_required: false,
    };

    $scope.is_submit = false
    $scope.confirm = function () {
        var errorList = validateObj();
        $scope.is_submit = true
        if (errorList.length > 0) {
            return;
        }
        loading.open();
        sysService.add_custom_attr({}, $scope.args, function (res) {
            loading.close();
            if (res.result) {
                msgModal.open("success", "添加成功");
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
    var validateObj = function () {
        var errors = [];
        $scope.rules = {
            name: '',
            cn_name: ''
        }
        if ($scope.args.attr_type == "") {
            errors.push("请选择类型！");
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