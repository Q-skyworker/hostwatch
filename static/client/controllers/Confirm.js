controllers.controller('confirm', ["$scope", "$modalInstance", "options", function ($scope, $modalInstance, options) {
    $scope.typeList = {
        modify: "编辑",
        delete: "删除",
        sync: "同步",
        export: "导出",
        judge: "审批",
        commit: "提交",
        upload: "上缴",
    };

    $scope.text = options.text;
    $scope.type = options.type;

    $scope.confirm = function () {
        $modalInstance.close();
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);